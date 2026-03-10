/**
 * Grade-save domain logic — single source of truth for payload construction.
 *
 * This is a non-React module. It contains no hooks, no store access, no toast calls.
 * UI orchestration (form state, sheet open/close, toast) stays in hooks/pages.
 */

import type { GradeRecord, SubmissionStatus, ChecklistResultItem } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";
import type { MasteryLevel } from "@/types/common";
import { getGradePercentage, isGradingComplete } from "./grade-helpers";

// ---------------------------------------------------------------------------
// Input types — what the caller passes in from their form state
// ---------------------------------------------------------------------------

export interface GradeFormInputs {
  score: string;
  dpGrade: string;
  mypScores: Record<string, number>;
  checklistResults: Record<string, ChecklistResultItem>;
  rubricScores: Record<string, { criterionId: string; levelId: string; points: number }>;
  standardsMastery: Record<string, string>;
  feedback: string;
  submissionStatus: SubmissionStatus;
}

// ---------------------------------------------------------------------------
// Payload builders
// ---------------------------------------------------------------------------

const MYP_CRITERIA_LABELS = ["A", "B", "C", "D"] as const;

/**
 * Build the grade payload for saving. Handles all 6 grading modes plus excused terminal state.
 *
 * Returns a Partial<GradeRecord> that can be spread into an addGrade or updateGrade call.
 */
export function buildGradePayload(
  assessment: Assessment,
  studentId: string,
  inputs: GradeFormInputs,
): Partial<GradeRecord> {
  const now = new Date().toISOString();

  const base: Partial<GradeRecord> = {
    assessmentId: assessment.id,
    studentId,
    classId: assessment.classId,
    gradingMode: assessment.gradingMode,
    feedback: inputs.feedback.trim() || undefined,
    submissionStatus: inputs.submissionStatus,
    gradedAt: now,
  };

  if (inputs.submissionStatus === "excused") {
    return buildExcusedPayload(base);
  }

  // Normal grading — attach mode-specific data, then infer mastery, then set gradingStatus
  const result = attachModeSpecificData(base, assessment, inputs);
  inferStandardsMastery(result, assessment);

  // Set gradingStatus based on completeness
  // Build a temp GradeRecord to check completion
  const tempGrade = {
    id: "",
    assessmentId: assessment.id,
    studentId,
    classId: assessment.classId,
    gradingMode: assessment.gradingMode,
    submissionStatus: inputs.submissionStatus,
    ...result,
  } as GradeRecord;

  result.gradingStatus = isGradingComplete(tempGrade, assessment) ? "ready" : "in_progress";

  return result;
}

/**
 * Excused: explicitly clear ALL grade payloads, feedback, and submission artifacts.
 * This is the terminal state — no grade data should remain.
 */
function buildExcusedPayload(base: Partial<GradeRecord>): Partial<GradeRecord> {
  const now = new Date().toISOString();
  return {
    ...base,
    score: undefined,
    dpGrade: undefined,
    mypCriteriaScores: undefined,
    rubricScores: undefined,
    standardsMastery: undefined,
    checklistGradeResults: undefined,
    checklistResults: undefined,
    feedback: undefined,
    feedbackAttachments: undefined,
    gradingStatus: undefined,
    amendedAt: undefined,
    reportStatus: undefined,
    gradedAt: undefined,
    submittedAt: undefined,
    releasedAt: undefined,
    updatedAt: now,
  };
}

/**
 * Attach mode-specific grade data based on the assessment's grading mode.
 */
function attachModeSpecificData(
  base: Partial<GradeRecord>,
  assessment: Assessment,
  inputs: GradeFormInputs,
): Partial<GradeRecord> {
  switch (assessment.gradingMode) {
    case "score":
      base.score = parseInt(inputs.score) || 0;
      base.totalPoints = assessment.totalPoints;
      break;

    case "dp_scale":
      base.dpGrade =
        inputs.dpGrade != null && !isNaN(parseInt(inputs.dpGrade))
          ? parseInt(inputs.dpGrade)
          : 4;
      break;

    case "myp_criteria":
      base.mypCriteriaScores = MYP_CRITERIA_LABELS.map((c) => ({
        criterionId: `crit_${c}`,
        criterion: c,
        level: inputs.mypScores[c] ?? 0,
      }));
      break;

    case "checklist":
      base.checklistGradeResults = (assessment.checklist ?? []).map((item) => {
        const result = inputs.checklistResults[item.id];
        return {
          itemId: item.id,
          status: result?.status ?? "unmarked",
          evidence: result?.evidence,
        };
      });
      break;

    case "rubric":
      base.rubricScores = Object.values(inputs.rubricScores)
        .filter((r) => r.levelId)
        .map((r) => ({
          criterionId: r.criterionId,
          levelId: r.levelId,
          points: r.points,
        }));
      break;

    case "standards":
      base.standardsMastery = Object.entries(inputs.standardsMastery)
        .filter(([, level]) => level && level !== "not_assessed")
        .map(([standardId, level]) => ({
          standardId,
          level: level as MasteryLevel,
        }));
      break;
  }

  return base;
}

// ---------------------------------------------------------------------------
// Auto-infer standards mastery from grade percentage
// ---------------------------------------------------------------------------

/**
 * Mastery inference thresholds: grade % → mastery level.
 * Only applied for non-"standards" grading modes (where teacher sets mastery manually).
 */
const MASTERY_THRESHOLDS: [number, MasteryLevel][] = [
  [85, "exceeding"],
  [70, "meeting"],
  [50, "approaching"],
  [0, "beginning"],
];

function percentageToMastery(pct: number): MasteryLevel {
  for (const [threshold, level] of MASTERY_THRESHOLDS) {
    if (pct >= threshold) return level;
  }
  return "beginning";
}

/**
 * Auto-infer standardsMastery from grade percentage for non-standards grading modes.
 *
 * Mutates `payload` in place — sets `standardsMastery` based on the grade percentage
 * mapped against the assessment's `learningGoalIds`.
 *
 * Skips when:
 * - gradingMode is "standards" (teacher manually sets mastery — don't overwrite)
 * - assessment has no learningGoalIds
 * - submissionStatus is "excused" or "missing"
 * - grade percentage is null (feedback-only checklists, incomplete grade)
 */
function inferStandardsMastery(
  payload: Partial<GradeRecord>,
  assessment: Assessment,
): void {
  // Standards mode: teacher sets mastery directly — don't override
  if (assessment.gradingMode === "standards") return;

  // No learning goals tagged → nothing to infer
  if (!assessment.learningGoalIds || assessment.learningGoalIds.length === 0) return;

  // Excused → no grade data to infer from
  if (payload.submissionStatus === "excused") return;

  // Build a temporary GradeRecord-like object from the payload for getGradePercentage
  const tempGrade = {
    id: "",
    assessmentId: assessment.id,
    studentId: payload.studentId ?? "",
    classId: assessment.classId,
    gradingMode: assessment.gradingMode,
    submissionStatus: payload.submissionStatus ?? ("none" as const),
    score: payload.score,
    totalPoints: payload.totalPoints,
    dpGrade: payload.dpGrade,
    mypCriteriaScores: payload.mypCriteriaScores,
    rubricScores: payload.rubricScores,
    checklistGradeResults: payload.checklistGradeResults,
    standardsMastery: payload.standardsMastery,
  } as GradeRecord;

  const pct = getGradePercentage(tempGrade, assessment);

  // No computable percentage (e.g., feedback-only checklist) → skip
  if (pct === null) return;

  const level = percentageToMastery(pct);

  payload.standardsMastery = assessment.learningGoalIds.map((goalId) => ({
    standardId: goalId,
    level,
  }));
}
