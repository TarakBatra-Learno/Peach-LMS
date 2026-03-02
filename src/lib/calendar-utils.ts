import { CalendarEvent } from "@/types/calendar";
import { PERIODS } from "@/lib/timetable-constants";
import {
  parseISO,
  format,
  addDays,
  getDay,
  differenceInCalendarDays,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExpandedCalendarEvent extends CalendarEvent {
  /** "yyyy-MM-dd" for this specific occurrence */
  materializedDate: string;
  /** true when this is a generated recurrence copy, not the original seed */
  isRecurrenceInstance: boolean;
}

// ---------------------------------------------------------------------------
// Core expansion
// ---------------------------------------------------------------------------

/**
 * Expand weekly-recurring events across a date range.
 * Non-recurring events pass through as-is if they fall within the range.
 */
export function expandEventsForRange(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): ExpandedCalendarEvent[] {
  const result: ExpandedCalendarEvent[] = [];

  for (const event of events) {
    if (event.recurrence === "weekly") {
      // Original event date info
      const originalStart = parseISO(event.startTime);
      const originalEnd = parseISO(event.endTime);
      const originalDow = getDay(originalStart); // 0=Sun … 6=Sat
      const durationMs = originalEnd.getTime() - originalStart.getTime();

      // Time components (keep same HH:mm:ss)
      const startH = originalStart.getHours();
      const startM = originalStart.getMinutes();
      const startS = originalStart.getSeconds();

      // Walk from rangeStart to rangeEnd, day by day
      let cursor = startOfDay(rangeStart);
      const end = startOfDay(rangeEnd);

      while (!isAfter(cursor, end)) {
        if (getDay(cursor) === originalDow) {
          const instanceStart = new Date(
            cursor.getFullYear(),
            cursor.getMonth(),
            cursor.getDate(),
            startH,
            startM,
            startS
          );
          const instanceEnd = new Date(instanceStart.getTime() + durationMs);
          const materializedDate = format(cursor, "yyyy-MM-dd");

          result.push({
            ...event,
            startTime: instanceStart.toISOString(),
            endTime: instanceEnd.toISOString(),
            materializedDate,
            isRecurrenceInstance: !isSameCalendarDay(cursor, originalStart),
          });
        }
        cursor = addDays(cursor, 1);
      }
    } else {
      // Non-recurring: include if within range
      const eventDate = parseISO(event.startTime);
      if (
        !isBefore(eventDate, startOfDay(rangeStart)) &&
        !isAfter(startOfDay(eventDate), startOfDay(rangeEnd))
      ) {
        result.push({
          ...event,
          materializedDate: format(eventDate, "yyyy-MM-dd"),
          isRecurrenceInstance: false,
        });
      }
    }
  }

  return result;
}

/**
 * Convenience: expand events for a single date.
 */
export function expandEventsForDate(
  events: CalendarEvent[],
  date: Date
): ExpandedCalendarEvent[] {
  return expandEventsForRange(events, date, date);
}

// ---------------------------------------------------------------------------
// Period matching
// ---------------------------------------------------------------------------

/**
 * Match an "HH:mm" time string to a PERIODS entry label.
 * Returns the period label if the time falls within [start, end), or null.
 */
export function matchEventToPeriod(
  eventTimeHHMM: string,
  periods: typeof PERIODS = PERIODS
): string | null {
  for (const p of periods) {
    if (p.isBreak) continue;
    if (eventTimeHHMM >= p.start && eventTimeHHMM < p.end) {
      return p.label;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Period status (for dashboard live indicator)
// ---------------------------------------------------------------------------

export type PeriodStatus = "past" | "current" | "upcoming";

/**
 * Determine whether a period is past, current, or upcoming
 * based on the current time (all in "HH:mm" format).
 */
export function getPeriodStatus(
  periodStart: string,
  periodEnd: string,
  currentTime: string
): PeriodStatus {
  if (currentTime >= periodEnd) return "past";
  if (currentTime >= periodStart && currentTime < periodEnd) return "current";
  return "upcoming";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
