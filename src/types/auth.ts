import { ID } from "./common";

export type UserRole = "teacher" | "student" | "parent";

export interface CurrentUser {
  id: ID;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  /** When role === "student", this is the student record ID (e.g. "stu_01") */
  linkedStudentId?: ID;
  /** When role === "parent", this is the parent/family profile ID */
  linkedParentId?: ID;
}

/** Teacher persona IDs used in seed data */
export const TEACHER_ID = "tchr_01";
export const TEACHER_ALT_ID = "tchr_02";
