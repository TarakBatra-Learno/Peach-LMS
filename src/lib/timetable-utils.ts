/** Represents one row in a timetable grid */
export interface TimeRow {
  startTime: string;
  endTime: string;
  label: string;
  type: "class" | "break" | "lunch";
}

/** Convert "HH:MM" to minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Derive all time rows for a school day from class schedules.
 * Sorts by start time and fills gaps with break/lunch rows.
 */
export function deriveTimeRows(
  classes: { schedule: { startTime: string; endTime: string }[] }[]
): TimeRow[] {
  const slotMap = new Map<string, { startTime: string; endTime: string }>();
  for (const cls of classes) {
    for (const slot of cls.schedule) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, { startTime: slot.startTime, endTime: slot.endTime });
      }
    }
  }

  const uniqueSlots = [...slotMap.values()].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  if (uniqueSlots.length === 0) return [];

  const rows: TimeRow[] = [];
  let periodNum = 1;

  for (let i = 0; i < uniqueSlots.length; i++) {
    const slot = uniqueSlots[i];

    if (i > 0) {
      const prevEnd = uniqueSlots[i - 1].endTime;
      if (prevEnd < slot.startTime) {
        const gapMinutes = timeToMinutes(slot.startTime) - timeToMinutes(prevEnd);
        const isLunch = gapMinutes >= 30 && timeToMinutes(prevEnd) >= timeToMinutes("11:00");
        rows.push({
          startTime: prevEnd,
          endTime: slot.startTime,
          label: isLunch ? "Lunch" : "Break",
          type: isLunch ? "lunch" : "break",
        });
      }
    }

    rows.push({
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: `Period ${periodNum}`,
      type: "class",
    });
    periodNum++;
  }

  return rows;
}
