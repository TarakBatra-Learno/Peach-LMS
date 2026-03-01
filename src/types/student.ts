import { ID, ShareStatus } from "./common";

export interface Student {
  id: ID;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  gradeLevel: string;
  classIds: ID[];
  parentEmail: string;
  parentName: string;
  preferredLanguage: string;
  familyShareHistory: FamilyShareRecord[];
}

export interface FamilyShareRecord {
  id: ID;
  type: "report" | "portfolio" | "announcement";
  referenceId: ID;
  sharedAt: string;
  status: ShareStatus;
  viewedAt?: string;
}
