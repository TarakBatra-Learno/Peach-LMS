import { ID } from "./common";
import type { AssessmentType, OffPlatformSubmissionMode } from "./assessment";

/**
 * Student-owned submission lifecycle status.
 *
 * ⚠️ This is NOT the same as `GradeRecord.submissionStatus` (teacher-owned marking queue).
 * These two systems are independent — `Submission.status` tracks the student's work lifecycle,
 * while `GradeRecord.submissionStatus` tracks the teacher's marking queue.
 *
 * - `"draft"` → student has saved but not submitted
 * - `"submitted"` → student has submitted work for review
 * - `"returned"` → @deprecated legacy value from the removed return/resubmit flow. Treat as `"draft"` in new code.
 * - `"resubmitted"` → @deprecated legacy value from the removed return/resubmit flow. Treat as `"submitted"` in new code.
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

export interface OffPlatformSubmissionPayload {
  mode: OffPlatformSubmissionMode;
  responseText?: string;
  evidenceSummary?: string;
  observedByTeacher?: boolean;
}

export interface QuizSubmissionResponse {
  questionId: ID;
  response: string | string[];
  isCorrect?: boolean;
}

export interface QuizSubmissionPayload {
  questionCount: number;
  responses: QuizSubmissionResponse[];
  autoScore?: number;
}

export interface ChatTranscriptTurn {
  id: ID;
  role: "system" | "teacher" | "student" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSubmissionPayload {
  transcript: ChatTranscriptTurn[];
  completionSummary?: string;
}

export interface EssaySubmissionPayload {
  prompt?: string;
  body: string;
  wordCount?: number;
  outline?: string[];
}

export interface SubmissionTypedPayload {
  offPlatform?: OffPlatformSubmissionPayload;
  quiz?: QuizSubmissionPayload;
  chat?: ChatSubmissionPayload;
  essay?: EssaySubmissionPayload;
}

/**
 * Submission — student-owned entity representing submitted work for an assessment.
 *
 * Persona ownership: STUDENT for active demo flows.
 *
 * ⚠️ `Submission.status` and `GradeRecord.submissionStatus` are independent state machines.
 * When a student submits (status → "submitted"), store-side sync should update
 * `GradeRecord.submissionStatus` to "submitted" so teacher "to mark" counts stay accurate.
 */
export interface Submission {
  id: ID;
  assessmentId: ID;
  studentId: ID;
  classId: ID;
  assessmentType?: AssessmentType;
  /** Student-owned lifecycle. See `SubmissionLifecycleStatus` for state descriptions. */
  status: SubmissionLifecycleStatus;
  content: string;
  attachments: SubmissionAttachment[];
  typedPayload?: SubmissionTypedPayload;
  /** When the student last saved a draft */
  draftSavedAt?: string;
  /** When the student submitted */
  submittedAt?: string;
  /** @deprecated Legacy field from removed return/resubmit flow */
  returnedAt?: string;
  /** @deprecated Legacy field from removed return/resubmit flow */
  resubmittedAt?: string;
  /** @deprecated Legacy field from removed return/resubmit flow */
  teacherComment?: string;
  /** Optional student reflection captured alongside the submission in older demo flows. */
  reflection?: string;
  /** Auto-set to true when the student submits after the assessment due date. Treat undefined as false. */
  isLate?: boolean;
  createdAt: string;
  updatedAt: string;
}
