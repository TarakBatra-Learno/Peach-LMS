import { ID, AttendanceStatus } from "./common";

export interface AttendanceSession {
  id: ID;
  classId: ID;
  date: string;
  records: AttendanceRecord[];
  completedAt?: string;
}

export interface AttendanceRecord {
  studentId: ID;
  status: AttendanceStatus;
  note?: string;
  arrivedAt?: string;
}
