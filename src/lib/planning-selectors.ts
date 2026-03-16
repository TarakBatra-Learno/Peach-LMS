import type { Assessment } from "@/types/assessment";
import type { Class } from "@/types/class";
import type { LessonPlan, UnitPlan } from "@/types/unit-planning";

export interface PlanningUnitCardSummary {
  unitId: string;
  classId: string;
  className: string;
  programme: string;
  title: string;
  status: UnitPlan["status"];
  startDate: string;
  endDate: string;
  durationWeeks: number | null;
  durationHours: number | null;
  lessonCount: number;
  assessmentCount: number;
  linkedStandardCount: number;
  collaboratorCount: number;
  inquiryQuestionCount: number;
  standardsCoverageSignal: "strong" | "partial" | "light";
}

export interface PlanningClassTimelineGroup {
  classId: string;
  className: string;
  programme: string;
  units: PlanningUnitCardSummary[];
}

export interface PlanningInsightSummary {
  id: "standards_skills" | "concepts_inquiry" | "timeline_pacing";
  title: string;
  description: string;
  populatedCount: number;
  gapCount: number;
}

export interface CurriculumMapRow {
  unitId: string;
  classId: string;
  className: string;
  programme: string;
  unitTitle: string;
  durationLabel: string;
  keySignals: string[];
}

function getClassName(classes: Class[], classId: string) {
  return classes.find((entry) => entry.id === classId)?.name ?? "Unknown class";
}

function getLinkedAssessments(assessments: Assessment[], unitId: string) {
  return assessments.filter((assessment) => assessment.unitId === unitId);
}

function getLinkedLessons(lessons: LessonPlan[], unitId: string) {
  return lessons.filter((lesson) => lesson.unitId === unitId);
}

function weeksBetween(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  return Math.max(1, Math.round(diff / (7 * 24 * 60 * 60 * 1000)));
}

function getDurationWeeks(unit: UnitPlan) {
  return unit.strategy.durationWeeks ?? weeksBetween(unit.startDate, unit.endDate);
}

function getDurationHours(unit: UnitPlan, lessons: LessonPlan[]) {
  if (unit.strategy.durationHours != null) return unit.strategy.durationHours;
  const totalMinutes = lessons.reduce(
    (sum, lesson) => sum + (lesson.estimatedDurationMinutes ?? 0),
    0
  );
  return totalMinutes > 0 ? Math.round(totalMinutes / 60) : null;
}

function getInquiryQuestionCount(unit: UnitPlan) {
  const inquiry = unit.strategy.inquiry;
  if (!inquiry) return 0;

  return (
    (inquiry.factualQuestions?.length ?? 0) +
    (inquiry.conceptualQuestions?.length ?? 0) +
    (inquiry.debatableQuestions?.length ?? 0)
  );
}

function getStandardsCoverageSignal(linkedStandardCount: number) {
  if (linkedStandardCount >= 4) return "strong" as const;
  if (linkedStandardCount >= 2) return "partial" as const;
  return "light" as const;
}

export function buildPlanningUnitCardSummaries(
  classes: Class[],
  units: UnitPlan[],
  lessons: LessonPlan[],
  assessments: Assessment[]
): PlanningUnitCardSummary[] {
  return units
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.order - b.order)
    .map((unit) => {
      const linkedLessons = getLinkedLessons(lessons, unit.id);
      const linkedAssessments = getLinkedAssessments(assessments, unit.id);
      const linkedStandardCount = new Set([
        ...unit.strategy.linkedStandardIds,
        ...(unit.strategy.evidence?.standardsFocusIds ?? []),
      ]).size;

      return {
        unitId: unit.id,
        classId: unit.classId,
        className: getClassName(classes, unit.classId),
        programme: unit.programme,
        title: unit.title,
        status: unit.status,
        startDate: unit.startDate,
        endDate: unit.endDate,
        durationWeeks: getDurationWeeks(unit),
        durationHours: getDurationHours(unit, linkedLessons),
        lessonCount: linkedLessons.length,
        assessmentCount: linkedAssessments.length,
        linkedStandardCount,
        collaboratorCount: unit.collaborators?.length ?? 0,
        inquiryQuestionCount: getInquiryQuestionCount(unit),
        standardsCoverageSignal: getStandardsCoverageSignal(linkedStandardCount),
      };
    });
}

export function groupPlanningTimelineByClass(
  classes: Class[],
  units: UnitPlan[],
  lessons: LessonPlan[],
  assessments: Assessment[]
): PlanningClassTimelineGroup[] {
  const unitSummaries = buildPlanningUnitCardSummaries(classes, units, lessons, assessments);
  const grouped = new Map<string, PlanningClassTimelineGroup>();

  for (const summary of unitSummaries) {
    const existing = grouped.get(summary.classId);
    if (existing) {
      existing.units.push(summary);
      continue;
    }

    grouped.set(summary.classId, {
      classId: summary.classId,
      className: summary.className,
      programme: summary.programme,
      units: [summary],
    });
  }

  return [...grouped.values()].sort((a, b) => a.className.localeCompare(b.className));
}

export function buildPlanningInsightSummaries(
  units: UnitPlan[],
  lessons: LessonPlan[],
  assessments: Assessment[]
): PlanningInsightSummary[] {
  const standardsPopulated = units.filter(
    (unit) =>
      unit.strategy.linkedStandardIds.length > 0 ||
      (unit.strategy.evidence?.standardsFocusIds?.length ?? 0) > 0
  ).length;
  const inquiryPopulated = units.filter(
    (unit) =>
      getInquiryQuestionCount(unit) > 0 ||
      Boolean(unit.strategy.conceptualFraming?.statementOfInquiry)
  ).length;
  const timelinePopulated = units.filter(
    (unit) =>
      getDurationWeeks(unit) != null ||
      getDurationHours(unit, getLinkedLessons(lessons, unit.id)) != null ||
      getLinkedAssessments(assessments, unit.id).length > 0
  ).length;

  return [
    {
      id: "standards_skills",
      title: "Standards & skills coverage",
      description: "Read-only coverage view across linked standards, ATL skills, and evidence signals.",
      populatedCount: standardsPopulated,
      gapCount: units.length - standardsPopulated,
    },
    {
      id: "concepts_inquiry",
      title: "Concepts & inquiry coverage",
      description: "Read-only projection over inquiry statements, key concepts, and inquiry-question structure.",
      populatedCount: inquiryPopulated,
      gapCount: units.length - inquiryPopulated,
    },
    {
      id: "timeline_pacing",
      title: "Timeline & pacing",
      description: "Read-only view of pacing, sequencing, and linked lesson/assessment density.",
      populatedCount: timelinePopulated,
      gapCount: units.length - timelinePopulated,
    },
  ];
}

export function buildCurriculumMapRows(
  classes: Class[],
  units: UnitPlan[],
  lessons: LessonPlan[],
  assessments: Assessment[]
): CurriculumMapRow[] {
  return buildPlanningUnitCardSummaries(classes, units, lessons, assessments).map((summary) => {
    const keySignals = [
      summary.lessonCount > 0 ? `${summary.lessonCount} lessons` : "Lessons not linked",
      summary.assessmentCount > 0 ? `${summary.assessmentCount} linked assessments` : "Assessments not linked",
      summary.inquiryQuestionCount > 0
        ? `${summary.inquiryQuestionCount} inquiry prompts`
        : "Inquiry prompts not added",
    ];

    return {
      unitId: summary.unitId,
      classId: summary.classId,
      className: summary.className,
      programme: summary.programme,
      unitTitle: summary.title,
      durationLabel:
        summary.durationWeeks != null
          ? `${summary.durationWeeks} wk${summary.durationWeeks === 1 ? "" : "s"}`
          : summary.durationHours != null
            ? `${summary.durationHours} hr${summary.durationHours === 1 ? "" : "s"}`
            : "Duration not set",
      keySignals,
    };
  });
}
