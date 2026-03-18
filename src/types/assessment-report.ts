import { ID } from "./common";

export type AssessmentReportStatus = "draft" | "ready" | "released";

export interface AssessmentReportRubricFeedback {
  criterionId?: ID;
  criterionLabel: string;
  levelLabel?: string;
  summary: string;
}

export interface AssessmentReportSourceAttribution {
  id: ID;
  sourceType: "submission" | "grade" | "rubric" | "checklist" | "standard" | "teacher_note";
  label: string;
  sourceId?: ID;
}

export interface AssessmentReport {
  id: ID;
  assessmentId: ID;
  studentId: ID;
  classId: ID;
  status: AssessmentReportStatus;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  rubricFeedback: AssessmentReportRubricFeedback[];
  sourceAttribution: AssessmentReportSourceAttribution[];
  generatedAt: string;
  updatedAt: string;
  releasedAt?: string;
}

export interface AssessmentInsightSummary {
  id: ID;
  assessmentId: ID;
  classId: ID;
  strengths: string[];
  misconceptions: string[];
  reteachingSuggestions: string[];
  submittedCount: number;
  reviewedCount: number;
  releasedCount: number;
  generatedAt: string;
  updatedAt: string;
}
