import { ID } from "./common";

export type GoalEvidenceSourceType = "portfolio_artifact" | "submission" | "report" | "manual";
export type GoalEvidenceSurface = "portfolio" | "submission" | "report" | "returned_work" | "goal_detail";

export interface GoalEvidenceLink {
  id: ID;
  goalId: ID;
  sourceType: GoalEvidenceSourceType;
  /** ID of the linked entity — empty string for manual evidence */
  sourceId: ID;
  addedAt: string;
  /** Required reflection — why this evidence matters to the goal */
  reflection: string;
  /** Where the user initiated the "add to goal" action */
  addedFromSurface?: GoalEvidenceSurface;
  /** Title for manual/raw evidence (student-provided) */
  manualTitle?: string;
  /** URL for student-uploaded media on manual evidence (simulated) */
  manualMediaUrl?: string;
}
