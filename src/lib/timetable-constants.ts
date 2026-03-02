export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export const DAY_ABBREV_TO_FULL: Record<string, (typeof DAYS)[number]> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
};

export const PERIODS = [
  { label: "Homeroom", start: "08:00", end: "08:30", isBreak: false },
  { label: "Period 1", start: "08:30", end: "09:20", isBreak: false },
  { label: "Period 2", start: "09:20", end: "10:10", isBreak: false },
  { label: "Break", start: "10:10", end: "10:30", isBreak: true },
  { label: "Period 3", start: "10:15", end: "11:45", isBreak: false },
  { label: "Period 4", start: "11:50", end: "12:40", isBreak: false },
  { label: "Lunch", start: "12:40", end: "13:30", isBreak: true },
  { label: "Period 5", start: "13:30", end: "14:20", isBreak: false },
  { label: "Period 6", start: "14:25", end: "15:15", isBreak: false },
] as const;

export type Period = (typeof PERIODS)[number];
