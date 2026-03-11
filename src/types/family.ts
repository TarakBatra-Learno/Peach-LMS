import { ID } from "./common";

export type FamilyNotificationCategory =
  | "announcements"
  | "messages"
  | "classroom_updates"
  | "portfolio"
  | "assessment_results"
  | "attendance"
  | "reports"
  | "events"
  | "deadlines";

export type FamilyDeliveryCadence = "instant" | "daily_digest";

export interface FamilyNotificationPreference {
  scope: "all" | ID;
  category: FamilyNotificationCategory;
  inApp: boolean;
  email: boolean;
  push: boolean;
  cadence: FamilyDeliveryCadence;
}

export interface ParentProfile {
  id: ID;
  householdName: string;
  name: string;
  email: string;
  relationshipLabel: string;
  preferredLanguage: string;
  uiLanguage: string;
  translationLanguage: string;
  autoTranslateCommunications: boolean;
  linkedStudentIds: ID[];
  avatarInitials: string;
  signInMethod: "email" | "google" | "microsoft";
  directMessagingEnabled: boolean;
  channelParticipationEnabled: boolean;
  notificationPreferences: FamilyNotificationPreference[];
  quietHours?: {
    start: string;
    end: string;
  };
}

export type FamilyNotificationType =
  | "announcement"
  | "message"
  | "channel_activity"
  | "portfolio"
  | "report"
  | "assessment_result"
  | "attendance"
  | "deadline"
  | "event";

export interface FamilyNotification {
  id: ID;
  parentId: ID;
  studentId?: ID;
  type: FamilyNotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  linkTo?: string;
  childLabel?: string;
}

export interface FamilyAttachment {
  id: ID;
  label: string;
  type: "assessment" | "report" | "event" | "file" | "policy";
  referenceId?: ID;
  url?: string;
}

export interface ClassroomUpdate {
  id: ID;
  classId: ID;
  studentIds: ID[];
  title: string;
  body: string;
  translatedBody?: string;
  translatedLanguage?: string;
  teacherName: string;
  createdAt: string;
  unitId?: ID;
  mediaType?: "image" | "video" | "document";
  mediaUrl?: string;
  attachmentLabel?: string;
  tags?: string[];
}

export interface SchoolPolicy {
  id: ID;
  category: "Handbook" | "Assessment" | "Attendance" | "Safeguarding" | "Technology";
  title: string;
  summary: string;
  body: string;
  translatedBody?: string;
  translatedLanguage?: string;
  publishedAt: string;
  attachment?: FamilyAttachment;
}

export interface StudentSignInCode {
  id: ID;
  studentId: ID;
  code: string;
  qrValue: string;
  enabled: boolean;
  expiresAt?: string;
  instructions: string;
}

export interface FamilyAnnouncement {
  id: ID;
  title: string;
  body: string;
  translatedBody?: string;
  translatedLanguage?: string;
  audience: "school" | "class";
  classId?: ID;
  studentIds: ID[];
  attachments: FamilyAttachment[];
  urgent?: boolean;
  emailMirrored?: boolean;
  createdAt: string;
  sentAt: string;
  readByParentIds: ID[];
}

export interface FamilyThread {
  id: ID;
  kind: "direct" | "channel";
  title: string;
  classId?: ID;
  studentId?: ID;
  participantIds: ID[];
  teacherName?: string;
  subtitle?: string;
  createdAt: string;
  lastMessageAt: string;
  mutedByParentIds: ID[];
  schoolManaged?: boolean;
}

export interface FamilyMessage {
  id: ID;
  threadId: ID;
  authorId: ID;
  authorName: string;
  authorRole: "teacher" | "parent" | "school";
  body: string;
  translatedBody?: string;
  translatedLanguage?: string;
  attachments: FamilyAttachment[];
  createdAt: string;
  readByParentIds: ID[];
}

export interface FamilyCalendarEvent {
  id: ID;
  title: string;
  description: string;
  type: "school_event" | "class_event" | "meeting";
  classId?: ID;
  studentIds: ID[];
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  location?: string;
  meetingLink?: string;
  attachment?: FamilyAttachment;
}
