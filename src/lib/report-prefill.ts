import { getAssessmentIntentLabel, getAssessmentTypeLabel } from "@/lib/assessment-labels";
import { getGradeCellDisplay } from "@/lib/grade-helpers";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { AssessmentReport } from "@/types/assessment-report";
import type { GradeRecord } from "@/types/gradebook";
import type { Report } from "@/types/report";
import type { UnitPlan } from "@/types/unit-planning";

export interface ReportAssessmentSource {
  assessmentId: string;
  assessmentTitle: string;
  typeLabel: string;
  intentLabel: string;
  gradeLabel: string;
  unitTitle?: string;
  standards: {
    goalId: string;
    code: string;
    title: string;
    category: "standard" | "atl_skill" | "learner_profile";
    level?: string;
  }[];
}

export interface ReportSuggestionSource {
  reportId: string;
  assessmentId: string;
  assessmentTitle: string;
  status: AssessmentReport["status"];
  summary: string;
  strengths: string[];
  suggestions: string[];
  sourceLabels: string[];
}

export interface ReportPrefillContext {
  assessmentSources: ReportAssessmentSource[];
  coveredUnitTitles: string[];
  teacherAuthoredSections: string[];
  aiSuggestionSources: ReportSuggestionSource[];
}

interface BuildReportPrefillContextParams {
  report: Report;
  assessments: Assessment[];
  grades: GradeRecord[];
  learningGoals: LearningGoal[];
  unitPlans: UnitPlan[];
  assessmentReports: AssessmentReport[];
  releasedOnlyAssessmentSources?: boolean;
  releasedOnlySuggestions?: boolean;
}

function isTeacherAuthoredSection(section: Report["sections"][number]) {
  if (section.type === "teacher_comment" || section.type === "custom_text") {
    const text =
      (section.content?.comment as string | undefined) ??
      (section.content?.text as string | undefined) ??
      "";
    return text.trim().length > 0;
  }
  return false;
}

export function buildReportPrefillContext({
  report,
  assessments,
  grades,
  learningGoals,
  unitPlans,
  assessmentReports,
  releasedOnlyAssessmentSources = false,
  releasedOnlySuggestions = false,
}: BuildReportPrefillContextParams): ReportPrefillContext {
  const studentGrades = grades.filter(
    (grade) =>
      grade.studentId === report.studentId &&
      grade.classId === report.classId &&
      (!releasedOnlyAssessmentSources || Boolean(grade.releasedAt)),
  );

  const assessmentSources = studentGrades
    .map<ReportAssessmentSource | null>((grade) => {
      const assessment = assessments.find((entry) => entry.id === grade.assessmentId);
      if (!assessment) return null;
      const unit = assessment.unitId
        ? unitPlans.find((entry) => entry.id === assessment.unitId)
        : undefined;

      const standards = (grade.standardsMastery ?? [])
        .map((mastery) => {
          const goal = learningGoals.find((entry) => entry.id === mastery.standardId);
          if (!goal) return null;
          return {
            goalId: goal.id,
            code: goal.code,
            title: goal.title,
            category: (goal.category === "atl_skill" || goal.category === "learner_profile"
              ? goal.category
              : "standard") as "standard" | "atl_skill" | "learner_profile",
            level: mastery.level,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

      return {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        typeLabel: getAssessmentTypeLabel(assessment.assessmentType),
        intentLabel: getAssessmentIntentLabel(assessment.assessmentIntent) ?? "Unspecified intent",
        gradeLabel: getGradeCellDisplay(grade, assessment),
        unitTitle: unit?.title,
        standards,
      };
    })
    .filter((entry): entry is ReportAssessmentSource => entry !== null)
    .sort((a, b) => a.assessmentTitle.localeCompare(b.assessmentTitle));

  const aiSuggestionSources = assessmentReports
    .filter(
      (entry) =>
        entry.studentId === report.studentId &&
        entry.classId === report.classId &&
        (!releasedOnlySuggestions || entry.status === "released" || Boolean(entry.releasedAt)),
    )
    .map((entry) => {
      const assessment = assessments.find((candidate) => candidate.id === entry.assessmentId);
      return {
        reportId: entry.id,
        assessmentId: entry.assessmentId,
        assessmentTitle: assessment?.title ?? entry.assessmentId,
        status: entry.status,
        summary: entry.summary,
        strengths: entry.strengths.slice(0, 2),
        suggestions: entry.suggestions.slice(0, 2),
        sourceLabels: entry.sourceAttribution.map((source) => source.label).slice(0, 3),
      };
    })
    .sort((a, b) => a.assessmentTitle.localeCompare(b.assessmentTitle));

  return {
    assessmentSources,
    coveredUnitTitles: Array.from(
      new Set(
        assessmentSources
          .map((source) => source.unitTitle)
          .filter((title): title is string => Boolean(title)),
      ),
    ),
    teacherAuthoredSections: report.sections
      .filter((section) => isTeacherAuthoredSection(section))
      .map((section) => section.label),
    aiSuggestionSources,
  };
}
