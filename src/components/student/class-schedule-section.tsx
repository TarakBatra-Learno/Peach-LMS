"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { getStudentTimetable, type EnrichedTimetableSlot } from "@/lib/student-selectors";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, BookOpen } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday } from "date-fns";

interface ClassScheduleSectionProps {
  classId: string;
  studentId: string;
}

export function ClassScheduleSection({ classId, studentId }: ClassScheduleSectionProps) {
  const state = useStore((s) => s);
  const [weekOffset, setWeekOffset] = useState(0);

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

  // Filter to this class only
  const classSlots = useMemo(
    () => allSlots.filter((s) => s.classId === classId),
    [allSlots, classId]
  );

  // Group by day
  const slotsByDay = useMemo(() => {
    const grouped = new Map<string, EnrichedTimetableSlot[]>();
    for (const slot of classSlots) {
      const existing = grouped.get(slot.date) ?? [];
      existing.push(slot);
      grouped.set(slot.date, existing);
    }
    return grouped;
  }, [classSlots]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const day = addDays(baseDate, i);
      return {
        date: format(day, "yyyy-MM-dd"),
        label: format(day, "EEE"),
        fullLabel: format(day, "EEEE, MMM d"),
        isToday: isToday(day),
      };
    });
  }, [baseDate]);

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[12px]"
          onClick={() => setWeekOffset((o) => o - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Previous
        </Button>
        <div className="text-center">
          <p className="text-[14px] font-medium">
            {format(baseDate, "MMM d")} – {format(weekEndDate, "MMM d, yyyy")}
          </p>
          {weekOffset !== 0 && (
            <button
              className="text-[12px] text-[#c24e3f] hover:underline"
              onClick={() => setWeekOffset(0)}
            >
              Back to this week
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[12px]"
          onClick={() => setWeekOffset((o) => o + 1)}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {/* Schedule */}
      {classSlots.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions this week"
          description="There are no scheduled sessions for this class during this week."
        />
      ) : (
        <div className="space-y-3">
          {weekDays.map((day) => {
            const daySlots = slotsByDay.get(day.date) ?? [];
            if (daySlots.length === 0) return null;

            return (
              <div key={day.date}>
                <div className="flex items-center gap-2 mb-2">
                  <p className={`text-[13px] font-medium ${day.isToday ? "text-[#c24e3f]" : ""}`}>
                    {day.fullLabel}
                  </p>
                  {day.isToday && (
                    <Badge className="bg-[#fff2f0] text-[#c24e3f] text-[10px] border-transparent">
                      Today
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {daySlots.map((slot, i) => (
                    <Card
                      key={i}
                      className={`p-3 gap-0 ${day.isToday ? "border-[#c24e3f]/20 bg-[#fff2f0]/30" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[13px]">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">
                              {slot.slotStartTime} – {slot.slotEndTime}
                            </span>
                          </div>
                          {slot.room && (
                            <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {slot.room}
                            </div>
                          )}
                        </div>
                        {slot.unitTitle && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] bg-[#f0f4ff] text-[#3b5998]"
                          >
                            {slot.unitTitle}
                          </Badge>
                        )}
                      </div>

                      {slot.lesson && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-[13px] font-medium">{slot.lesson.title}</p>
                          </div>
                          {slot.lesson.objectives && slot.lesson.objectives.length > 0 && (
                            <ul className="mt-1 space-y-0.5 ml-5">
                              {slot.lesson.objectives.slice(0, 3).map((obj, j) => (
                                <li key={j} className="text-[12px] text-muted-foreground">
                                  • {obj}
                                </li>
                              ))}
                              {slot.lesson.objectives.length > 3 && (
                                <li className="text-[11px] text-muted-foreground">
                                  +{slot.lesson.objectives.length - 3} more objectives
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
