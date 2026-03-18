import { TimetableSlot } from "@/types/class";
import { Assessment } from "@/types/assessment";
import { LessonPlan, MaterializedOccurrence } from "@/types/unit-planning";
import { addDays, format, getDay, parseISO, isAfter } from "date-fns";

const NUM_TO_DAY: Record<number, "mon" | "tue" | "wed" | "thu" | "fri"> = {
  1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri",
};

/**
 * Materializes all timetable slot occurrences within a date range.
 * Generates concrete (date, slot) pairs from the weekly recurring pattern.
 */
export function materializeTimetableOccurrences(
  schedule: TimetableSlot[],
  startDate: string,
  endDate: string
): MaterializedOccurrence[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const occurrences: MaterializedOccurrence[] = [];

  let cursor = start;
  while (!isAfter(cursor, end)) {
    const dayOfWeek = getDay(cursor);
    const dayKey = NUM_TO_DAY[dayOfWeek];

    if (dayKey) {
      const daySlots = schedule.filter((s) => s.day === dayKey);
      for (const slot of daySlots) {
        occurrences.push({
          date: format(cursor, "yyyy-MM-dd"),
          slotDay: dayKey,
          slotStartTime: slot.startTime,
          slotEndTime: slot.endTime,
          room: slot.room,
        });
      }
    }
    cursor = addDays(cursor, 1);
  }

  return occurrences.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.slotStartTime.localeCompare(b.slotStartTime);
  });
}

/**
 * Computes unit progress from lesson plans.
 */
export function getUnitProgress(lessonPlans: LessonPlan[]) {
  return {
    total: lessonPlans.length,
    draft: lessonPlans.filter((lp) => lp.status === "draft").length,
    ready: lessonPlans.filter((lp) => lp.status === "ready").length,
    assigned: lessonPlans.filter((lp) => lp.status === "assigned").length,
    taught: lessonPlans.filter((lp) => lp.status === "taught").length,
    skipped: lessonPlans.filter((lp) => lp.status === "skipped").length,
    cancelled: lessonPlans.filter((lp) => lp.status === "cancelled").length,
  };
}

/**
 * Gets lesson plans that are ready for assignment (not yet assigned to a slot).
 */
export function getUnassignedLessonPlans(lessonPlans: LessonPlan[]): LessonPlan[] {
  return lessonPlans
    .filter((lp) => lp.status === "ready")
    .sort((a, b) => a.sequence - b.sequence);
}

/**
 * Derives linked assessments from Assessment.unitId (single source of truth).
 */
export function getUnitAssessments(assessments: Assessment[], unitId: string): Assessment[] {
  return assessments.filter((a) => a.unitId === unitId);
}

/**
 * Computes a preview of auto-fill assignments without committing.
 * Maps ready lesson plans (by sequence) to available occurrences (chronologically).
 */
export function computeAutoFillPlan(
  readyLessonPlans: LessonPlan[],
  availableOccurrences: MaterializedOccurrence[]
): { lessonPlanId: string; date: string; slotDay: string; slotStartTime: string }[] {
  const sorted = [...readyLessonPlans].sort((a, b) => a.sequence - b.sequence);
  const count = Math.min(sorted.length, availableOccurrences.length);
  const pairings = [];
  for (let i = 0; i < count; i++) {
    pairings.push({
      lessonPlanId: sorted[i].id,
      date: availableOccurrences[i].date,
      slotDay: availableOccurrences[i].slotDay,
      slotStartTime: availableOccurrences[i].slotStartTime,
    });
  }
  return pairings;
}

/**
 * Formats a lesson plan status for display.
 */
export function getLessonStatusLabel(status: LessonPlan["status"]): string {
  const labels: Record<LessonPlan["status"], string> = {
    draft: "Draft",
    ready: "Ready",
    assigned: "Assigned",
    taught: "Taught",
    skipped: "Skipped",
    cancelled: "Cancelled",
  };
  return labels[status];
}

/**
 * Formats a unit status for display.
 */
export function getUnitStatusLabel(status: "draft" | "active" | "completed" | "archived"): string {
  const labels = { draft: "Draft", active: "Active", completed: "Completed", archived: "Archived" };
  return labels[status];
}

/**
 * Gets the status variant for StatusBadge styling.
 */
export function getUnitStatusVariant(status: "draft" | "active" | "completed" | "archived"): string {
  const variants = { draft: "secondary", active: "default", completed: "outline", archived: "secondary" };
  return variants[status];
}

export function getLessonStatusVariant(status: LessonPlan["status"]): string {
  const variants: Record<LessonPlan["status"], string> = {
    draft: "secondary",
    ready: "default",
    assigned: "default",
    taught: "outline",
    skipped: "secondary",
    cancelled: "destructive",
  };
  return variants[status];
}

export function getLessonSummaryMetadata(lesson: LessonPlan) {
  return {
    objectiveCount: lesson.objectives?.length ?? 0,
    activityCount: lesson.activities.length,
    standardCount: lesson.linkedStandardIds.length,
    statusLabel: getLessonStatusLabel(lesson.status),
    assignmentState: lesson.status === "assigned" ? "Scheduled" : undefined,
  };
}
