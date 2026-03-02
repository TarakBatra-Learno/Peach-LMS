"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OperationsTabs } from "@/components/shared/operations-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO, getDay } from "date-fns";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const PERIODS = [
  { label: "Homeroom", start: "08:00", end: "08:30" },
  { label: "Period 1", start: "08:30", end: "09:20" },
  { label: "Period 2", start: "09:20", end: "10:10" },
  { label: "Break", start: "10:10", end: "10:30" },
  { label: "Period 3", start: "10:15", end: "11:45" },
  { label: "Period 4", start: "11:50", end: "12:40" },
  { label: "Lunch", start: "12:40", end: "13:30" },
  { label: "Period 5", start: "13:30", end: "14:20" },
  { label: "Period 6", start: "14:25", end: "15:15" },
] as const;

export default function TimetablePage() {
  const loading = useMockLoading();
  const classes = useStore((s) => s.classes);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const getClassById = useStore((s) => s.getClassById);

  const [weekOffset, setWeekOffset] = useState(0);
  const [classFilter, setClassFilter] = useState("all");

  // Compute current week
  const today = new Date();
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = DAYS.map((_, i) => addDays(weekStart, i));

  // Filter class events (type "class" or any recurring weekly events)
  const timetableEvents = useMemo(() => {
    return calendarEvents.filter((e) => {
      if (e.type !== "class") return false;
      if (classFilter !== "all" && e.classId !== classFilter) return false;
      return true;
    });
  }, [calendarEvents, classFilter]);

  // Place events into the timetable grid
  const grid = useMemo(() => {
    const result: Record<string, Record<string, typeof timetableEvents>> = {};
    DAYS.forEach((day) => {
      result[day] = {};
      PERIODS.forEach((period) => {
        result[day][period.label] = [];
      });
    });

    timetableEvents.forEach((event) => {
      const eventDate = parseISO(event.startTime);
      const eventTime = format(eventDate, "HH:mm");

      // Check if event falls on one of this week's days
      weekDays.forEach((dayDate, dayIndex) => {
        // For weekly recurring events, match by day-of-week; otherwise match exact date
        const isOnDay =
          isSameDay(eventDate, dayDate) ||
          (event.recurrence === "weekly" && getDay(eventDate) === getDay(dayDate));
        if (!isOnDay) return;

        // Match to a period by start time
        for (const period of PERIODS) {
          if (period.label === "Break" || period.label === "Lunch") continue;
          if (eventTime >= period.start && eventTime < period.end) {
            result[DAYS[dayIndex]][period.label].push(event);
            break;
          }
        }
      });
    });

    return result;
  }, [timetableEvents, weekDays]);

  if (loading) {
    return (
      <div>
        <OperationsTabs />
        <PageHeader title="Timetable" />
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  return (
    <div>
      <OperationsTabs />
      <PageHeader
        title="Timetable"
        description="Weekly class schedule overview"
      />

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="text-[13px]"
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-[13px] text-muted-foreground ml-2">
            {format(weekDays[0], "MMM d")} – {format(weekDays[4], "MMM d, yyyy")}
          </span>
        </div>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[200px] h-8 text-[13px]">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {timetableEvents.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No timetable events"
          description="Class events will appear here. Create calendar events with type 'Class' to populate the timetable."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-[100px]">
                    Time
                  </th>
                  {DAYS.map((day, i) => (
                    <th
                      key={day}
                      className={cn(
                        "text-left px-3 py-2.5 font-medium min-w-[140px]",
                        isSameDay(weekDays[i], today)
                          ? "text-[#c24e3f] bg-[#fff2f0]/30"
                          : "text-muted-foreground"
                      )}
                    >
                      <div>{day}</div>
                      <div className="text-[11px] font-normal">
                        {format(weekDays[i], "MMM d")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => {
                  const isBreak = period.label === "Break" || period.label === "Lunch";
                  return (
                    <tr
                      key={period.label}
                      className={cn(
                        "border-b last:border-0",
                        isBreak && "bg-muted/20"
                      )}
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-[12px]">{period.label}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {period.start}–{period.end}
                        </div>
                      </td>
                      {DAYS.map((day, dayIdx) => (
                        <td
                          key={day}
                          className={cn(
                            "px-2 py-1.5 align-top",
                            isSameDay(weekDays[dayIdx], today) && "bg-[#fff2f0]/10"
                          )}
                        >
                          {!isBreak &&
                            grid[day]?.[period.label]?.map((event) => {
                              const cls = event.classId
                                ? getClassById(event.classId)
                                : null;
                              const dayDate = weekDays[dayIdx];
                              return (
                                <Link
                                  key={event.id}
                                  href={
                                    event.classId
                                      ? `/operations/attendance?classId=${event.classId}&date=${format(dayDate, "yyyy-MM-dd")}`
                                      : `/operations/calendar`
                                  }
                                >
                                  <div className="rounded-md bg-[#fff2f0] border border-[#c24e3f]/20 px-2 py-1.5 mb-1 hover:bg-[#ffe8e5] transition-colors cursor-pointer">
                                    <div className="font-medium text-[12px] text-[#c24e3f] truncate">
                                      {cls?.name || event.title}
                                    </div>
                                    {cls && (
                                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                                        <Users className="h-3 w-3" />
                                        {cls.studentIds.length} students
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          {isBreak && dayIdx === 0 && (
                            <span className="text-[11px] text-muted-foreground italic">
                              {period.label}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
