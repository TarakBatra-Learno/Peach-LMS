/**
 * student-permissions.ts
 *
 * Pure projection/filter functions that return student-safe view models.
 * No student UI component should ever receive raw teacher entities —
 * all data passes through these projections first.
 *
 * Pattern: Store (raw) → student-selectors.ts → student-permissions.ts (projection) → Student UI
 */

import type { Assessment } from "@/types/assessment";
import type { UnitPlan, LessonPlan, LessonSlotAssignment } from "@/types/unit-planning";
import type { GradeRecord } from "@/types/gradebook";
import type { Report } from "@/types/report";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Announcement, ThreadReply } from "@/types/communication";

// ─── Projected View Models ──────────────────────────────────────────────────

/** Student-safe assessment view — strips teacher-internal fields */
export interface StudentAssessmentView {
  id: string;
  title: string;
  description: string;
  classId: string;
  gradingMode: string;
  dueDate: string;
  totalPoints?: number;
  studentInstructions?: string;
  studentResources?: { label: string; url: string }[];
  learningGoalIds: string[];
  standardIds?: string[];
  unitId?: string;
  /** Whether grades have been released for this assessment */
  gradesReleased: boolean;
}

/** Student-safe unit plan view — title + code only */
export interface StudentUnitPlanView {
  id: string;
  title: string;
  code?: string;
  classId: string;
  startDate: string;
  endDate: string;
  status: string;
}

/** Student-safe lesson plan view — title + objectives only */
export interface StudentLessonPlanView {
  id: string;
  title: string;
  objectives?: string[];
  linkedStandardIds: string[];
}

/** Student-safe thread reply with role attribution */
export interface StudentThreadReplyView {
  id: string;
  authorName: string;
  authorRole: "teacher" | "student";
  body: string;
  createdAt: string;
}

// ─── Projection Functions ───────────────────────────────────────────────────

/**
 * Projects an Assessment into a student-safe view model.
 *
 * Optional `unitPlans` context: when provided, `unitId` is only included if the
 * referenced UnitPlan is NOT a draft. This prevents leaking draft unit context
 * (titles, grouping) into student surfaces.
 */
export function projectStudentAssessment(
  assessment: Assessment,
  unitPlans?: UnitPlan[]
): StudentAssessmentView {
  // Filter out unitId references to draft UnitPlans
  let safeUnitId = assessment.unitId;
  if (safeUnitId && unitPlans) {
    const unit = unitPlans.find((u) => u.id === safeUnitId);
    if (!unit || unit.status === "draft") {
      safeUnitId = undefined;
    }
  }

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    classId: assessment.classId,
    gradingMode: assessment.gradingMode,
    dueDate: assessment.dueDate,
    totalPoints: assessment.totalPoints,
    studentInstructions: assessment.studentInstructions,
    studentResources: assessment.studentResources,
    learningGoalIds: assessment.learningGoalIds,
    standardIds: assessment.standardIds,
    unitId: safeUnitId,
    gradesReleased: !!assessment.gradesReleasedAt,
  };
}

/** Projects a UnitPlan into a student-safe view — hides strategy, conceptualFraming, etc. */
export function projectStudentUnitPlan(unit: UnitPlan): StudentUnitPlanView {
  return {
    id: unit.id,
    title: unit.title,
    code: unit.code,
    classId: unit.classId,
    startDate: unit.startDate,
    endDate: unit.endDate,
    status: unit.status,
  };
}

/** Projects a LessonPlan into student-safe view — hides teachingNotes, teacherReflection, activities */
export function projectStudentLessonPlan(lesson: LessonPlan): StudentLessonPlanView {
  return {
    id: lesson.id,
    title: lesson.title,
    objectives: lesson.objectives,
    linkedStandardIds: lesson.linkedStandardIds,
  };
}

/** Projects a ThreadReply into a student-safe view with role attribution */
export function projectStudentThreadReply(reply: ThreadReply): StudentThreadReplyView {
  return {
    id: reply.id,
    authorName: reply.authorName,
    authorRole: reply.authorRole ?? "teacher",
    body: reply.body,
    createdAt: reply.createdAt,
  };
}

// ─── Student Assessment State Projection ────────────────────────────────────

/**
 * Work axis of the student assessment lifecycle.
 *
 * Derived from teacher-owned GradeRecord.submissionStatus (for excused/missing)
 * and student-owned Submission.status (for draft/submitted/returned/resubmitted).
 *
 * Precedence:
 *   1. excused — terminal, always wins (from GradeRecord.submissionStatus)
 *   2. missing — teacher-set queue status (from GradeRecord.submissionStatus)
 *   3. Submission.status when a Submission entity exists
 *   4. not_started — no submission exists
 *
 * Grade completeness and release visibility NEVER affect workState.
 */
export type StudentWorkState =
  | "not_started"
  | "draft"
  | "submitted"
  | "returned"
  | "resubmitted"
  | "missing"
  | "excused";

/**
 * Read-only, derived projection of a student's assessment state.
 *
 * Combines Assessment, Submission, and GradeRecord into orthogonal fields
 * that student UI surfaces can consume without cross-entity joins.
 *
 * This is NOT a canonical state machine and NOT persisted.
 * It is a pure projection — no side-effects, no mutations.
 *
 * Each field represents an independent concern:
 * - workState: where the student is in submission lifecycle
 * - hasCompletedGrade: whether teacher has entered a complete grade
 * - isGradeVisible: whether grade data is released to student
 * - isFeedbackVisible: whether feedback is released (today === isGradeVisible; future seam)
 * - canSubmit: whether the student can submit/resubmit right now
 * - isPastDue: whether the due date has passed
 */
export interface StudentAssessmentStateProjection {
  assessmentId: string;
  workState: StudentWorkState;
  /** Teacher has entered a complete grade (mode-specific data exists). False for excused. */
  hasCompletedGrade: boolean;
  /** Grade data is released and visible to the student. */
  isGradeVisible: boolean;
  /**
   * Feedback is visible to the student.
   * Invariant: today this always equals `isGradeVisible`.
   * Future: may diverge when `Assessment.feedbackReleasedAt` is added.
   */
  isFeedbackVisible: boolean;
  /** Student can submit or resubmit work right now. */
  canSubmit: boolean;
  /** Assessment due date has passed. */
  isPastDue: boolean;
}

// ─── Gate / Visibility Checks ───────────────────────────────────────────────

/** Can student view grades for this assessment? (requires teacher to have released) */
export function canStudentViewGrade(assessment: Assessment): boolean {
  return !!assessment.gradesReleasedAt;
}

/** Can student view this report? (requires distributed status) */
export function canStudentViewReport(report: Report): boolean {
  return report.distributionStatus === "completed";
}

/** Is this assessment past its due date? Pure date check, no status gating.
 *  Accepts any object with a dueDate string — works with both Assessment and StudentAssessmentView. */
export function isAssessmentPastDue(assessment: { dueDate: string }): boolean {
  const now = new Date();
  const due = new Date(assessment.dueDate);
  due.setHours(23, 59, 59, 999);
  return now > due;
}

/** Is this assessment currently open for student submission?
 *  Published assessments are always open for submission — late submissions
 *  are allowed and automatically flagged via `Submission.isLate`. */
export function isAssessmentOpenForSubmission(assessment: Assessment): boolean {
  return assessment.status === "published";
}

/** Is this portfolio artifact visible to the student who created it? (always yes) */
export function isArtifactVisibleToStudent(artifact: PortfolioArtifact, studentId: string): boolean {
  return artifact.studentId === studentId;
}

/** Grade record projection — for student view, strip nothing (all grade data is relevant once released) */
export function projectStudentGradeRecord(grade: GradeRecord): GradeRecord {
  // All grade record fields are safe for student viewing once the assessment grades are released
  return { ...grade };
}

/** Announcements visible to student = sent status only */
export function isAnnouncementVisibleToStudent(announcement: Announcement): boolean {
  return announcement.status === "sent";
}

/** LessonSlotAssignment is fully safe for student viewing — it's structural join data */
export function projectStudentLessonSlotAssignment(assignment: LessonSlotAssignment): LessonSlotAssignment {
  return { ...assignment };
}
