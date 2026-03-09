import type { GradeRecord } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";

// ---------------------------------------------------------------------------
// Published due-date helper — single source of truth
// ---------------------------------------------------------------------------

function isWithinDays(dateStr: string, days: number): boolean {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Return only published assessments with a due date within the given window.
 * This is the single source of truth for "due soon" filtering.
 */
export function getPublishedDueAssessments(
  assessments: Assessment[],
  withinDays = 7
): Assessment[] {
  return assessments.filter(
    (a) => a.status === "published" && a.dueDate && isWithinDays(a.dueDate, withinDays)
  );
}

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
  checklist: "Checklist",
};

// ---------------------------------------------------------------------------
// Derived assessment status
// ---------------------------------------------------------------------------

export type StudentAssessmentStatus =
  | "pending"     // no grade record, or submissionStatus "none" + ungraded
  | "submitted"   // submissionStatus "submitted" + ungraded  →  "To mark"
  | "completed"   // has mode-specific grade data (graded)
  | "missing"     // submissionStatus "missing" + ungraded
  | "excused";    // submissionStatus "excused" (terminal state, always wins)

/**
 * Derive the per-student assessment status from a grade record.
 *
 * Priority:
 *   1. No grade record → Pending
 *   2. Excused → Excused (terminal state, always wins regardless of grade data)
 *   3. Graded (mode-specific data exists) → Completed
 *   4. Not graded → derive from submissionStatus
 */
export function getStudentAssessmentStatus(
  grade: GradeRecord | undefined,
  assessment: Assessment
): StudentAssessmentStatus {
  if (!grade) return "pending";

  // Excused is a terminal state — always wins, regardless of residual grade data
  if (grade.submissionStatus === "excused") return "excused";

  const graded = isGradeComplete(grade, assessment);
  if (graded) return "completed";

  // Not graded — derive from submission status
  switch (grade.submissionStatus) {
    case "submitted":
      return "submitted"; // THIS is "To mark"
    case "missing":
      return "missing";
    case "none":
    default:
      return "pending";
  }
}

/**
 * Count students whose derived status is "submitted" (i.e., to mark).
 */
export function getToMarkCount(
  studentIds: string[],
  grades: GradeRecord[],
  assessment: Assessment
): number {
  return studentIds.filter((sid) => {
    const grade = grades.find(
      (g) => g.studentId === sid && g.assessmentId === assessment.id
    );
    return getStudentAssessmentStatus(grade, assessment) === "submitted";
  }).length;
}

/**
 * Count students whose derived status is "missing".
 */
export function getMissingCount(
  studentIds: string[],
  grades: GradeRecord[],
  assessment: Assessment
): number {
  return studentIds.filter((sid) => {
    const grade = grades.find(
      (g) => g.studentId === sid && g.assessmentId === assessment.id
    );
    return getStudentAssessmentStatus(grade, assessment) === "missing";
  }).length;
}

/**
 * Count students whose derived status is "excused".
 */
export function getExcusedCount(
  studentIds: string[],
  grades: GradeRecord[],
  assessment: Assessment
): number {
  return studentIds.filter((sid) => {
    const grade = grades.find(
      (g) => g.studentId === sid && g.assessmentId === assessment.id
    );
    return grade?.submissionStatus === "excused";
  }).length;
}

/**
 * Returns the number of students expected to submit (total minus excused).
 */
export function getExpectedStudentCount(
  studentIds: string[],
  grades: GradeRecord[],
  assessment: Assessment
): number {
  return studentIds.length - getExcusedCount(studentIds, grades, assessment);
}

/**
 * Returns false if the student is excused from this assessment.
 * Used as a shared predicate for filtering expected submissions.
 */
export function isExpectedSubmission(
  grade: GradeRecord | undefined,
): boolean {
  return grade?.submissionStatus !== "excused";
}

// ---------------------------------------------------------------------------
// Checklist helpers
// ---------------------------------------------------------------------------

/**
 * Derive total points from checklist item point values.
 * Used instead of storing a separate totalPoints field.
 */
export function getChecklistTotalPoints(assessment: Assessment): number {
  return assessment.checklist?.reduce((sum, item) => sum + (item.points ?? 0), 0) ?? 0;
}

/**
 * Compute earned points from checklist grade results.
 * met/yes = full points, partly = 50%, no/not_yet/unmarked = 0
 */
function computeChecklistEarnedPoints(
  grade: GradeRecord,
  assessment: Assessment
): number {
  if (!grade.checklistGradeResults || !assessment.checklist) return 0;
  return grade.checklistGradeResults.reduce((sum, result) => {
    const item = assessment.checklist!.find((i) => i.id === result.itemId);
    if (!item?.points) return sum;
    if (result.status === "met" || result.status === "yes")
      return sum + item.points;
    if (result.status === "partly") return sum + Math.round(item.points * 0.5);
    return sum;
  }, 0);
}

// ---------------------------------------------------------------------------
// Grade display & completeness helpers
// ---------------------------------------------------------------------------

/**
 * Returns a short display string for a grade cell (e.g. "5/8", "42", "M", "E", "✓").
 * Handles all five grading modes: score, dp_scale, myp_criteria, rubric, standards.
 */
export function getGradeCellDisplay(
  grade: GradeRecord | undefined,
  assessment: Assessment
): string {
  if (!grade) return "-";

  // Excused is terminal — always show "E" regardless of residual grade data
  if (grade.submissionStatus === "excused") return "E";

  const graded = isGradeComplete(grade, assessment);

  if (!graded) {
    if (grade.submissionStatus === "missing") return "M";
    return "-";
  }

  // Graded — show mode-specific value
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
  if (assessment.gradingMode === "checklist") {
    if (grade.checklistGradeResults?.length) {
      if (assessment.checklistOutcomeModel === "score_contributing") {
        const earned = computeChecklistEarnedPoints(grade, assessment);
        const total = getChecklistTotalPoints(assessment);
        return total > 0 ? `${earned}/${total}` : `${earned}`;
      }
      // feedback_only
      if (assessment.checklistResponseStyle === "ternary") {
        const yesCount = grade.checklistGradeResults.filter(
          (r) => r.status === "yes"
        ).length;
        const partlyCount = grade.checklistGradeResults.filter(
          (r) => r.status === "partly"
        ).length;
        const noCount = grade.checklistGradeResults.filter(
          (r) => r.status === "no"
        ).length;
        return `${yesCount}✓ ${partlyCount}~ ${noCount}✗`;
      }
      // binary feedback_only
      const metCount = grade.checklistGradeResults.filter(
        (r) => r.status === "met"
      ).length;
      const total = assessment.checklist?.length ?? 0;
      return `${metCount}/${total} met`;
    }
    return "-";
  }
  return "-";
}

/**
 * Returns true when a grade record has been fully entered for its assessment's
 * grading mode. Excused students always return false (non-participating).
 */
export function isGradeComplete(
  grade: GradeRecord | undefined,
  assessment: Assessment
): boolean {
  if (!grade) return false;
  // Excused students are never considered "graded" regardless of residual data
  if (grade.submissionStatus === "excused") return false;
  switch (assessment.gradingMode) {
    case "score":
      return grade.score != null;
    case "dp_scale":
      return grade.dpGrade != null;
    case "myp_criteria":
      return (grade.mypCriteriaScores?.length ?? 0) > 0;
    case "rubric":
      return (grade.rubricScores?.length ?? 0) > 0;
    case "standards":
      return (grade.standardsMastery?.length ?? 0) > 0;
    case "checklist": {
      if (!grade.checklistGradeResults?.length) return false;
      if (!assessment.checklist?.length) return false;
      const requiredItems = assessment.checklist.filter(
        (item) => item.required
      );
      return requiredItems.every((item) =>
        grade.checklistGradeResults!.some(
          (r) => r.itemId === item.id && r.status !== "unmarked"
        )
      );
    }
    default:
      return false;
  }
}

/**
 * Returns a normalised 0–100 percentage for a grade, or null if not computable.
 * Returns null for excused students (always excluded from all math).
 * Returns null for ungraded records.
 */
export function getGradePercentage(
  grade: GradeRecord | undefined,
  assessment: Assessment
): number | null {
  if (!grade) return null;

  // Excused = excluded from all numeric math, even if previously graded
  if (grade.submissionStatus === "excused") return null;

  // If not graded, return null
  const graded = isGradeComplete(grade, assessment);
  if (!graded) return null;

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
  if (
    assessment.gradingMode === "checklist" &&
    grade.checklistGradeResults?.length
  ) {
    // Feedback-only checklists produce NO percentage — excluded from all averages
    if (assessment.checklistOutcomeModel !== "score_contributing") return null;
    const totalPoints = getChecklistTotalPoints(assessment);
    if (totalPoints <= 0) return null;
    const earned = computeChecklistEarnedPoints(grade, assessment);
    return Math.round((earned / totalPoints) * 100);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Student-facing display helpers
// ---------------------------------------------------------------------------
// These provide student-appropriate labels where the teacher-facing helpers
// use abbreviations or teacher-centric language.

/**
 * Student-friendly grade cell display.
 * Identical to `getGradeCellDisplay()` except:
 *   - "E" → "Excused" (spelled out for student clarity)
 *   - "M" → "Missing" (spelled out for student clarity)
 *   - "-" → "—" (em-dash for visual distinction on student surfaces)
 *
 * Use this on student-facing surfaces instead of `getGradeCellDisplay()`.
 */
export function getStudentGradeCellDisplay(
  grade: GradeRecord | undefined,
  assessment: Assessment
): string {
  if (!grade) return "—";

  if (grade.submissionStatus === "excused") return "Excused";

  const graded = isGradeComplete(grade, assessment);

  if (!graded) {
    if (grade.submissionStatus === "missing") return "Missing";
    return "—";
  }

  // For graded values, delegate to the shared implementation
  // (numeric/mode-specific values are the same for both personas)
  return getGradeCellDisplay(grade, assessment);
}

/**
 * Student-friendly status label for StatusBadge overrides.
 * Maps internal status values to student-appropriate display labels.
 *
 * Returns undefined when no override is needed (default StatusBadge label is fine).
 */
export function getStudentStatusLabel(status: string): string | undefined {
  switch (status) {
    case "submitted":
      return "Submitted";
    default:
      return undefined;
  }
}

/**
 * Student-friendly StatusBadge variant override.
 * Returns a variant override when the default is inappropriate for students.
 *
 * Returns undefined when no override is needed.
 */
export function getStudentStatusVariant(status: string): "success" | "warning" | "danger" | "info" | "neutral" | "primary" | undefined {
  switch (status) {
    case "submitted":
      return "success"; // Student: submitting is positive (green), not "needs action" (amber)
    default:
      return undefined;
  }
}
