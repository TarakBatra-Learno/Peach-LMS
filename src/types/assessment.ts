import { ID, GradingMode, Status } from "./common";

export interface Assessment {
  id: ID;
  title: string;
  description: string;
  classId: ID;
  gradingMode: GradingMode;
  status: Status;
  dueDate: string;
  createdAt: string;
  totalPoints?: number;
  rubric?: RubricCriterion[];
  checklist?: ChecklistItem[];
  checklistSections?: ChecklistSection[];
  checklistResponseStyle?: ChecklistResponseStyle;
  checklistOutcomeModel?: ChecklistOutcomeModel;
  standardIds?: ID[];
  learningGoalIds: ID[];
  distributedAt?: string;
  linkedAnnouncementId?: ID;
  assignedStudentIds?: ID[];
  rubricCriteria?: SimpleCriterion[];
  // MYP-specific
  mypCriteria?: MYPCriterion[];
  // Unit planning (optional — assessments work standalone)
  unitId?: ID;
}

export interface SimpleCriterion {
  id: ID;
  name: string;
  description: string;
  maxScore: number;
}

export interface RubricCriterion {
  id: ID;
  title: string;
  levels: RubricLevel[];
  weight: number;
}

export interface RubricLevel {
  id: ID;
  label: string;
  points: number;
  description: string;
}

export type ChecklistResponseStyle = "binary" | "ternary";
// binary = Met / Not yet (2 states)
// ternary = Yes / Partly / No (3 states)

export type ChecklistOutcomeModel = "feedback_only" | "score_contributing";

export interface ChecklistSection {
  id: ID;
  title: string;
  itemIds: ID[]; // ordered references — sole source of section membership
}

export interface ChecklistItem {
  id: ID;
  label: string;
  required: boolean;
  helpText?: string; // optional guidance text
  requireEvidence?: boolean; // soft prompt — show evidence textarea (non-blocking)
  points?: number; // point value (for score-contributing outcome model)
}

export interface MYPCriterion {
  id: ID;
  criterion: "A" | "B" | "C" | "D";
  title: string;
  maxLevel: number; // typically 8
  strandDescriptors: string[];
}

export interface LearningGoal {
  id: ID;
  code: string;
  title: string;
  subject: string;
  strand?: string;
  category?: "standard" | "atl_skill" | "learner_profile";
}
