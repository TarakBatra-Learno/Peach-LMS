export type ID = string;
export type Programme = "MYP" | "DP" | "general";
export type GradingMode = "score" | "rubric" | "standards" | "myp_criteria" | "dp_scale";
export type Priority = "high" | "medium" | "low";
export type Status = "draft" | "published" | "archived";
export type DistributionStatus = "not_started" | "in_progress" | "completed";
export type ApprovalStatus = "pending" | "approved" | "needs_revision";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type IncidentSeverity = "low" | "medium" | "high";
export type FollowUpStatus = "open" | "in_progress" | "resolved";
export type ReportPublishState = "draft" | "ready" | "published" | "distributed";
export type ShareStatus = "not_shared" | "shared" | "viewed";
export type MasteryLevel = "exceeding" | "meeting" | "approaching" | "beginning" | "not_assessed";

export interface DateRange {
  start: string;
  end: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}
