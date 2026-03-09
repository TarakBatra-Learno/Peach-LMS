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
 * - `"missing"` → teacher marked as missing
 * - `"excused"` → terminal state, clears ALL grade data (always wins in derivation)
 */
export type SubmissionStatus = "none" | "submitted" | "missing" | "excused";

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
 * - Student visibility gated by `Assessment.gradesReleasedAt` (use `canStudentViewGrade()`).
 * - `submissionStatus` is INDEPENDENT from `Submission.status` — no automatic sync exists.
 *   A store side-effect should bridge them when student submits work.
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
  /** Teacher feedback. Shares the same release gate as grades (`Assessment.gradesReleasedAt`). */
  feedback?: string;
  feedbackAttachments?: { type: "text" | "audio" | "image"; url: string }[];
  submittedAt?: string;
  gradedAt?: string;
  updatedAt?: string;
}
