import { ID } from "./common";

/**
 * Student-owned submission lifecycle status.
 *
 * ⚠️ This is NOT the same as `GradeRecord.submissionStatus` (teacher-owned marking queue).
 * These two systems are independent — `Submission.status` tracks the student's work lifecycle,
 * while `GradeRecord.submissionStatus` tracks the teacher's marking queue.
 *
 * - `"draft"` → student has saved but not submitted
 * - `"submitted"` → student has submitted work for review
 * - `"returned"` → teacher has returned work with feedback
 * - `"resubmitted"` → student has resubmitted after teacher return
 */
export type SubmissionLifecycleStatus = "draft" | "submitted" | "returned" | "resubmitted";

export interface SubmissionAttachment {
  id: ID;
  name: string;
  type: "document" | "image" | "link" | "audio" | "video";
  url: string;
  /** How the attachment was added */
  sourceType?: "manual" | "drive_import" | "onedrive_import";
}

/**
 * Submission — student-owned entity representing submitted work for an assessment.
 *
 * Persona ownership: SHARED (student advances lifecycle, teacher triggers "returned").
 *
 * ⚠️ `Submission.status` and `GradeRecord.submissionStatus` are independent state machines.
 * When student submits (status → "submitted"), a store side-effect should sync
 * `GradeRecord.submissionStatus` to "submitted" so teacher "to mark" counts are accurate.
 */
export interface Submission {
  id: ID;
  assessmentId: ID;
  studentId: ID;
  classId: ID;
  /** Student-owned lifecycle. See `SubmissionLifecycleStatus` for state descriptions. */
  status: SubmissionLifecycleStatus;
  content: string;
  attachments: SubmissionAttachment[];
  /** When the student last saved a draft */
  draftSavedAt?: string;
  /** When the student submitted */
  submittedAt?: string;
  /** When the teacher returned with feedback */
  returnedAt?: string;
  /** When the student resubmitted after return */
  resubmittedAt?: string;
  /** Teacher's feedback comment on return */
  teacherComment?: string;
  /** Student's reflection (required on resubmission after return) */
  reflection?: string;
  createdAt: string;
  updatedAt: string;
}
