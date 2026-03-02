import { ID } from "./common";

export type RsvpStatus = "attending" | "maybe" | "declined";

export interface CalendarEvent {
  id: ID;
  title: string;
  description?: string;
  type: "class" | "meeting" | "video_call" | "deadline" | "event";
  classId?: ID;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  videoCallUrl?: string;
  linkedAssessmentId?: ID;
  linkedReportCycleId?: ID;
  linkedIncidentId?: ID;
  rsvpStatus?: RsvpStatus;
  recurrence?: "none" | "weekly";
  room?: string;
  attendees?: string[];
}
