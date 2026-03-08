/**
 * Grade-save domain logic — single source of truth for payload construction.
 *
 * This is a non-React module. It contains no hooks, no store access, no toast calls.
 * UI orchestration (form state, sheet open/close, toast) stays in hooks/pages.
 */

import type { GradeRecord, SubmissionStatus, ChecklistResultItem } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";
import type { MasteryLevel } from "@/types/common";

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
 * Build the grade payload for saving. Handles all 6 grading modes,
 * plus excused and missing terminal states.
 *
 * Returns a Partial<GradeRecord> that can be spread into an addGrade or
 * updateGrade call.
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

  if (inputs.submissionStatus === "missing") {
    return buildMissingPayload(base);
  }

  // Normal grading — attach mode-specific data
  return attachModeSpecificData(base, assessment, inputs);
}

/**
 * Excused: explicitly clear ALL grade payloads, feedback, and submission artifacts.
 * This is the terminal state — no grade data should remain.
 */
function buildExcusedPayload(base: Partial<GradeRecord>): Partial<GradeRecord> {
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
    gradedAt: undefined,
    submittedAt: undefined,
  };
}

/**
 * Missing: grade inputs are hidden, so we don't attach mode-specific data.
 * Unlike excused, we preserve the base payload as-is (no explicit clearing).
 */
function buildMissingPayload(base: Partial<GradeRecord>): Partial<GradeRecord> {
  return base;
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
