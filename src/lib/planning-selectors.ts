import { getDemoNow } from "@/lib/demo-time";
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

export interface PlanningTimelinePeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface PlanningInsightSummary {
  id: "standards_skills" | "concepts_inquiry" | "timeline_pacing";
  title: string;
  description: string;
  populatedCount: number;
  gapCount: number;
}

export interface PlanningInsightTable {
  title: string;
  subtitle: string;
  columns: string[];
  rows: Array<{
    id: string;
    cells: string[];
  }>;
}

export interface CurriculumMapRow {
  unitId: string;
  classId: string;
  className: string;
  programme: string;
  unitTitle: string;
  durationLabel: string;
  approachesToLearning: string[];
  learnerProfileAttributes: string[];
  relatedConcepts: string[];
  objectives: string[];
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

function formatDurationLabel(summary: PlanningUnitCardSummary) {
  if (summary.durationWeeks != null) {
    return `${summary.durationWeeks} wk${summary.durationWeeks === 1 ? "" : "s"}`;
  }

  if (summary.durationHours != null) {
    return `${summary.durationHours} hr${summary.durationHours === 1 ? "" : "s"}`;
  }

  return "Duration not set";
}

function getObjectiveLabels(unit: UnitPlan) {
  return unit.strategy.learningFocus?.objectiveLabels ?? [];
}

function getAtlSignals(unit: UnitPlan) {
  return [
    ...(unit.strategy.conceptualFraming?.atlFocus ?? []),
    ...((unit.strategy.learningFocus?.atlSkillIds ?? []).map((id) =>
      id.replaceAll("_", " ")
    )),
  ];
}

function getLearnerProfileSignals(unit: UnitPlan) {
  return (unit.strategy.learningFocus?.learnerProfileIds ?? []).map((id) =>
    id.replaceAll("_", " ")
  );
}

function getRelatedConcepts(unit: UnitPlan) {
  return unit.strategy.conceptualFraming?.relatedConcepts ?? [];
}

function getTimelineSequencingSignal(summary: PlanningUnitCardSummary) {
  if (summary.assessmentCount >= 3 && summary.lessonCount >= 4) {
    return "Assessment-rich sequence";
  }
  if (summary.assessmentCount === 0) {
    return "Assessment load pending";
  }
  if (summary.lessonCount <= 1) {
    return "Lesson sequence needs depth";
  }
  return "Balanced sequence";
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function endOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0);
}

export function buildPlanningTimelinePeriods(referenceDate = getDemoNow()): PlanningTimelinePeriod[] {
  const startYear = referenceDate.getMonth() >= 6 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
  const periodStarts = [6, 8, 10, 0, 2, 4];

  return periodStarts.map((monthIndex) => {
    const year = monthIndex >= 6 ? startYear : startYear + 1;
    const start = new Date(year, monthIndex, 1);
    const end = endOfMonth(year, monthIndex + 1);
    const label = `${start.toLocaleString("en-US", { month: "short" })} - ${end.toLocaleString("en-US", { month: "short" })} ${String(year).slice(2)}`;

    return {
      id: `${year}-${monthIndex}`,
      label,
      startDate: toIsoDate(start),
      endDate: toIsoDate(end),
    };
  });
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
      description: "Read-only projection over inquiry statements, concepts, and question structure.",
      populatedCount: inquiryPopulated,
      gapCount: units.length - inquiryPopulated,
    },
    {
      id: "timeline_pacing",
      title: "Timeline & pacing",
      description: "Read-only view of pacing, sequencing, and lesson/assessment density.",
      populatedCount: timelinePopulated,
      gapCount: units.length - timelinePopulated,
    },
  ];
}

export function buildPlanningInsightTable(
  insightId: PlanningInsightSummary["id"],
  classes: Class[],
  units: UnitPlan[],
  lessons: LessonPlan[],
  assessments: Assessment[]
): PlanningInsightTable {
  const summaries = buildPlanningUnitCardSummaries(classes, units, lessons, assessments);
  const unitLookup = new Map(units.map((unit) => [unit.id, unit]));

  if (insightId === "concepts_inquiry") {
    return {
      title: "Concepts & inquiry coverage",
      subtitle: "Check whether units have enough inquiry framing and conceptual anchors to support a strong IB planning story.",
      columns: ["Class", "Unit", "Statement of inquiry", "Key concept", "Inquiry prompts", "Global context"],
      rows: summaries.map((summary) => {
        const unit = unitLookup.get(summary.unitId)!;
        return {
          id: summary.unitId,
          cells: [
            summary.className,
            summary.title,
            unit.strategy.conceptualFraming?.statementOfInquiry ?? unit.strategy.inquiry?.statement ?? "Needs inquiry statement",
            unit.strategy.conceptualFraming?.keyConcept ?? "Not tagged",
            `${summary.inquiryQuestionCount} prompts`,
            unit.strategy.conceptualFraming?.globalContext ?? "Not tagged",
          ],
        };
      }),
    };
  }

  if (insightId === "timeline_pacing") {
    return {
      title: "Timeline & pacing",
      subtitle: "Read-only pacing view across duration, lesson density, and assessment pressure.",
      columns: ["Class", "Unit", "Time window", "Lesson density", "Assessment load", "Sequencing"],
      rows: summaries.map((summary) => {
        return {
          id: summary.unitId,
          cells: [
            summary.className,
            summary.title,
            `${summary.startDate} -> ${summary.endDate}`,
            `${summary.lessonCount} lesson${summary.lessonCount === 1 ? "" : "s"}`,
            `${summary.assessmentCount} assessment${summary.assessmentCount === 1 ? "" : "s"}`,
            getTimelineSequencingSignal(summary),
          ],
        };
      }),
    };
  }

  return {
    title: "Standards & skills coverage",
    subtitle: "Read-only coverage view across standards, ATL signals, and evidence-linked skills for each unit.",
    columns: ["Class", "Unit", "Standards tagged", "ATL focus", "Evidence focus", "Coverage status"],
    rows: summaries.map((summary) => {
      const unit = unitLookup.get(summary.unitId)!;
      const atlSignals = getAtlSignals(unit);
      const evidenceSignals = unit.strategy.evidence?.standardsFocusIds ?? [];
      return {
        id: summary.unitId,
        cells: [
          summary.className,
          summary.title,
          `${summary.linkedStandardCount} tagged`,
          atlSignals.length > 0 ? atlSignals.slice(0, 2).join(", ") : "Needs ATL focus",
          evidenceSignals.length > 0 ? `${evidenceSignals.length} evidence links` : "Evidence focus pending",
          summary.standardsCoverageSignal,
        ],
      };
    }),
  };
}

export function buildCurriculumMapRows(
  classes: Class[],
  units: UnitPlan[],
  lessons: LessonPlan[],
  assessments: Assessment[]
): CurriculumMapRow[] {
  const summaries = buildPlanningUnitCardSummaries(classes, units, lessons, assessments);
  const unitLookup = new Map(units.map((unit) => [unit.id, unit]));

  return summaries.map((summary) => {
    const unit = unitLookup.get(summary.unitId)!;
    return {
      unitId: summary.unitId,
      classId: summary.classId,
      className: summary.className,
      programme: summary.programme,
      unitTitle: summary.title,
      durationLabel: formatDurationLabel(summary),
      approachesToLearning: getAtlSignals(unit),
      learnerProfileAttributes: getLearnerProfileSignals(unit),
      relatedConcepts: getRelatedConcepts(unit),
      objectives: getObjectiveLabels(unit),
    };
  });
}
