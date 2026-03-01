import { ID } from "./common";

export interface Channel {
  id: ID;
  classId: ID;
  name: string;
  type: "general" | "announcements" | "assignments";
  createdAt: string;
}

export interface Announcement {
  id: ID;
  channelId: ID;
  classId: ID;
  title: string;
  body: string;
  translatedBody?: string;
  translatedLanguage?: string;
  attachments: AnnouncementAttachment[];
  pinnedContext?: PinnedContext;
  status: "draft" | "sent" | "scheduled";
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  threadReplies: ThreadReply[];
}

export interface AnnouncementAttachment {
  id: ID;
  type: "assessment" | "event" | "report" | "file";
  referenceId: ID;
  label: string;
}

export interface PinnedContext {
  type: "class" | "student" | "event" | "assessment" | "report";
  referenceId: ID;
  label: string;
}

export interface ThreadReply {
  id: ID;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface NotificationSettings {
  announcements: boolean;
  assignments: boolean;
  grades: boolean;
  attendance: boolean;
  incidents: boolean;
}
