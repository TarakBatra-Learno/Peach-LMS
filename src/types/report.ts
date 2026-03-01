import { ID, ReportPublishState, DistributionStatus, Programme } from "./common";

export interface ReportCycle {
  id: ID;
  name: string;
  term: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  templateId?: ID;
  classIds: ID[];
  status: "open" | "closing" | "closed";
}

export interface ReportTemplate {
  id: ID;
  name: string;
  description: string;
  programme: Programme;
  sections: ReportSectionConfig[];
}

export interface ReportSectionConfig {
  id: ID;
  type: "grades" | "attendance" | "portfolio" | "teacher_comment" | "learning_goals" | "media" | "custom_text" | "myp_criteria" | "dp_grades" | "atl_skills" | "portfolio_evidence" | "behavior_incidents";
  label: string;
  required: boolean;
  order: number;
}

export interface Report {
  id: ID;
  cycleId: ID;
  studentId: ID;
  classId: ID;
  templateId: ID;
  sections: ReportSection[];
  publishState: ReportPublishState;
  distributionStatus: DistributionStatus;
  publishedAt?: string;
  distributedAt?: string;
}

export interface ReportSection {
  configId: ID;
  type: ReportSectionConfig["type"];
  label: string;
  content: Record<string, unknown>;
  order: number;
}

export interface TranscriptYear {
  academicYear: string;
  terms: TranscriptTerm[];
}

export interface TranscriptTerm {
  term: string;
  subjects: { subject: string; grade: string; comments?: string }[];
  attendance: { present: number; absent: number; late: number; total: number };
}
