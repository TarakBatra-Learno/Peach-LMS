export type ID = string;
export type Programme = "MYP" | "DP" | "general";
export type GradingMode = "score" | "rubric" | "standards" | "myp_criteria" | "dp_scale" | "checklist";
export type Priority = "high" | "medium" | "low";
/**
 * Assessment lifecycle states.
 * Canonical values: "draft" | "live" | "closed"
 * Legacy values kept for backward compat: "published" (= "live"), "archived" (= "closed")
 * New code should ONLY use "draft", "live", "closed".
 */
export type AssessmentStatus = "draft" | "live" | "closed" | "published" | "archived";
/** @deprecated Use AssessmentStatus */
export type Status = AssessmentStatus;
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
