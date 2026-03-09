"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStudentCalendarEvents, getStudentAssessments } from "@/lib/student-selectors";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import type { CalendarEvent } from "@/types/calendar";

interface StudentCalendarProps {
  studentId: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  class: "bg-[#dbeafe] text-[#2563eb]",
  deadline: "bg-[#fee2e2] text-[#dc2626]",
  exam: "bg-[#fef3c7] text-[#b45309]",
  meeting: "bg-[#dcfce7] text-[#16a34a]",
  holiday: "bg-muted text-muted-foreground",
  event: "bg-[#fff2f0] text-[#c24e3f]",
};

export function StudentCalendar({ studentId }: StudentCalendarProps) {
  const state = useStore((s) => s);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const calendarEvents = useMemo(
    () => getStudentCalendarEvents(state, studentId),
    [state, studentId]
  );

  const assessments = useMemo(
    () => getStudentAssessments(state, studentId),
    [state, studentId]
  );

  // Add assessment deadlines as calendar markers
  const allEvents = useMemo(() => {
    const deadlineEvents: CalendarEvent[] = assessments.map((a) => ({
      id: `deadline_${a.id}`,
      title: `Due: ${a.title}`,
      description: "",
      type: "deadline" as const,
      startTime: new Date(a.dueDate.split("T")[0] + "T23:59:00").toISOString(),
      endTime: new Date(a.dueDate.split("T")[0] + "T23:59:00").toISOString(),
      isAllDay: true,
      classId: a.classId,
    }));
    return [...calendarEvents, ...deadlineEvents];
  }, [calendarEvents, assessments]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return allEvents.filter((e) => {
      const eventDate = format(new Date(e.startTime), "yyyy-MM-dd");
      return eventDate === dateStr;
    });
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar grid */}
      <div className="lg:col-span-2">
        <Card className="p-5 gap-0">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-[16px] font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-medium text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  className={`relative h-16 p-1 border border-border/30 text-left transition-colors ${
                    isSelected
                      ? "bg-[#fff2f0] border-[#c24e3f]/30"
                      : today
                      ? "bg-[#fff2f0]/50"
                      : "hover:bg-muted/50"
                  } ${!inMonth ? "opacity-30" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span
                    className={`text-[12px] ${
                      today
                        ? "font-bold text-[#c24e3f]"
                        : isSelected
                        ? "font-medium text-[#c24e3f]"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            e.type === "deadline"
                              ? "bg-[#dc2626]"
                              : e.type === "class"
                              ? "bg-[#2563eb]"
                              : "bg-[#c24e3f]"
                          }`}
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Selected day detail */}
      <div>
        <Card className="p-5 gap-0">
          <h3 className="text-[14px] font-semibold mb-3">
            {selectedDate
              ? format(selectedDate, "EEEE, MMMM d")
              : "Select a date"}
          </h3>

          {selectedEvents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No events on this day.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 items-start"
                >
                  <div
                    className={`shrink-0 mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                      EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS.event
                    }`}
                  >
                    {event.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {event.title}
                    </p>
                    {!event.isAllDay && (
                      <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.startTime), "h:mm a")}
                        {event.endTime &&
                          ` – ${format(new Date(event.endTime), "h:mm a")}`}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
