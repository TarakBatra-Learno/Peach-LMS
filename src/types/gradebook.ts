import { ID, GradingMode, MasteryLevel } from "./common";

/**
 * Teacher-owned marking queue status.
 *
 * ⚠️ This is NOT the student's submission lifecycle status (see `Submission.status`).
 * These two status systems are independent — `submissionStatus` is set by the teacher
 * in the grading sheet, while `Submission.status` is set by the student.
 *
 * - `"none"` → no action taken (default)
 * - `"submitted"` → teacher acknowledged student work, needs grading (displayed as "To mark")
 * - `"excused"` → terminal state, clears ALL grade data (always wins in derivation)
 * - `"missing"` → @deprecated — late is now derived from due date + no submission. Kept for backward compat.
 */
export type SubmissionStatus = "none" | "submitted" | "excused" | "missing";

export type ChecklistResultStatus = "met" | "not_yet" | "yes" | "partly" | "no" | "unmarked";

export interface ChecklistResultItem {
  itemId: string;
  status: ChecklistResultStatus;
  evidence?: string;
}

/**
 * GradeRecord — teacher-owned entity storing per-student grade data for an assessment.
 *
 * Persona ownership: TEACHER (students see this via `projectStudentGradeRecord()` once grades are released).
 *
 * Key invariants:
 * - `submissionStatus: "excused"` is terminal — clears ALL grade data fields via `buildExcusedPayload()`.
 * - `gradingMode` mirrors `Assessment.gradingMode` at save time.
 * - Student visibility gated by per-student `releasedAt` (use `canStudentViewGrade()`).
 * - `submissionStatus` is INDEPENDENT from `Submission.status`; store-side sync bridges them on submit.
 */
export interface GradeRecord {
  id: ID;
  assessmentId: ID;
  studentId: ID;
  classId: ID;
  /** Mirrors `Assessment.gradingMode` at save time. Do not change independently. */
  gradingMode: GradingMode;
  /**
   * Teacher-owned marking queue status.
   * ⚠️ Independent from `Submission.status`. "submitted" here means "teacher acknowledged, needs grading"
   * — NOT "student submitted work". See SubmissionStatus type for details.
   */
  submissionStatus: SubmissionStatus;
  score?: number;
  totalPoints?: number;
  rubricScores?: { criterionId: ID; levelId: ID; points: number }[];
  standardsMastery?: { standardId: ID; level: MasteryLevel }[];
  /** @deprecated Legacy: score-mode add-on. Use `checklistGradeResults` for checklist grading mode. */
  checklistResults?: { itemId: ID; checked: boolean }[];
  /** Checklist grading results — used when `gradingMode === "checklist"`. */
  checklistGradeResults?: ChecklistResultItem[];
  mypCriteriaScores?: { criterionId: ID; criterion: string; level: number }[];
  /** DP scale grade (1-7). */
  dpGrade?: number;
  /**
   * Per-student grade release timestamp. When set, this student's grade is visible to them.
   * Cleared by `buildExcusedPayload()` when student is excused (terminal state).
   */
  releasedAt?: string;
  /** Teacher feedback. Shares the same release gate as grades (per-student `releasedAt`). */
  feedback?: string;
  feedbackAttachments?: { type: "text" | "audio" | "image"; url: string }[];
  /**
   * Grading completion status:
   * - "none": no grading action taken yet
   * - "in_progress": teacher has started grading but not completed all required fields
   * - "ready": all required fields completed, ready for release
   */
  gradingStatus?: "none" | "in_progress" | "ready";
  /** ISO timestamp when grade was last amended after initial release. Used to notify student of changes. */
  amendedAt?: string;
  /**
   * Student's view status of released grade:
   * - "unseen": grade released but student hasn't viewed it yet
   * - "seen": student has viewed the grade
   * Only relevant when releasedAt is set.
   */
  reportStatus?: "unseen" | "seen";
  submittedAt?: string;
  gradedAt?: string;
  updatedAt?: string;
}
