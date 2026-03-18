import type { Assessment, LearningGoal } from "@/types/assessment";
import type { AssessmentReport } from "@/types/assessment-report";
import type { Class } from "@/types/class";
import type { MasteryLevel } from "@/types/common";
import type { GradeRecord } from "@/types/gradebook";
import type { Report } from "@/types/report";
import type { LessonPlan, UnitPlan } from "@/types/unit-planning";
import type { StudentGoalProgress } from "./student-selectors";

type GoalCategory = "standard" | "atl_skill" | "learner_profile";
type ResolvedMasteryLevel = MasteryLevel | "not_assessed";

const GOAL_CATEGORY_ORDER: GoalCategory[] = ["standard", "atl_skill", "learner_profile"];
const BEST_TO_WORST: ResolvedMasteryLevel[] = [
  "exceeding",
  "meeting",
  "approaching",
  "beginning",
  "not_assessed",
];

function normalizeGoalCategory(category?: LearningGoal["category"]): GoalCategory {
  if (category === "atl_skill" || category === "learner_profile") return category;
  return "standard";
}

function pickBetterLevel(
  current: ResolvedMasteryLevel | null,
  incoming: ResolvedMasteryLevel,
): ResolvedMasteryLevel {
  if (!current) return incoming;
  return BEST_TO_WORST.indexOf(incoming) < BEST_TO_WORST.indexOf(current) ? incoming : current;
}

function sortGoalsByCode<T extends { goalCode: string; goalTitle: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const codeCompare = a.goalCode.localeCompare(b.goalCode);
    if (codeCompare !== 0) return codeCompare;
    return a.goalTitle.localeCompare(b.goalTitle);
  });
}

export interface ClassMasteryStudentLevel {
  studentId: string;
  studentName: string;
  level: ResolvedMasteryLevel;
}

export interface ClassMasteryRow {
  goalId: string;
  goalCode: string;
  goalTitle: string;
  goalCategory: GoalCategory;
  plannedUnitCount: number;
  plannedLessonCount: number;
  linkedAssessmentCount: number;
  trackedStudentCount: number;
  meetingOrAboveCount: number;
  masteryDistribution: Record<ResolvedMasteryLevel, number>;
  studentLevels: ClassMasteryStudentLevel[];
}

export interface ClassMasterySection {
  id: "subject_standards" | "atl_and_attributes";
  title: string;
  description: string;
  rows: ClassMasteryRow[];
}

interface BuildClassMasterySectionsParams {
  classId: string;
  students: { id: string; firstName: string; lastName: string; classIds: string[] }[];
  assessments: Assessment[];
  grades: GradeRecord[];
  learningGoals: LearningGoal[];
  unitPlans: UnitPlan[];
  lessonPlans: LessonPlan[];
}

function unitHasGoal(unit: UnitPlan, goalId: string, category: GoalCategory) {
  if (unit.strategy.linkedStandardIds.includes(goalId)) return true;
  if (unit.strategy.evidence?.learningGoalIds?.includes(goalId)) return true;
  if (unit.strategy.evidence?.standardsFocusIds?.includes(goalId)) return true;
  if (category === "atl_skill" && unit.strategy.learningFocus?.atlSkillIds?.includes(goalId)) return true;
  if (category === "learner_profile" && unit.strategy.learningFocus?.learnerProfileIds?.includes(goalId)) return true;
  return false;
}

function lessonHasGoal(lesson: LessonPlan, goalId: string) {
  return lesson.linkedStandardIds.includes(goalId);
}

export function buildClassMasterySections({
  classId,
  students,
  assessments,
  grades,
  learningGoals,
  unitPlans,
  lessonPlans,
}: BuildClassMasterySectionsParams): ClassMasterySection[] {
  const classStudents = students.filter((student) => student.classIds.includes(classId));
  const classAssessments = assessments.filter((assessment) => assessment.classId === classId);
  const classGrades = grades.filter((grade) => grade.classId === classId);
  const classUnits = unitPlans.filter((unit) => unit.classId === classId);
  const classLessons = lessonPlans.filter((lesson) => lesson.classId === classId);

  const relevantGoalIds = new Set<string>();
  classAssessments.forEach((assessment) => {
    assessment.learningGoalIds.forEach((goalId) => relevantGoalIds.add(goalId));
  });
  classUnits.forEach((unit) => {
    unit.strategy.linkedStandardIds.forEach((goalId) => relevantGoalIds.add(goalId));
    unit.strategy.evidence?.learningGoalIds?.forEach((goalId) => relevantGoalIds.add(goalId));
    unit.strategy.evidence?.standardsFocusIds?.forEach((goalId) => relevantGoalIds.add(goalId));
    unit.strategy.learningFocus?.atlSkillIds?.forEach((goalId) => relevantGoalIds.add(goalId));
    unit.strategy.learningFocus?.learnerProfileIds?.forEach((goalId) => relevantGoalIds.add(goalId));
  });
  classLessons.forEach((lesson) => {
    lesson.linkedStandardIds.forEach((goalId) => relevantGoalIds.add(goalId));
  });

  const rows = learningGoals
    .filter((goal) => relevantGoalIds.has(goal.id))
    .map((goal): ClassMasteryRow => {
      const goalCategory = normalizeGoalCategory(goal.category);
      const plannedUnitCount = classUnits.filter((unit) => unitHasGoal(unit, goal.id, goalCategory)).length;
      const plannedLessonCount = classLessons.filter((lesson) => lessonHasGoal(lesson, goal.id)).length;
      const linkedAssessmentCount = classAssessments.filter((assessment) =>
        assessment.learningGoalIds.includes(goal.id),
      ).length;

      const studentLevels = classStudents.map((student) => {
        const bestLevel = classGrades
          .filter((grade) => grade.studentId === student.id)
          .reduce<ResolvedMasteryLevel | null>((current, grade) => {
            const match = grade.standardsMastery?.find((entry) => entry.standardId === goal.id);
            if (!match) return current;
            return pickBetterLevel(current, match.level);
          }, null);

        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          level: bestLevel ?? "not_assessed",
        };
      });

      const masteryDistribution: Record<ResolvedMasteryLevel, number> = {
        exceeding: 0,
        meeting: 0,
        approaching: 0,
        beginning: 0,
        not_assessed: 0,
      };
      studentLevels.forEach((entry) => {
        masteryDistribution[entry.level] += 1;
      });

      return {
        goalId: goal.id,
        goalCode: goal.code,
        goalTitle: goal.title,
        goalCategory,
        plannedUnitCount,
        plannedLessonCount,
        linkedAssessmentCount,
        trackedStudentCount:
          classStudents.length - masteryDistribution.not_assessed,
        meetingOrAboveCount:
          masteryDistribution.exceeding + masteryDistribution.meeting,
        masteryDistribution,
        studentLevels,
      };
    });

  const standards = sortGoalsByCode(rows.filter((row) => row.goalCategory === "standard"));
  const atlAndAttributes = sortGoalsByCode(
    rows.filter((row) => row.goalCategory === "atl_skill" || row.goalCategory === "learner_profile"),
  );

  const sections: ClassMasterySection[] = [
    {
      id: "subject_standards",
      title: "Subject standards",
      description: "Standards tagged in planning, assessed in class work, and aggregated into class mastery.",
      rows: standards,
    },
    {
      id: "atl_and_attributes",
      title: "ATL & learner attributes",
      description:
        "Approaches to learning and learner profile traits surfaced through planning tags and released evidence.",
      rows: atlAndAttributes,
    },
  ];

  return sections.filter((section) => section.rows.length > 0);
}

export interface MasteryCategorySummary {
  category: GoalCategory;
  label: string;
  trackedGoals: number;
  strongestLevel: ResolvedMasteryLevel | null;
}

export interface AssessmentHighlight {
  reportId: string;
  assessmentId: string;
  assessmentTitle: string;
  className: string;
  status: AssessmentReport["status"];
  summary: string;
  strengths: string[];
  suggestions: string[];
  updatedAt: string;
}

export interface TeacherStudentReportReadiness {
  readyReports: number;
  publishedReports: number;
  distributedReports: number;
  assessmentSignals: number;
}

export interface TeacherStudentMasterySummary {
  categorySummaries: MasteryCategorySummary[];
  latestAssessmentHighlights: AssessmentHighlight[];
  reportReadiness: TeacherStudentReportReadiness;
}

interface BuildTeacherStudentMasterySummaryParams {
  studentId: string;
  classId?: string | null;
  grades: GradeRecord[];
  assessments: Assessment[];
  assessmentReports: AssessmentReport[];
  reports: Report[];
  learningGoals: LearningGoal[];
  classes: Class[];
}

function buildGoalProgressFromGrades(
  grades: GradeRecord[],
  assessments: Assessment[],
  learningGoals: LearningGoal[],
  classes: Class[],
) {
  const goalMap = new Map<
    string,
    {
      levels: Record<ResolvedMasteryLevel, number>;
      latestLevel: ResolvedMasteryLevel | null;
    }
  >();

  grades.forEach((grade) => {
    const assessment = assessments.find((entry) => entry.id === grade.assessmentId);
    if (!assessment) return;
    const className =
      classes.find((entry) => entry.id === grade.classId)?.name ?? assessment.classId;
    void className;
    grade.standardsMastery?.forEach((mastery) => {
      const current = goalMap.get(mastery.standardId) ?? {
        levels: {
          exceeding: 0,
          meeting: 0,
          approaching: 0,
          beginning: 0,
          not_assessed: 0,
        },
        latestLevel: null,
      };
      current.levels[mastery.level] += 1;
      current.latestLevel = pickBetterLevel(current.latestLevel, mastery.level);
      goalMap.set(mastery.standardId, current);
    });
  });

  return learningGoals
    .map((goal) => {
      const entry = goalMap.get(goal.id);
      return {
        goalId: goal.id,
        goalCode: goal.code,
        goalTitle: goal.title,
        goalCategory: normalizeGoalCategory(goal.category),
        tracked: Boolean(entry),
        latestLevel: entry?.latestLevel ?? null,
      };
    })
    .filter((goal) => goal.tracked);
}

export function buildTeacherStudentMasterySummary({
  studentId,
  classId,
  grades,
  assessments,
  assessmentReports,
  reports,
  learningGoals,
  classes,
}: BuildTeacherStudentMasterySummaryParams): TeacherStudentMasterySummary {
  const scopedGrades = grades.filter(
    (grade) =>
      grade.studentId === studentId &&
      (!classId || grade.classId === classId) &&
      grade.submissionStatus !== "excused",
  );
  const goalProgress = buildGoalProgressFromGrades(
    scopedGrades,
    assessments,
    learningGoals,
    classes,
  );

  const categorySummaries = GOAL_CATEGORY_ORDER.map((category) => {
    const goals = goalProgress.filter((goal) => goal.goalCategory === category);
    const strongestLevel = goals.reduce<ResolvedMasteryLevel | null>((current, goal) => {
      if (!goal.latestLevel) return current;
      return pickBetterLevel(current, goal.latestLevel);
    }, null);
    return {
      category,
      label:
        category === "standard"
          ? "Subject standards"
          : category === "atl_skill"
            ? "ATL skills"
            : "Learner attributes",
      trackedGoals: goals.length,
      strongestLevel,
    };
  }).filter((summary) => summary.trackedGoals > 0);

  const latestAssessmentHighlights = assessmentReports
    .filter(
      (report) =>
        report.studentId === studentId &&
        (!classId || report.classId === classId),
    )
    .map((report) => {
      const assessment = assessments.find((entry) => entry.id === report.assessmentId);
      return {
        reportId: report.id,
        assessmentId: report.assessmentId,
        assessmentTitle: assessment?.title ?? report.assessmentId,
        className: classes.find((entry) => entry.id === report.classId)?.name ?? report.classId,
        status: report.status,
        summary: report.summary,
        strengths: report.strengths.slice(0, 2),
        suggestions: report.suggestions.slice(0, 2),
        updatedAt: report.updatedAt,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  const scopedReports = reports.filter(
    (report) => report.studentId === studentId && (!classId || report.classId === classId),
  );

  return {
    categorySummaries,
    latestAssessmentHighlights,
    reportReadiness: {
      readyReports: scopedReports.filter((report) => report.publishState === "ready").length,
      publishedReports: scopedReports.filter((report) => report.publishState === "published").length,
      distributedReports: scopedReports.filter((report) => report.distributionStatus === "completed").length,
      assessmentSignals: latestAssessmentHighlights.length,
    },
  };
}

export interface StudentReleasedMasteryContext {
  categorySummaries: MasteryCategorySummary[];
  releasedAssessmentInsights: AssessmentHighlight[];
}

interface BuildStudentReleasedMasteryContextParams {
  goalProgress: StudentGoalProgress[];
  assessmentReports: AssessmentReport[];
  assessments: Assessment[];
  classes: Class[];
}

export function buildStudentReleasedMasteryContext({
  goalProgress,
  assessmentReports,
  assessments,
  classes,
}: BuildStudentReleasedMasteryContextParams): StudentReleasedMasteryContext {
  const categorySummaries = GOAL_CATEGORY_ORDER.map((category) => {
    const goals = goalProgress.filter(
      (goal) => goal.goalCategory === category && goal.assessmentCount > 0,
    );
    const strongestLevel = goals.reduce<ResolvedMasteryLevel | null>((current, goal) => {
      if (!goal.latestLevel) return current;
      return pickBetterLevel(current, goal.latestLevel);
    }, null);
    return {
      category,
      label:
        category === "standard"
          ? "Subject standards"
          : category === "atl_skill"
            ? "ATL skills"
            : "Learner attributes",
      trackedGoals: goals.length,
      strongestLevel,
    };
  }).filter((summary) => summary.trackedGoals > 0);

  const releasedAssessmentInsights = assessmentReports
    .filter((report) => report.status === "released" || Boolean(report.releasedAt))
    .map((report) => {
      const assessment = assessments.find((entry) => entry.id === report.assessmentId);
      return {
        reportId: report.id,
        assessmentId: report.assessmentId,
        assessmentTitle: assessment?.title ?? report.assessmentId,
        className: classes.find((entry) => entry.id === report.classId)?.name ?? report.classId,
        status: report.status,
        summary: report.summary,
        strengths: report.strengths.slice(0, 2),
        suggestions: report.suggestions.slice(0, 2),
        updatedAt: report.releasedAt ?? report.updatedAt,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  return {
    categorySummaries,
    releasedAssessmentInsights,
  };
}
