import type { GradeRecord } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";

// IB MYP boundary-grade table: criteria total (0-32) → boundary grade (1-7)
const MYP_BOUNDARY_THRESHOLDS: [number, number][] = [
  [28, 7],
  [24, 6],
  [19, 5],
  [15, 4],
  [10, 3],
  [6, 2],
  [1, 1],
];

/**
 * Convert a MYP criteria total (out of 32) into a boundary grade (1–7).
 * Returns null if total is 0 or negative.
 */
export function getMYPBoundaryGrade(criteriaTotal: number): number | null {
  if (criteriaTotal <= 0) return null;
  for (const [threshold, grade] of MYP_BOUNDARY_THRESHOLDS) {
    if (criteriaTotal >= threshold) return grade;
  }
  return 1;
}

export const GRADING_MODE_LABELS: Record<string, string> = {
  score: "Score",
  rubric: "Rubric",
  standards: "Standards",
  myp_criteria: "MYP Criteria",
  dp_scale: "DP Scale (1-7)",
};

/**
 * Returns a short display string for a grade cell (e.g. "5/8", "42", "M", "✓").
 * Handles all five grading modes: score, dp_scale, myp_criteria, rubric, standards.
 */
export function getGradeCellDisplay(
  grade: GradeRecord | undefined,
  assessment: Assessment
): string {
  if (!grade) return "-";
  if (grade.isMissing) return "M";
  if (assessment.gradingMode === "score") {
    if (grade.score != null && assessment.totalPoints)
      return `${grade.score}/${assessment.totalPoints}`;
    if (grade.score != null) return `${grade.score}`;
    return "-";
  }
  if (assessment.gradingMode === "dp_scale") {
    return grade.dpGrade != null ? `${grade.dpGrade}` : "-";
  }
  if (assessment.gradingMode === "myp_criteria") {
    if (grade.mypCriteriaScores?.length) {
      const assessed = grade.mypCriteriaScores.filter((c) => c.level > 0);
      if (assessed.length === 0) return "N/A";
      const avg = assessed.reduce((s, c) => s + c.level, 0) / assessed.length;
      return `${avg.toFixed(1)}`;
    }
    return "-";
  }
  if (assessment.gradingMode === "rubric") {
    if (grade.rubricScores?.length) {
      const total = grade.rubricScores.reduce((s, r) => s + r.points, 0);
      return `${total}`;
    }
    return "-";
  }
  if (assessment.gradingMode === "standards") {
    if (grade.standardsMastery?.length) {
      return "✓";
    }
    return "-";
  }
  return "-";
}

/**
 * Returns a normalised 0–100 percentage for a grade, or null if not computable.
 * Handles all five grading modes.
 */
export function getGradePercentage(
  grade: GradeRecord | undefined,
  assessment: Assessment
): number | null {
  if (!grade || grade.isMissing) return null;
  if (
    assessment.gradingMode === "score" &&
    grade.score != null &&
    assessment.totalPoints
  ) {
    return Math.round((grade.score / assessment.totalPoints) * 100);
  }
  if (assessment.gradingMode === "dp_scale" && grade.dpGrade != null) {
    return Math.round((grade.dpGrade / 7) * 100);
  }
  if (
    assessment.gradingMode === "myp_criteria" &&
    grade.mypCriteriaScores?.length
  ) {
    const assessed = grade.mypCriteriaScores.filter((c) => c.level > 0);
    if (assessed.length === 0) return null;
    const avg = assessed.reduce((s, c) => s + c.level, 0) / assessed.length;
    return Math.round((avg / 8) * 100);
  }
  if (assessment.gradingMode === "rubric" && grade.rubricScores?.length) {
    const total = grade.rubricScores.reduce((s, r) => s + r.points, 0);
    const maxTotal = (assessment.rubricCriteria || []).reduce(
      (s, c) => s + c.maxScore,
      0
    );
    if (maxTotal === 0) return null;
    return Math.round((total / maxTotal) * 100);
  }
  if (
    assessment.gradingMode === "standards" &&
    grade.standardsMastery?.length
  ) {
    // Standards-based: count the proportion of mastered standards (meeting or exceeding)
    const mastered = grade.standardsMastery.filter(
      (sm) => sm.level === "meeting" || sm.level === "exceeding"
    ).length;
    return Math.round((mastered / grade.standardsMastery.length) * 100);
  }
  return null;
}
