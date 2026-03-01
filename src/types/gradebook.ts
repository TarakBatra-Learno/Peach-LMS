import { ID, GradingMode, MasteryLevel } from "./common";

export interface GradeRecord {
  id: ID;
  assessmentId: ID;
  studentId: ID;
  classId: ID;
  gradingMode: GradingMode;
  score?: number;
  totalPoints?: number;
  rubricScores?: { criterionId: ID; levelId: ID; points: number }[];
  standardsMastery?: { standardId: ID; level: MasteryLevel }[];
  checklistResults?: { itemId: ID; checked: boolean }[];
  mypCriteriaScores?: { criterionId: ID; criterion: string; level: number }[];
  dpGrade?: number; // 1-7
  feedback?: string;
  feedbackAttachments?: { type: "text" | "audio" | "image"; url: string }[];
  submittedAt?: string;
  gradedAt?: string;
  updatedAt?: string;
  isMissing: boolean;
}
