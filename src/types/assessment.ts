import { ID, GradingMode, AssessmentStatus } from "./common";

export type AssessmentType = "off_platform" | "quiz" | "chat" | "essay";
export type AssessmentIntent = "formative" | "summative";
export type OffPlatformSubmissionMode = "digital_submission" | "offline_mode";

export interface OffPlatformAssessmentConfig {
  submissionMode: OffPlatformSubmissionMode;
  allowTextResponse?: boolean;
  allowAttachments?: boolean;
  evidencePrompt?: string;
}

export interface QuizQuestion {
  id: ID;
  prompt: string;
  type: "multiple_choice" | "multi_select" | "short_answer";
  options?: string[];
  answerKey?: string[];
  maxPoints?: number;
}

export interface QuizAssessmentConfig {
  durationMinutes?: number;
  passingScore?: number;
  questions: QuizQuestion[];
  showCorrectAnswersOnRelease?: boolean;
}

export interface ChatAssessmentConfig {
  starterPrompt: string;
  minimumTurns?: number;
  successCriteria?: string[];
}

export interface EssayAssessmentConfig {
  prompt: string;
  minimumWords?: number;
  recommendedWords?: number;
  maximumWords?: number;
  scaffoldPrompts?: string[];
  allowAttachments?: boolean;
}

/**
 * Assessment — teacher-owned entity that serves as grading configuration,
 * student work item, calendar trigger, and announcement trigger.
 *
 * Persona ownership: TEACHER (students see a projected view via `projectStudentAssessment()`).
 *
 * Status semantics:
 * - `status: "draft"` → teacher-only, not visible to students
 * - `status: "live"` → student-visible and open for submission
 * - `status: "closed"` → read-only for students
 * - legacy `"published"` maps to `"live"` and `"archived"` maps to `"closed"`
 *
 * Student visibility gate: assessment must be non-draft and assigned to the student when `assignedStudentIds` exists.
 * Grade visibility gate: per-student `GradeRecord.releasedAt`.
 */
export interface Assessment {
  id: ID;
  title: string;
  description: string;
  classId: ID;
  assessmentType?: AssessmentType;
  assessmentIntent?: AssessmentIntent;
  offPlatformConfig?: OffPlatformAssessmentConfig;
  quizConfig?: QuizAssessmentConfig;
  chatConfig?: ChatAssessmentConfig;
  essayConfig?: EssayAssessmentConfig;
  /** Determines grade data shape, grading UI, and display format. Set at creation, do not change after grading begins. */
  gradingMode: GradingMode;
  /** Teacher-owned lifecycle: draft → live → closed. "live" = student-visible and open for submission. */
  status: AssessmentStatus;
  dueDate: string;
  createdAt: string;
  /** Denominator for score mode. Student sees this as "X/totalPoints". */
  totalPoints?: number;
  rubric?: RubricCriterion[];
  checklist?: ChecklistItem[];
  checklistSections?: ChecklistSection[];
  checklistResponseStyle?: ChecklistResponseStyle;
  /**
   * ⚠️ When set to "feedback_only", checklists are excluded from ALL numeric averages.
   * UX does not currently surface this consequence during configuration.
   */
  checklistOutcomeModel?: ChecklistOutcomeModel;
  standardIds?: ID[];
  learningGoalIds: ID[];
  /** Audit trail: ISO timestamp when assessment became student-visible. */
  distributedAt?: string;
  /** Forward ref to auto-created announcement on publish. */
  linkedAnnouncementId?: ID;
  /** If set, only these students see the assessment. Seed-only — no UI for teacher to set this yet. */
  assignedStudentIds?: ID[];
  rubricCriteria?: SimpleCriterion[];
  /** MYP-specific criteria (A-D, max level 8). */
  mypCriteria?: MYPCriterion[];
  /** Optional unit grouping. ⚠️ Can reference draft UnitPlan — student projections should filter. */
  unitId?: ID;
  /** Optional lesson linkage when the assessment is created from or associated with a lesson. */
  linkedLessonId?: ID;
  /** Student-facing instructions (teacher sets when publishing). */
  studentInstructions?: string;
  /** Student-facing resource links (teacher sets when publishing). */
  studentResources?: { label: string; url: string }[];
  /**
   * ISO timestamp when assessment was closed.
   * When set with forceClosed=true, all non-terminal grade rows were set to excused on close.
   */
  /**
   * @deprecated Bulk grade release is no longer used. Prefer per-student `GradeRecord.releasedAt`.
   */
  gradesReleasedAt?: string;
  closedAt?: string;
  /**
   * Whether non-terminal students were force-excused when the assessment was closed.
   * Only relevant when closedAt is set.
   */
  forceClosed?: boolean;
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
