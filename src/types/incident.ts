import { ID, IncidentSeverity, FollowUpStatus } from "./common";

export interface Incident {
  id: ID;
  studentId: ID;
  classId?: ID;
  title: string;
  description: string;
  category: string;
  tags: string[];
  severity: IncidentSeverity;
  reportedBy: string;
  reportedAt: string;
  collaboratorNames: string[];
  followUps: FollowUp[];
  status: FollowUpStatus;
  sharedWithCounselor?: boolean;
}

export interface FollowUp {
  id: ID;
  note: string;
  createdAt: string;
  createdBy: string;
  linkedCalendarEventId?: ID;
}

export interface SupportPlan {
  id: ID;
  studentId: ID;
  title: string;
  description: string;
  nextCheckIn: string;
  notes: string[];
  status: "active" | "completed" | "paused";
  incidentIds: ID[];
  createdAt: string;
}

export interface IncidentTaxonomy {
  categories: string[];
  tags: string[];
}
