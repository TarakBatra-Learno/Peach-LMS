import { ID, GradingMode, MasteryLevel } from "./common";

export type SubmissionStatus = "none" | "submitted" | "missing" | "excused";

export type ChecklistResultStatus = "met" | "not_yet" | "yes" | "partly" | "no" | "unmarked";

export interface ChecklistResultItem {
  itemId: string;
  status: ChecklistResultStatus;
  evidence?: string;
}

export interface GradeRecord {
  id: ID;
  assessmentId: ID;
  studentId: ID;
  classId: ID;
  gradingMode: GradingMode;
  submissionStatus: SubmissionStatus;
  score?: number;
  totalPoints?: number;
  rubricScores?: { criterionId: ID; levelId: ID; points: number }[];
  standardsMastery?: { standardId: ID; level: MasteryLevel }[];
  checklistResults?: { itemId: ID; checked: boolean }[]; // legacy: score-mode add-on
  checklistGradeResults?: ChecklistResultItem[]; // NEW: used when gradingMode === "checklist"
  mypCriteriaScores?: { criterionId: ID; criterion: string; level: number }[];
  dpGrade?: number; // 1-7
  feedback?: string;
  feedbackAttachments?: { type: "text" | "audio" | "image"; url: string }[];
  submittedAt?: string;
  gradedAt?: string;
  updatedAt?: string;
}
