"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getStudentTimetable,
  getStudentAssessments,
  getStudentClasses,
  type EnrichedTimetableSlot,
} from "@/lib/student-selectors";
import { TimetableSlotSheet } from "@/components/student/timetable-slot-sheet";
import { deriveTimeRows, type TimeRow } from "@/lib/timetable-utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  BookOpen,
  ClipboardCheck,
  Coffee,
  UtensilsCrossed,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";

interface StudentTimetableViewProps {
  studentId: string;
}

// Color palette for class cards
const CLASS_COLORS = [
  { bg: "bg-[#dbeafe]", border: "border-[#2563eb]/30", text: "text-[#2563eb]" },
  { bg: "bg-[#fff2f0]", border: "border-[#c24e3f]/30", text: "text-[#c24e3f]" },
  { bg: "bg-[#dcfce7]", border: "border-[#16a34a]/30", text: "text-[#16a34a]" },
  { bg: "bg-[#fef3c7]", border: "border-[#b45309]/30", text: "text-[#b45309]" },
  { bg: "bg-[#f3e8ff]", border: "border-[#7c3aed]/30", text: "text-[#7c3aed]" },
  { bg: "bg-[#fce7f3]", border: "border-[#db2777]/30", text: "text-[#db2777]" },
];

export function StudentTimetableView({ studentId }: StudentTimetableViewProps) {
  const state = useStore((s) => s);
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedSlot, setSelectedSlot] = useState<EnrichedTimetableSlot | null>(null);

  // Get enrolled classes for schedule derivation
  const enrolledClasses = useMemo(
    () => getStudentClasses(state, studentId),
    [state, studentId]
  );

  // Assessments for deadline indicators
  const assessments = useMemo(
    () => getStudentAssessments(state, studentId),
    [state, studentId]
  );

  // Compute assessments due per day per class
  const assessmentsByDayClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assessments) {
      const dueDate = a.dueDate.split("T")[0];
      const key = `${dueDate}:${a.classId}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [assessments]);

  const baseDate = useMemo(() => {
    const now = new Date();
    return addDays(startOfWeek(now, { weekStartsOn: 1 }), weekOffset * 7);
  }, [weekOffset]);

  const weekStart = format(baseDate, "yyyy-MM-dd");
  const weekEndDate = endOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = format(weekEndDate, "yyyy-MM-dd");

  const allSlots = useMemo(
    () => getStudentTimetable(state, studentId, weekStart, weekEnd),
    [state, studentId, weekStart, weekEnd]
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const day = addDays(baseDate, i);
      return {
        date: format(day, "yyyy-MM-dd"),
        dayObj: day,
        label: format(day, "EEE"),
        fullLabel: format(day, "EEEE, MMM d"),
        isToday: isToday(day),
      };
    });
  }, [baseDate]);

  // For day view
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const dayViewDate = weekDays[selectedDayIdx] ?? weekDays[0];

  // Derive structured time rows from all enrolled class schedules
  const timeRows = useMemo(
    () => deriveTimeRows(enrolledClasses),
    [enrolledClasses]
  );

  // Build a lookup: date + startTime → slot
  const slotLookup = useMemo(() => {
    const map = new Map<string, EnrichedTimetableSlot>();
    for (const slot of allSlots) {
      const key = `${slot.date}:${slot.slotStartTime}`;
      map.set(key, slot);
    }
    return map;
  }, [allSlots]);

  // Color map by class name (stable across weeks)
  const classColorMap = useMemo(() => {
    const map = new Map<string, (typeof CLASS_COLORS)[number]>();
    const classNames = enrolledClasses.map((c) => c.name);
    classNames.forEach((name, i) => {
      map.set(name, CLASS_COLORS[i % CLASS_COLORS.length]);
    });
    return map;
  }, [enrolledClasses]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => setWeekOffset((o) => o + 1)}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          {weekOffset !== 0 && (
            <button
              className="text-[12px] text-[#c24e3f] hover:underline ml-2"
              onClick={() => setWeekOffset(0)}
            >
              This week
            </button>
          )}
        </div>

        <div className="text-center">
          <p className="text-[14px] font-medium">
            {format(baseDate, "MMM d")} – {format(weekEndDate, "MMM d, yyyy")}
          </p>
        </div>

        <div className="flex gap-1">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
        </div>
      </div>

      {timeRows.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No schedule configured"
          description="Your class schedule hasn't been set up yet."
        />
      ) : viewMode === "week" ? (
        /* ─── Week View: Structured Grid ─── */
        <div className="border rounded-lg overflow-hidden">
          {/* Header row: day labels */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] bg-muted/30">
            <div className="p-2 border-r border-b" />
            {weekDays.map((day) => (
              <div
                key={day.date}
                className={`text-center p-2 border-b ${
                  day.isToday ? "bg-[#fff2f0]" : ""
                }`}
              >
                <p
                  className={`text-[12px] font-medium ${
                    day.isToday ? "text-[#c24e3f]" : "text-muted-foreground"
                  }`}
                >
                  {day.label}
                </p>
                <p
                  className={`text-[14px] font-semibold ${
                    day.isToday ? "text-[#c24e3f]" : ""
                  }`}
                >
                  {format(day.dayObj, "d")}
                </p>
              </div>
            ))}
          </div>

          {/* Time rows */}
          {timeRows.map((row, rowIdx) => (
            <div
              key={`${row.startTime}-${row.endTime}`}
              className={`grid grid-cols-[80px_repeat(5,1fr)] ${
                rowIdx < timeRows.length - 1 ? "border-b" : ""
              } ${row.type !== "class" ? "bg-muted/20" : ""}`}
            >
              {/* Time label column */}
              <div className="p-2 border-r flex flex-col justify-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {row.startTime}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {row.endTime}
                </p>
                {row.type !== "class" && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    {row.type === "lunch" ? (
                      <UtensilsCrossed className="h-2.5 w-2.5" />
                    ) : (
                      <Coffee className="h-2.5 w-2.5" />
                    )}
                    {row.label}
                  </p>
                )}
              </div>

              {/* Day cells */}
              {weekDays.map((day) => {
                if (row.type !== "class") {
                  // Break/lunch row — empty gray cell
                  return (
                    <div
                      key={day.date}
                      className={`p-1.5 ${day.isToday ? "bg-[#fff2f0]/30" : ""}`}
                    >
                      <div className="h-full min-h-[40px] rounded-md bg-muted/30 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/50">
                          {row.label}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Class row — find if student has a class at this time on this day
                const slot = slotLookup.get(`${day.date}:${row.startTime}`);

                if (!slot) {
                  // Free period
                  return (
                    <div
                      key={day.date}
                      className={`p-1.5 ${day.isToday ? "bg-[#fff2f0]/30" : ""}`}
                    >
                      <div className="h-full min-h-[56px] rounded-md bg-muted/20 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/40">Free</span>
                      </div>
                    </div>
                  );
                }

                // Class card
                const colors = classColorMap.get(slot.className) ?? CLASS_COLORS[0];
                const dueCount = assessmentsByDayClass.get(`${slot.date}:${slot.classId}`) ?? 0;

                return (
                  <div
                    key={day.date}
                    className={`p-1.5 ${day.isToday ? "bg-[#fff2f0]/30" : ""}`}
                  >
                    <button
                      type="button"
                      className={`w-full h-full min-h-[56px] rounded-md border p-2 text-left cursor-pointer hover:shadow-sm transition-shadow ${colors.bg} ${colors.border} ${colors.text}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <p className="text-[11px] font-semibold truncate">
                        {slot.className}
                      </p>
                      {slot.room && (
                        <p className="text-[9px] opacity-70 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="h-2 w-2" />
                          {slot.room}
                        </p>
                      )}
                      {slot.lesson && (
                        <p className="text-[9px] opacity-60 mt-0.5 truncate">
                          {slot.lesson.title}
                        </p>
                      )}
                      {dueCount > 0 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <ClipboardCheck className="h-2 w-2" />
                          <span className="text-[8px] font-medium">
                            {dueCount} due
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        /* ─── Day View: Structured List ─── */
        <div>
          {/* Day picker */}
          <div className="flex gap-2 mb-4">
            {weekDays.map((day, i) => (
              <Button
                key={day.date}
                variant={selectedDayIdx === i ? "default" : "outline"}
                size="sm"
                className={`h-8 text-[12px] ${day.isToday && selectedDayIdx !== i ? "border-[#c24e3f]/50" : ""}`}
                onClick={() => setSelectedDayIdx(i)}
              >
                {day.label} {format(day.dayObj, "d")}
                {day.isToday && (
                  <Badge className="ml-1 bg-[#c24e3f] text-white text-[9px] px-1 py-0">
                    Today
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {dayViewDate && (
            <>
              <h3 className="text-[14px] font-semibold mb-3">
                {dayViewDate.fullLabel}
              </h3>

              <div className="space-y-0">
                {timeRows.map((row) => {
                  if (row.type !== "class") {
                    // Break/lunch row
                    return (
                      <div
                        key={`${row.startTime}-${row.endTime}`}
                        className="flex items-center gap-3 py-2 px-3 bg-muted/20 border-y border-dashed"
                      >
                        <div className="w-[60px] text-[11px] text-muted-foreground font-medium">
                          {row.startTime}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                          {row.type === "lunch" ? (
                            <UtensilsCrossed className="h-3 w-3" />
                          ) : (
                            <Coffee className="h-3 w-3" />
                          )}
                          {row.label}
                        </div>
                      </div>
                    );
                  }

                  const slot = slotLookup.get(`${dayViewDate.date}:${row.startTime}`);

                  if (!slot) {
                    // Free period
                    return (
                      <div
                        key={`${row.startTime}-${row.endTime}`}
                        className="flex items-center gap-3 py-3 px-3 border-b"
                      >
                        <div className="w-[60px]">
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {row.startTime}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70">
                            {row.endTime}
                          </p>
                        </div>
                        <div className="flex-1 rounded-md bg-muted/20 py-4 flex items-center justify-center">
                          <span className="text-[12px] text-muted-foreground/50">
                            Free period
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Class slot
                  const colors = classColorMap.get(slot.className) ?? CLASS_COLORS[0];
                  const dueCount = assessmentsByDayClass.get(`${slot.date}:${slot.classId}`) ?? 0;

                  return (
                    <div
                      key={`${row.startTime}-${row.endTime}`}
                      className="flex items-stretch gap-3 py-2 px-3 border-b"
                    >
                      <div className="w-[60px] pt-1">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {row.startTime}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {row.endTime}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`flex-1 rounded-lg border p-3 text-left cursor-pointer hover:shadow-sm transition-shadow ${colors.bg} ${colors.border} ${colors.text}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[14px] font-semibold">
                              {slot.className}
                            </p>
                            <div className="flex items-center gap-3 text-[12px] opacity-80 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {slot.slotStartTime} – {slot.slotEndTime}
                              </span>
                              {slot.room && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {slot.room}
                                </span>
                              )}
                            </div>
                          </div>
                          {slot.unitTitle && (
                            <Badge variant="secondary" className="text-[10px] bg-white/50">
                              {slot.unitTitle}
                            </Badge>
                          )}
                        </div>

                        {slot.lesson && (
                          <div className="mt-2 pt-2 border-t border-current/10">
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 opacity-70" />
                              <p className="text-[13px] font-medium">
                                {slot.lesson.title}
                              </p>
                            </div>
                            {slot.lesson.objectives &&
                              slot.lesson.objectives.length > 0 && (
                                <ul className="mt-1.5 space-y-0.5 ml-5">
                                  {slot.lesson.objectives
                                    .slice(0, 3)
                                    .map((obj, j) => (
                                      <li
                                        key={j}
                                        className="text-[12px] opacity-70"
                                      >
                                        • {obj}
                                      </li>
                                    ))}
                                </ul>
                              )}
                          </div>
                        )}
                        {dueCount > 0 && (
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-current/10">
                            <ClipboardCheck className="h-3 w-3 opacity-70" />
                            <span className="text-[11px] font-medium opacity-80">
                              {dueCount} assessment{dueCount !== 1 ? "s" : ""} due today
                            </span>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <TimetableSlotSheet
        slot={selectedSlot}
        open={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        studentId={studentId}
      />
    </div>
  );
}
