import { ID, Programme } from "./common";

// --- Unit Plan ---

export type UnitStatus = "draft" | "active" | "completed" | "archived";

export interface ConceptualFraming {
  // MYP fields (optional — only relevant for MYP classes)
  keyConcept?: string;
  relatedConcepts?: string[];
  globalContext?: string;
  statementOfInquiry?: string;
  atlFocus?: string[];
  // DP fields (optional — only relevant for DP classes)
  tokConnection?: string;
  casOpportunity?: string;
}

export interface UnitStrategy {
  learningGoals: string[];
  linkedStandardIds: ID[];
  conceptualFraming?: ConceptualFraming;
  assessmentApproach?: string;
  differentiationNotes?: string;
  learningArc?: string;
  resourceLinks?: string[];
}

export interface UnitPlan {
  id: ID;
  classId: ID;
  title: string;
  code?: string;
  summary?: string;
  programme: Programme;
  status: UnitStatus;
  startDate: string;
  endDate: string;
  strategy: UnitStrategy;
  lessonPlanIds: ID[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// --- Lesson Plan ---

export type LessonPlanStatus = "draft" | "ready" | "assigned" | "taught" | "skipped" | "cancelled";

export interface LessonActivity {
  id: ID;
  title: string;
  description?: string;
  durationMinutes?: number;
  type:
    | "intro"
    | "direct_instruction"
    | "group_work"
    | "individual"
    | "discussion"
    | "assessment"
    | "reflection"
    | "other";
  order: number;
}

export interface LessonPlan {
  id: ID;
  unitId: ID;
  classId: ID;
  title: string;
  objectives?: string[];
  sequence: number;
  activities: LessonActivity[];
  teachingNotes?: string;
  resourceLinks?: string[];
  linkedStandardIds: ID[];
  status: LessonPlanStatus;
  estimatedDurationMinutes?: number;
  teacherReflection?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Lesson Slot Assignment ---
// Maps a lesson plan to a specific materialized timetable occurrence.
// Uses slotDay + slotStartTime (not array index) for stability.
// MVP: 1:1 — one lesson plan to one occurrence, one occurrence to one lesson plan.

export interface LessonSlotAssignment {
  id: ID;
  lessonPlanId: ID;
  unitId: ID;
  classId: ID;
  date: string;
  slotDay: "mon" | "tue" | "wed" | "thu" | "fri";
  slotStartTime: string;
  createdAt: string;
}

// --- Materialized Occurrence (not persisted — computed at render time) ---

export interface MaterializedOccurrence {
  date: string;
  slotDay: "mon" | "tue" | "wed" | "thu" | "fri";
  slotStartTime: string;
  slotEndTime: string;
  room?: string;
}
