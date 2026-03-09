import { ID } from "./common";

export type GoalStatus = "active" | "completed" | "archived";

export interface StudentGoal {
  id: ID;
  studentId: ID;
  title: string;
  description: string;
  status: GoalStatus;
  /** Classes this goal relates to (optional context) */
  linkedClassIds: ID[];
  /** Curriculum learning goals this personal goal relates to */
  linkedLearningGoalIds: ID[];
  /** Unit plans this goal relates to (optional context) */
  linkedUnitIds: ID[];
  /** Student reflection on overall goal */
  reflection?: string;
  createdAt: string;
  updatedAt: string;
}
