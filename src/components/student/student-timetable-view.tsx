"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getStudentTimetable,
  type EnrichedTimetableSlot,
} from "@/lib/student-selectors";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  BookOpen,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameDay,
} from "date-fns";

interface StudentTimetableViewProps {
  studentId: string;
}

export function StudentTimetableView({ studentId }: StudentTimetableViewProps) {
  const state = useStore((s) => s);
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");

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

  // For day view, pick today or first day of the week
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const dayViewDate = weekDays[selectedDayIdx] ?? weekDays[0];

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const grouped = new Map<string, EnrichedTimetableSlot[]>();
    for (const slot of allSlots) {
      const existing = grouped.get(slot.date) ?? [];
      existing.push(slot);
      grouped.set(slot.date, existing);
    }
    return grouped;
  }, [allSlots]);

  // Color map by class name
  const CLASS_COLORS = [
    "bg-[#dbeafe] border-[#2563eb]/30 text-[#2563eb]",
    "bg-[#fff2f0] border-[#c24e3f]/30 text-[#c24e3f]",
    "bg-[#dcfce7] border-[#16a34a]/30 text-[#16a34a]",
    "bg-[#fef3c7] border-[#b45309]/30 text-[#b45309]",
    "bg-[#f3e8ff] border-[#7c3aed]/30 text-[#7c3aed]",
  ];

  const classColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const classNames = [...new Set(allSlots.map((s) => s.className))];
    classNames.forEach((name, i) => {
      map.set(name, CLASS_COLORS[i % CLASS_COLORS.length]);
    });
    return map;
  }, [allSlots]);

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

      {allSlots.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions this week"
          description="You don't have any scheduled class sessions this week."
        />
      ) : viewMode === "week" ? (
        /* Week view */
        <div className="grid grid-cols-5 gap-3">
          {weekDays.map((day) => {
            const daySlots = slotsByDay.get(day.date) ?? [];
            return (
              <div key={day.date}>
                <div
                  className={`text-center pb-2 mb-2 border-b ${
                    day.isToday ? "border-[#c24e3f]" : "border-border"
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

                <div className="space-y-2">
                  {daySlots.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4">
                      No classes
                    </p>
                  ) : (
                    daySlots.map((slot, i) => (
                      <Card
                        key={i}
                        className={`p-2.5 gap-0 border ${
                          classColorMap.get(slot.className) ?? "bg-muted"
                        }`}
                      >
                        <p className="text-[12px] font-semibold truncate">
                          {slot.className}
                        </p>
                        <p className="text-[11px] opacity-80">
                          {slot.slotStartTime}–{slot.slotEndTime}
                        </p>
                        {slot.room && (
                          <p className="text-[10px] opacity-70 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {slot.room}
                          </p>
                        )}
                        {slot.lesson && (
                          <p className="text-[10px] opacity-70 mt-1 truncate">
                            {slot.lesson.title}
                          </p>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Day view */
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

          {/* Day schedule */}
          <div className="space-y-3">
            {dayViewDate && (
              <>
                <h3 className="text-[14px] font-semibold">
                  {dayViewDate.fullLabel}
                </h3>
                {(slotsByDay.get(dayViewDate.date) ?? []).length === 0 ? (
                  <p className="text-[13px] text-muted-foreground py-4">
                    No classes scheduled for this day.
                  </p>
                ) : (
                  (slotsByDay.get(dayViewDate.date) ?? []).map((slot, i) => (
                    <Card
                      key={i}
                      className={`p-4 gap-0 border ${
                        classColorMap.get(slot.className) ?? "bg-muted"
                      }`}
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
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
