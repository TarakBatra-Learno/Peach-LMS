import { ID } from "./common";

export type NotificationType =
  | "grade_released"
  | "assessment_due"
  | "submission_returned"
  | "report_distributed"
  | "announcement"
  | "portfolio_approved"
  | "portfolio_revision";

export interface StudentNotification {
  id: ID;
  studentId: ID;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  /** Route to navigate to when clicked */
  linkTo?: string;
  /** Deterministic dedup key: (studentId, referenceId, type) */
  dedupeKey?: string;
}
