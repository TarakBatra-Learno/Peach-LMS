/**
 * student-selectors.ts
 *
 * Store selectors that return already-filtered, already-projected student-safe data.
 * Every selector enforces scope (studentId-filtered) AND applies field projection
 * via student-permissions.ts.
 *
 * Pattern: Store (raw entities) → student-selectors.ts → student-permissions.ts (projection) → Student UI
 */

import type { AppState } from "@/stores/types";
import type { Class } from "@/types/class";
import type { Submission } from "@/types/submission";
import type { Assessment } from "@/types/assessment";
import type { AssessmentReport } from "@/types/assessment-report";
import type { GradeRecord } from "@/types/gradebook";
import type { Report } from "@/types/report";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Announcement, Channel } from "@/types/communication";
import type { CalendarEvent } from "@/types/calendar";
import type { MasteryLevel } from "@/types/common";
import type { MaterializedOccurrence } from "@/types/unit-planning";
import {
  projectStudentAssessment,
  projectStudentUnitPlan,
  projectStudentLessonPlan,
  projectStudentThreadReply,
  projectStudentGradeRecord,
  canStudentViewGrade,
  canStudentViewAssessmentReport,
  canStudentViewReport,
  isAnnouncementVisibleToStudent,
  isAssessmentOpenForSubmission,
  isAssessmentPastDue,
  type StudentAssessmentView,
  type StudentUnitPlanView,
  type StudentLessonPlanView,
  type StudentThreadReplyView,
  type StudentAssessmentStateProjection,
  type StudentWorkState,
} from "./student-permissions";
import { isGradeComplete } from "./grade-helpers";
import { getCanonicalSubmissionStatus } from "./submission-state";
import { materializeTimetableOccurrences } from "./unit-planning-utils";

// ─── Class Selectors ────────────────────────────────────────────────────────

/** Get classes the student is enrolled in */
export function getStudentClasses(state: AppState, studentId: string): Class[] {
  const student = state.students.find((s) => s.id === studentId);
  if (!student) return [];
  return state.classes.filter((c) => student.classIds.includes(c.id));
}

// ─── Assessment Selectors ───────────────────────────────────────────────────

/** Get student-safe assessments, optionally filtered by classId */
export function getStudentAssessments(
  state: AppState,
  studentId: string,
  classId?: string
): StudentAssessmentView[] {
  const student = state.students.find((s) => s.id === studentId);
  if (!student) return [];

  return state.assessments
    .filter((a) => {
      // Only assessments for classes the student is enrolled in
      if (!student.classIds.includes(a.classId)) return false;
      // Only non-draft assessments (both "live" and "closed" are visible)
      if (a.status === "draft") return false;
      // Optional class filter
      if (classId && a.classId !== classId) return false;
      // Only assessments assigned to this student (if assignedStudentIds exists)
      if (a.assignedStudentIds && a.assignedStudentIds.length > 0) {
        if (!a.assignedStudentIds.includes(studentId)) return false;
      }
      return true;
    })
    .map((a) => projectStudentAssessment(a, state.unitPlans));
}

// ─── Submission Selectors ───────────────────────────────────────────────────

/** Get all submissions for a student */
export function getStudentSubmissions(state: AppState, studentId: string): Submission[] {
  return state.submissions.filter((s) => s.studentId === studentId);
}

/** Get submission for a specific student + assessment */
export function getStudentSubmission(
  state: AppState,
  studentId: string,
  assessmentId: string
): Submission | undefined {
  return state.submissions.find(
    (s) => s.studentId === studentId && s.assessmentId === assessmentId
  );
}

// ─── Grade Selectors (release-gated) ────────────────────────────────────────

/** Get released grades for a student, optionally filtered by classId */
export function getStudentReleasedGrades(
  state: AppState,
  studentId: string,
  classId?: string
): GradeRecord[] {
  const studentGrades = state.grades.filter((g) => {
    if (g.studentId !== studentId) return false;
    if (classId && g.classId !== classId) return false;
    return true;
  });

  // Only include grades with per-student release
  return studentGrades.filter((g) => {
    const assessment = state.assessments.find((a) => a.id === g.assessmentId);
    if (!assessment) return false;
    return canStudentViewGrade(assessment, g);
  }).map(projectStudentGradeRecord);
}

export function getStudentReleasedAssessmentReport(
  state: AppState,
  studentId: string,
  assessmentId: string
): AssessmentReport | undefined {
  const report = state.assessmentReports.find(
    (entry) => entry.studentId === studentId && entry.assessmentId === assessmentId
  );
  return canStudentViewAssessmentReport(report) ? report : undefined;
}

// ─── Student Submission Status ──────────────────────────────────────────────

export type StudentSubmissionStatus =
  | "draft"
  | "due"
  | "overdue"
  | "excused"
  | "submitted_on_time"
  | "submitted_late";

/**
 * Derive the submission status from the student's perspective.
 * Used for badges and status indicators on student-facing surfaces.
 */
export function getStudentSubmissionStatus(
  grade: GradeRecord | undefined,
  submission: Submission | undefined,
  assessment: Pick<Assessment, "dueDate">
): StudentSubmissionStatus {
  if (grade?.submissionStatus === "excused") return "excused";
  const canonicalSubmissionStatus = getCanonicalSubmissionStatus(submission?.status);
  if (canonicalSubmissionStatus === "draft") {
    return "draft";
  }
  if (canonicalSubmissionStatus === "submitted") {
    return submission?.isLate ? "submitted_late" : "submitted_on_time";
  }
  // Fallback: GradeRecord has submissionStatus "submitted" but no Submission entity
  if (grade?.submissionStatus === "submitted") return "submitted_on_time";
  if (isAssessmentPastDue(assessment)) return "overdue";
  return "due";
}

// ─── Student Assessment State Projection ────────────────────────────────────

/**
 * Derive a read-only state projection for a student's view of a specific assessment.
 *
 * Combines Assessment, Submission, and GradeRecord into orthogonal fields.
 * This is a pure projection — no side-effects, no mutations, no new persisted state.
 *
 * Precedence for workState:
 *   1. excused (GradeRecord.submissionStatus === "excused") — terminal, always wins
 *   2. Submission.status when a Submission entity exists
 *   3. not_started — no submission exists
 *
 * Grade completeness and release visibility NEVER affect workState.
 */
export function getStudentAssessmentState(
  state: AppState,
  studentId: string,
  assessmentId: string
): StudentAssessmentStateProjection | null {
  const assessment = state.assessments.find((a) => a.id === assessmentId);
  if (!assessment) return null;

  const submission = state.submissions.find(
    (s) => s.studentId === studentId && s.assessmentId === assessmentId
  );

  const grade = state.grades.find(
    (g) => g.studentId === studentId && g.assessmentId === assessmentId
  );

  // ── workState derivation (precedence order) ──
  let workState: StudentWorkState;

  // 1. Excused — terminal, always wins regardless of submission
  if (grade?.submissionStatus === "excused") {
    workState = "excused";
  }
  // 2. Submission exists — use its status directly
  else if (submission) {
    const canonicalSubmissionStatus = getCanonicalSubmissionStatus(submission.status);
    workState = canonicalSubmissionStatus ?? "draft";
  }
  // 3. GradeRecord has submissionStatus "submitted" but no Submission entity — treat as submitted
  else if (grade?.submissionStatus === "submitted") {
    workState = "submitted";
  }
  // 4. No submission — not started
  else {
    workState = "not_started";
  }

  // ── Grade completeness (orthogonal to workState) ──
  const hasCompletedGrade = isGradeComplete(grade, assessment);

  // ── Visibility flags (orthogonal to workState and grade completeness) ──
  const isGradeVisible = canStudentViewGrade(assessment, grade);
  // Today: isFeedbackVisible === isGradeVisible
  // Future seam: may diverge when Assessment.feedbackReleasedAt is added
  const isFeedbackVisible = isGradeVisible;

  // ── Submission availability ──
  const assessmentOpen = isAssessmentOpenForSubmission(assessment);
  // canSubmit: assessment is open AND workState allows submission
  // Submittable states: not_started, draft (no more "returned" since we removed that state)
  // Non-submittable: submitted, excused
  const submittableWorkStates: StudentWorkState[] = ["not_started", "draft"];
  const canSubmit = assessmentOpen && submittableWorkStates.includes(workState);

  // ── Due date ──
  const isPastDue = isAssessmentPastDue(assessment);

  return {
    assessmentId,
    workState,
    hasCompletedGrade,
    isGradeVisible,
    isFeedbackVisible,
    canSubmit,
    isPastDue,
  };
}

/**
 * Batch version: get state projections for all of a student's visible assessments.
 * Useful for list/card views that need to show work status + grade visibility.
 */
export function getStudentAssessmentStates(
  state: AppState,
  studentId: string,
  classId?: string
): StudentAssessmentStateProjection[] {
  const assessmentViews = getStudentAssessments(state, studentId, classId);
  const projections: StudentAssessmentStateProjection[] = [];

  for (const view of assessmentViews) {
    const projection = getStudentAssessmentState(state, studentId, view.id);
    if (projection) projections.push(projection);
  }

  return projections;
}

// ─── Unit Plan Selectors ────────────────────────────────────────────────────

/** Get student-safe unit plans for a class */
export function getStudentUnitPlans(
  state: AppState,
  classId: string
): StudentUnitPlanView[] {
  return state.unitPlans
    .filter((u) => u.classId === classId && (u.status === "active" || u.status === "completed"))
    .map(projectStudentUnitPlan);
}

// ─── Timetable Selectors ───────────────────────────────────────────────────

export interface EnrichedTimetableSlot {
  date: string;
  slotDay: string;
  slotStartTime: string;
  slotEndTime: string;
  room?: string;
  className: string;
  classId: string;
  /** Lesson info when a lesson is assigned to this slot */
  lesson?: StudentLessonPlanView;
  /** Unit title if lesson belongs to a unit */
  unitTitle?: string;
}

/**
 * Get enriched timetable for a student within a date range.
 * Pipeline: Class.schedule[] → materializeTimetableOccurrences() →
 *   join LessonSlotAssignment → join projected LessonPlan (title+objectives only)
 */
export function getStudentTimetable(
  state: AppState,
  studentId: string,
  startDate: string,
  endDate: string
): EnrichedTimetableSlot[] {
  const classes = getStudentClasses(state, studentId);
  const slots: EnrichedTimetableSlot[] = [];

  for (const cls of classes) {
    const occurrences: MaterializedOccurrence[] = materializeTimetableOccurrences(
      cls.schedule,
      startDate,
      endDate
    );

    for (const occ of occurrences) {
      const assignment = state.lessonSlotAssignments.find(
        (a) => a.classId === cls.id && a.date === occ.date && a.slotStartTime === occ.slotStartTime
      );

      let lesson: StudentLessonPlanView | undefined;
      let unitTitle: string | undefined;

      if (assignment) {
        const rawLesson = state.lessonPlans.find((lp) => lp.id === assignment.lessonPlanId);
        if (rawLesson) {
          lesson = projectStudentLessonPlan(rawLesson);
          const unit = state.unitPlans.find((u) => u.id === rawLesson.unitId);
          if (unit) unitTitle = unit.title;
        }
      }

      slots.push({
        date: occ.date,
        slotDay: occ.slotDay,
        slotStartTime: occ.slotStartTime,
        slotEndTime: occ.slotEndTime,
        room: occ.room,
        className: cls.name,
        classId: cls.id,
        lesson,
        unitTitle,
      });
    }
  }

  return slots.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.slotStartTime.localeCompare(b.slotStartTime);
  });
}

// ─── Report Selectors ───────────────────────────────────────────────────────

/** Get distributed reports for a student */
export function getStudentReports(state: AppState, studentId: string): Report[] {
  return state.reports.filter((r) => {
    if (r.studentId !== studentId) return false;
    return canStudentViewReport(r);
  });
}

// ─── Portfolio Selectors ────────────────────────────────────────────────────

/** Get portfolio artifacts for a student, optionally filtered by classId */
export function getStudentArtifacts(
  state: AppState,
  studentId: string,
  classId?: string
): PortfolioArtifact[] {
  return state.artifacts.filter((a) => {
    if (a.studentId !== studentId) return false;
    if (classId && a.classId !== classId) return false;
    return true;
  });
}

// ─── Communication Selectors ────────────────────────────────────────────────

/** Get channels visible to a student (class channels for enrolled classes + DMs) */
export function getStudentChannels(state: AppState, studentId: string): Channel[] {
  const student = state.students.find((s) => s.id === studentId);
  if (!student) return [];

  return state.channels.filter((ch) => {
    // Class channels: student must be enrolled
    if (ch.type === "general" || ch.type === "announcements" || ch.type === "assignments") {
      return student.classIds.includes(ch.classId);
    }
    // DM/project channels: check participantIds
    if (ch.participantIds && ch.participantIds.length > 0) {
      return ch.participantIds.includes(studentId);
    }
    return false;
  });
}

/** Get student-safe announcements for a channel */
export function getStudentAnnouncements(
  state: AppState,
  channelId: string
): Announcement[] {
  return state.announcements
    .filter((a) => a.channelId === channelId)
    .filter(isAnnouncementVisibleToStudent);
}

/** Get student-safe thread replies */
export function getStudentThreadReplies(
  replies: import("@/types/communication").ThreadReply[]
): StudentThreadReplyView[] {
  return replies.map((r) => projectStudentThreadReply(r));
}

// ─── Calendar Selectors ─────────────────────────────────────────────────────

/** Get calendar events for a student's enrolled classes */
export function getStudentCalendarEvents(state: AppState, studentId: string): CalendarEvent[] {
  const student = state.students.find((s) => s.id === studentId);
  if (!student) return [];

  return state.calendarEvents.filter((e) => {
    if (!e.classId) return true; // School-wide events visible to all
    return student.classIds.includes(e.classId);
  });
}

// ─── Learning Goal Progress ─────────────────────────────────────────────────

export interface StudentGoalProgress {
  goalId: string;
  goalCode: string;
  goalTitle: string;
  goalCategory: "standard" | "atl_skill" | "learner_profile";
  assessmentCount: number;
  latestLevel: MasteryLevel | null;
  levels: Record<string, number>;
  assessments: {
    assessmentId: string;
    assessmentTitle: string;
    className: string;
    level: MasteryLevel;
    gradedAt?: string;
  }[];
}

/**
 * Compute per-learning-goal mastery progress for a student from released grades.
 * Aggregates standardsMastery entries across all released grades, grouped by goal.
 */
export function computeStudentGoalProgress(
  state: AppState,
  studentId: string
): StudentGoalProgress[] {
  const releasedGrades = getStudentReleasedGrades(state, studentId);
  const learningGoals = state.learningGoals;

  // Accumulator: goalId → { levels, assessments }
  const goalMap = new Map<string, {
    levels: Record<string, number>;
    assessments: {
      assessmentId: string;
      assessmentTitle: string;
      className: string;
      level: MasteryLevel;
      gradedAt?: string;
    }[];
  }>();

  for (const grade of releasedGrades) {
    if (!grade.standardsMastery || grade.standardsMastery.length === 0) continue;

    const assessment = state.assessments.find((a) => a.id === grade.assessmentId);
    if (!assessment) continue;
    const cls = state.classes.find((c) => c.id === grade.classId);

    for (const sm of grade.standardsMastery) {
      let entry = goalMap.get(sm.standardId);
      if (!entry) {
        entry = { levels: {}, assessments: [] };
        goalMap.set(sm.standardId, entry);
      }
      entry.levels[sm.level] = (entry.levels[sm.level] || 0) + 1;
      entry.assessments.push({
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        className: cls?.name ?? assessment.classId,
        level: sm.level,
        gradedAt: grade.gradedAt,
      });
    }
  }

  // Build result for all learning goals, sorted by category
  const categoryOrder: Record<string, number> = { standard: 0, atl_skill: 1, learner_profile: 2 };

  return learningGoals
    .map((goal): StudentGoalProgress => {
      const entry = goalMap.get(goal.id);
      if (!entry || entry.assessments.length === 0) {
        return {
          goalId: goal.id,
          goalCode: goal.code,
          goalTitle: goal.title,
          goalCategory: (goal.category as "standard" | "atl_skill" | "learner_profile") ?? "standard",
          assessmentCount: 0,
          latestLevel: null,
          levels: {},
          assessments: [],
        };
      }

      // Determine latest level by most recent gradedAt
      const sorted = [...entry.assessments].sort((a, b) => {
        if (!a.gradedAt && !b.gradedAt) return 0;
        if (!a.gradedAt) return 1;
        if (!b.gradedAt) return -1;
        return b.gradedAt.localeCompare(a.gradedAt);
      });

      return {
        goalId: goal.id,
        goalCode: goal.code,
        goalTitle: goal.title,
        goalCategory: (goal.category as "standard" | "atl_skill" | "learner_profile") ?? "standard",
        assessmentCount: entry.assessments.length,
        latestLevel: sorted[0]?.level ?? null,
        levels: entry.levels,
        assessments: entry.assessments,
      };
    })
    .sort((a, b) => (categoryOrder[a.goalCategory] ?? 99) - (categoryOrder[b.goalCategory] ?? 99));
}

// ─── Personal Goals ─────────────────────────────────────────────────────────

import type { StudentGoal } from "@/types/student-goal";
import type { GoalEvidenceLink, GoalEvidenceSourceType } from "@/types/goal-evidence";

/** Get personal goals for a student, sorted by updatedAt descending */
export function getStudentPersonalGoals(
  state: AppState,
  studentId: string,
  statusFilter?: StudentGoal["status"]
): StudentGoal[] {
  return state.studentGoals
    .filter((g) => {
      if (g.studentId !== studentId) return false;
      if (statusFilter && g.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Get evidence links for a specific goal, sorted by addedAt descending */
export function getGoalEvidenceLinks(
  state: AppState,
  goalId: string
): GoalEvidenceLink[] {
  return state.goalEvidenceLinks
    .filter((l) => l.goalId === goalId)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/** Count evidence links for a goal (used by goal cards) */
export function getGoalEvidenceCount(state: AppState, goalId: string): number {
  return state.goalEvidenceLinks.filter((l) => l.goalId === goalId).length;
}

/** Get goals that link to a specific source (to show "linked to X goals" on artifact/submission cards) */
export function getGoalsForSource(
  state: AppState,
  sourceType: GoalEvidenceSourceType,
  sourceId: string
): StudentGoal[] {
  const links = state.goalEvidenceLinks.filter(
    (l) => l.sourceType === sourceType && l.sourceId === sourceId
  );
  const goalIds = new Set(links.map((l) => l.goalId));
  return state.studentGoals.filter((g) => goalIds.has(g.id));
}

/**
 * Resolve an evidence link to its source entity for display.
 * Returns { title, subtitle, type } for timeline rendering.
 * Resilient: returns a safe placeholder if the source entity was deleted.
 */
export function resolveEvidenceSource(
  state: AppState,
  link: GoalEvidenceLink
): { title: string; subtitle: string; type: GoalEvidenceSourceType } {
  switch (link.sourceType) {
    case "portfolio_artifact": {
      const artifact = state.artifacts.find((a) => a.id === link.sourceId);
      if (!artifact) {
        return { title: "Removed item", subtitle: "This portfolio artifact is no longer available", type: "portfolio_artifact" };
      }
      const cls = state.classes.find((c) => c.id === artifact.classId);
      return { title: artifact.title, subtitle: cls?.name ?? "", type: "portfolio_artifact" };
    }
    case "submission": {
      const sub = state.submissions.find((s) => s.id === link.sourceId);
      if (!sub) {
        return { title: "Removed item", subtitle: "This submission is no longer available", type: "submission" };
      }
      const asmt = state.assessments.find((a) => a.id === sub.assessmentId);
      const cls = state.classes.find((c) => c.id === sub.classId);
      return {
        title: asmt?.title ?? "Submission",
        subtitle: cls?.name ?? "",
        type: "submission",
      };
    }
    case "report": {
      const report = state.reports.find((r) => r.id === link.sourceId);
      if (!report) {
        return { title: "Removed item", subtitle: "This report is no longer available", type: "report" };
      }
      const cls = state.classes.find((c) => c.id === report.classId);
      return { title: `${cls?.name ?? "Class"} Report`, subtitle: "", type: "report" };
    }
    case "manual": {
      return {
        title: link.manualTitle || "Reflection",
        subtitle: link.manualMediaUrl ? "With media" : "Written reflection",
        type: "manual",
      };
    }
    default:
      return { title: "Unknown item", subtitle: "", type: link.sourceType };
  }
}

// ─── Incidents ──────────────────────────────────────────────────────────────

/** Incidents are never visible to students */
export function getStudentSafeIncidents(): never[] {
  return [];
}
