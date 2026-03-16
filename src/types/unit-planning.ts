import { ID, Programme } from "./common";

// --- Unit Plan ---

export type UnitStatus = "draft" | "active" | "completed" | "archived";

export interface PlanningCollaborator {
  id: ID;
  name: string;
  initials: string;
  role?: "owner" | "reviewer" | "collaborator";
}

export interface SectionComment {
  id: ID;
  sectionKey: string;
  authorId: ID;
  authorName: string;
  body: string;
  createdAt: string;
}

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

export interface UnitInquiryBlock {
  statement?: string;
  factualQuestions?: string[];
  conceptualQuestions?: string[];
  debatableQuestions?: string[];
}

export interface UnitLearningFocus {
  atlSkillIds?: ID[];
  learnerProfileIds?: ID[];
  objectiveLabels?: string[];
}

export interface UnitActionPlan {
  differentiationNotes?: string;
  resourceLinks?: string[];
  linkedAssessmentIds?: ID[];
  communityConnections?: string[];
}

export interface UnitEvidencePlan {
  portfolioSignals?: string[];
  standardsFocusIds?: ID[];
  learningGoalIds?: ID[];
}

export interface UnitReflectionPlan {
  prompts: string[];
  teacherNotes?: string;
}

export interface UnitStrategy {
  learningGoals: string[];
  linkedStandardIds: ID[];
  durationWeeks?: number;
  durationHours?: number;
  conceptualFraming?: ConceptualFraming;
  inquiry?: UnitInquiryBlock;
  learningFocus?: UnitLearningFocus;
  assessmentApproach?: string;
  action?: UnitActionPlan;
  evidence?: UnitEvidencePlan;
  reflection?: UnitReflectionPlan;
  learningArc?: string;
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
  collaborators?: PlanningCollaborator[];
  sectionComments?: SectionComment[];
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
  category?: string;
  sequence: number;
  activities: LessonActivity[];
  teachingNotes?: string;
  teacherNotes?: string;
  audioDescription?: string;
  submissionTemplate?: string;
  resourceLinks?: string[];
  linkedStandardIds: ID[];
  linkedAssessmentIds?: ID[];
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
