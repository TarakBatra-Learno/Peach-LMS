/**
 * Grade analytics selectors — centralized computation of grade statistics.
 *
 * Pure functions. No React, no store access. Callers pass data in.
 * Only centralizes analytics that are already duplicated across active surfaces.
 */

import type { GradeRecord } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";
import type { LearningGoal } from "@/types/assessment";
import type { Student } from "@/types/student";
import { isGradeComplete, getGradePercentage } from "@/lib/grade-helpers";

// ---------------------------------------------------------------------------
// Per-class average (normalized percentage across all graded assessments)
// Used by: class hub grades tab, dashboard (when class-level analytics are shown)
// ---------------------------------------------------------------------------

/**
 * Compute a class-wide average grade as a normalised 0-100 percentage.
 * Excludes excused students. Returns null if no valid data.
 */
export function computeClassAveragePercent(
  grades: GradeRecord[],
  assessments: Assessment[],
  classId: string,
): number | null {
  const percentages: number[] = [];
  for (const g of grades) {
    if (g.classId !== classId) continue;
    if (g.submissionStatus === "excused") continue;
    const asmt = assessments.find((a) => a.id === g.assessmentId);
    if (!asmt) continue;
    const pct = getGradePercentage(g, asmt);
    if (pct !== null) percentages.push(pct);
  }
  if (percentages.length === 0) return null;
  return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
}

// ---------------------------------------------------------------------------
// Per-assessment average (mode-specific display string)
// Used by: assessment detail page
// ---------------------------------------------------------------------------

/**
 * Compute the average grade for a single assessment, returned as a
 * display string appropriate to the assessment's grading mode.
 */
export function computeAssessmentAverage(
  grades: GradeRecord[],
  assessment: Assessment,
): string {
  const validGrades = grades.filter((g) => isGradeComplete(g, assessment));
  if (validGrades.length === 0) return "N/A";

  switch (assessment.gradingMode) {
    case "score": {
      const avg = validGrades.reduce((sum, g) => sum + (g.score || 0), 0) / validGrades.length;
      return assessment.totalPoints
        ? `${Math.round(avg)}/${assessment.totalPoints}`
        : `${Math.round(avg)}%`;
    }
    case "dp_scale": {
      const avg = validGrades.reduce((sum, g) => sum + (g.dpGrade || 0), 0) / validGrades.length;
      return `${avg.toFixed(1)}/7`;
    }
    case "myp_criteria": {
      const allLevels = validGrades.flatMap((g) => g.mypCriteriaScores || []);
      if (allLevels.length === 0) return "N/A";
      const avg = allLevels.reduce((s, c) => s + c.level, 0) / allLevels.length;
      return `${avg.toFixed(1)}/8`;
    }
    case "checklist": {
      if (assessment.checklistOutcomeModel === "score_contributing") {
        const pcts = validGrades
          .map((g) => getGradePercentage(g, assessment))
          .filter((v): v is number => v !== null);
        if (pcts.length === 0) return "N/A";
        return `${Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length)}%`;
      }
      // feedback_only: show met count summary
      const totalItems = assessment.checklist?.length ?? 0;
      const metCounts = validGrades.map(
        (g) =>
          g.checklistGradeResults?.filter(
            (r) => r.status === "met" || r.status === "yes"
          ).length ?? 0
      );
      const avgMet =
        metCounts.length > 0
          ? (metCounts.reduce((s, v) => s + v, 0) / metCounts.length).toFixed(1)
          : "0";
      return `${avgMet}/${totalItems} avg met`;
    }
    default:
      return `${validGrades.length} graded`;
  }
}

// ---------------------------------------------------------------------------
// Attention students
// Used by: class hub grades tab
// ---------------------------------------------------------------------------

export interface AttentionStudent {
  student: Student;
  reasons: string[];
  avg: number | null;
}

/**
 * Identify students needing attention based on:
 * - Average below 50%
 * - Beginning mastery levels
 */
export function computeAttentionStudents(
  students: Student[],
  grades: GradeRecord[],
  publishedAssessments: Assessment[],
  learningGoals: LearningGoal[],
  classId: string,
): AttentionStudent[] {
  return students
    .map((student) => {
      const reasons: string[] = [];

      // Average below 50%
      const pcts = publishedAssessments
        .map((a) => {
          const g = grades.find(
            (gr) => gr.studentId === student.id && gr.assessmentId === a.id
          );
          return getGradePercentage(g, a);
        })
        .filter((v): v is number => v !== null);
      const avg =
        pcts.length > 0
          ? pcts.reduce((a, b) => a + b, 0) / pcts.length
          : null;
      if (avg !== null && avg < 50) reasons.push("Below 50%");

      // Beginning mastery levels
      const beginningGoals: string[] = [];
      grades
        .filter(
          (g) =>
            g.studentId === student.id &&
            g.classId === classId &&
            g.submissionStatus !== "excused" &&
            g.standardsMastery?.length
        )
        .forEach((g) => {
          g.standardsMastery?.forEach((sm) => {
            if (sm.level === "beginning") {
              const goal = learningGoals.find((lg) => lg.id === sm.standardId);
              if (goal && !beginningGoals.includes(goal.code)) {
                beginningGoals.push(goal.code);
              }
            }
          });
        });
      if (beginningGoals.length > 0)
        reasons.push(`Beginning in ${beginningGoals.slice(0, 2).join(", ")}`);

      return { student, reasons, avg };
    })
    .filter((s) => s.reasons.length > 0)
    .sort((a, b) => (a.avg ?? 100) - (b.avg ?? 100));
}

// ---------------------------------------------------------------------------
// Weakest goals/standards
// Used by: class hub grades tab
// ---------------------------------------------------------------------------

export interface GoalStat {
  code: string;
  title: string;
  below: number;
  total: number;
  levels: Record<string, number>;
}

/**
 * Compute weakest learning goals by proportion of below-proficient mastery.
 */
export function computeWeakestGoals(
  students: Student[],
  grades: GradeRecord[],
  publishedAssessments: Assessment[],
  learningGoals: LearningGoal[],
): GoalStat[] {
  const goalStats: Record<string, GoalStat> = {};

  for (const asmt of publishedAssessments) {
    for (const student of students) {
      const g = grades.find(
        (gr) => gr.studentId === student.id && gr.assessmentId === asmt.id
      );
      if (g?.submissionStatus === "excused") continue;
      g?.standardsMastery?.forEach((sm) => {
        const goal = learningGoals.find((lg) => lg.id === sm.standardId);
        if (!goal) return;
        if (!goalStats[goal.id]) {
          goalStats[goal.id] = {
            code: goal.code,
            title: goal.title,
            below: 0,
            total: 0,
            levels: {},
          };
        }
        goalStats[goal.id].total++;
        goalStats[goal.id].levels[sm.level] =
          (goalStats[goal.id].levels[sm.level] || 0) + 1;
        if (sm.level === "beginning" || sm.level === "approaching") {
          goalStats[goal.id].below++;
        }
      });
    }
  }

  return Object.values(goalStats)
    .filter((g) => g.total > 0)
    .sort((a, b) => b.below / b.total - a.below / a.total)
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Unreleased grades count
// Used by: assessment detail page (teacher view)
// ---------------------------------------------------------------------------

/**
 * Count how many grades are ready to be released for a specific assessment.
 * A grade is "unreleased" if:
 * - It's for the given assessment
 * - Student is not excused
 * - Student has submitted work (grade.submittedAt is set)
 * - Grade has not been released yet (grade.releasedAt is null)
 */
export function computeUnreleasedGradesCount(
  grades: GradeRecord[],
  assessmentId: string,
): number {
  return grades.filter((g) => {
    if (g.assessmentId !== assessmentId) return false;
    if (g.submissionStatus === "excused") return false;
    if (!g.submittedAt) return false; // no submission
    if (g.releasedAt) return false; // already released
    return true;
  }).length;
}

// ---------------------------------------------------------------------------
// Per-assessment chart data
// Used by: class hub grades tab
// ---------------------------------------------------------------------------

export interface AssessmentChartPoint {
  name: string;
  avg: number;
  fullName: string;
}

/**
 * Compute per-assessment average percentages for chart rendering.
 */
export function computeAssessmentChartData(
  students: Student[],
  grades: GradeRecord[],
  assessments: Assessment[],
): AssessmentChartPoint[] {
  // Only include assessments that have at least one student with numeric data
  const withData = assessments.filter((asmt) =>
    students.some((s) => {
      const g = grades.find(
        (gr) => gr.studentId === s.id && gr.assessmentId === asmt.id
      );
      return getGradePercentage(g, asmt) !== null;
    })
  );

  return withData.map((asmt) => {
    const pcts = students
      .map((s) => {
        const g = grades.find(
          (gr) => gr.studentId === s.id && gr.assessmentId === asmt.id
        );
        return getGradePercentage(g, asmt);
      })
      .filter((v): v is number => v !== null);
    const avg =
      pcts.length > 0
        ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
        : 0;
    return {
      name:
        asmt.title.length > 12
          ? asmt.title.slice(0, 12) + "..."
          : asmt.title,
      avg,
      fullName: asmt.title,
    };
  });
}
