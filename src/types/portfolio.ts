import { ID, ApprovalStatus, ShareStatus } from "./common";

export interface PortfolioArtifact {
  id: ID;
  studentId: ID;
  classId: ID;
  title: string;
  description: string;
  mediaType: "image" | "video" | "document" | "audio" | "link";
  mediaUrl: string;
  thumbnailUrl?: string;
  learningGoalIds: ID[];
  reflection?: Reflection;
  approvalStatus: ApprovalStatus;
  familyShareStatus: ShareStatus;
  createdBy: "student" | "teacher";
  createdAt: string;
  updatedAt: string;
  isReportEligible: boolean;
  linkedReportId?: ID;
  flaggedForReport?: boolean;
  /** Source of artifact content */
  sourceType?: "manual" | "submission" | "drive_import";
  /** Reference ID when sourced from a submission */
  sourceId?: ID;
}

export interface Reflection {
  text: string;
  submittedAt: string;
  teacherComment?: string;
  teacherCommentAt?: string;
}
