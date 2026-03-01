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
  standardIds?: ID[];
  learningGoalIds: ID[];
  distributedAt?: string;
  linkedAnnouncementId?: ID;
  assignedStudentIds?: ID[];
  rubricCriteria?: SimpleCriterion[];
  // MYP-specific
  mypCriteria?: MYPCriterion[];
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

export interface ChecklistItem {
  id: ID;
  label: string;
  required: boolean;
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
