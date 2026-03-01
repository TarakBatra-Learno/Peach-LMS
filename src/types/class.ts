import { ID, Programme } from "./common";

export interface Class {
  id: ID;
  name: string;
  subject: string;
  gradeLevel: string;
  type: "homeroom" | "subject";
  programme: Programme;
  studentIds: ID[];
  schedule: TimetableSlot[];
  academicYear: string;
  term: string;
}

export interface TimetableSlot {
  day: "mon" | "tue" | "wed" | "thu" | "fri";
  startTime: string;
  endTime: string;
  room?: string;
}
