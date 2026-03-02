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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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
  Video,
  Target,
  CalendarDays,
  Handshake,
  MapPin,
} from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";
import { format, startOfWeek, addDays, isSameDay, parseISO, getDay } from "date-fns";
import { DAYS, PERIODS } from "@/lib/timetable-constants";

const NON_CLASS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  meeting: { bg: "bg-[#fef3c7]", border: "border-[#b45309]/20", text: "text-[#b45309]" },
  video_call: { bg: "bg-[#f3e8ff]", border: "border-[#7c3aed]/20", text: "text-[#7c3aed]" },
  deadline: { bg: "bg-[#fee2e2]", border: "border-[#dc2626]/20", text: "text-[#dc2626]" },
  event: { bg: "bg-[#dcfce7]", border: "border-[#16a34a]/20", text: "text-[#16a34a]" },
};

const NON_CLASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meeting: Handshake,
  video_call: Video,
  deadline: Target,
  event: CalendarDays,
};

export default function TimetablePage() {
  const loading = useMockLoading();
  const classes = useStore((s) => s.classes);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const getClassById = useStore((s) => s.getClassById);

  const [weekOffset, setWeekOffset] = useState(0);
  const [classFilter, setClassFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const openEventSheet = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSheetOpen(true);
  };

  // Compute current week
  const today = new Date();
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = DAYS.map((_, i) => addDays(weekStart, i));

  // Filter events for timetable: all non-all-day events
  // When a class filter is active, show that class's events + all non-class events
  const timetableEvents = useMemo(() => {
    return calendarEvents.filter((e) => {
      // Exclude all-day events (they don't have time slots)
      if (e.isAllDay) return false;
      // Class filter: when a specific class is selected, only show matching class events + all non-class events
      if (classFilter !== "all") {
        if (e.type === "class" && e.classId !== classFilter) return false;
      }
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
        // Only skip Break/Lunch for class events; non-class events (meetings, etc.) can occupy break periods
        for (const period of PERIODS) {
          if (period.isBreak && event.type === "class") continue;
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
                  const isBreak = period.isBreak;
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
                          {grid[day]?.[period.label]?.map((event, evtIdx) => {
                            const cls = event.classId
                              ? getClassById(event.classId)
                              : null;
                            const dayDate = weekDays[dayIdx];
                            const isClassEvent = event.type === "class";
                            const style = !isClassEvent ? NON_CLASS_STYLES[event.type] : null;
                            const Icon = !isClassEvent ? NON_CLASS_ICONS[event.type] : null;

                            if (isClassEvent) {
                              return (
                                <Link
                                  key={`${event.id}-${evtIdx}`}
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
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                      {cls && (
                                        <span className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {cls.studentIds.length}
                                        </span>
                                      )}
                                      {event.room && (
                                        <span className="flex items-center gap-0.5">
                                          <MapPin className="h-3 w-3" />
                                          {event.room}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              );
                            }

                            return (
                              <button
                                key={`${event.id}-${evtIdx}`}
                                type="button"
                                onClick={() => openEventSheet(event)}
                                className="w-full text-left"
                              >
                                <div className={cn(
                                  "rounded-md border px-2 py-1.5 mb-1 hover:opacity-80 transition-colors cursor-pointer",
                                  style?.bg,
                                  style?.border
                                )}>
                                  <div className={cn("font-medium text-[12px] truncate flex items-center gap-1", style?.text)}>
                                    {Icon && <Icon className="h-3 w-3 shrink-0" />}
                                    {event.title}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    {format(parseISO(event.startTime), "h:mm a")}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {isBreak && (!grid[day]?.[period.label] || grid[day][period.label].length === 0) && dayIdx === 0 && (
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

      {/* Event Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[420px]">
          {selectedEvent && (() => {
            const cls = selectedEvent.classId ? getClassById(selectedEvent.classId) : null;
            const style = NON_CLASS_STYLES[selectedEvent.type];
            const Icon = NON_CLASS_ICONS[selectedEvent.type];
            const typeLabel = selectedEvent.type === "video_call" ? "Video Call"
              : selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1);

            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-[18px]">{selectedEvent.title}</SheetTitle>
                  <SheetDescription>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] border-transparent",
                        style?.bg,
                        style?.text
                      )}
                    >
                      {Icon && <Icon className="h-3 w-3 mr-1" />}
                      {typeLabel}
                    </Badge>
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[13px]">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{format(parseISO(selectedEvent.startTime), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    {selectedEvent.isAllDay ? (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>All day</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>
                          {format(parseISO(selectedEvent.startTime), "h:mm a")} –{" "}
                          {format(parseISO(selectedEvent.endTime), "h:mm a")}
                        </span>
                      </div>
                    )}
                    {cls && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{cls.name}</span>
                      </div>
                    )}
                    {selectedEvent.room && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{selectedEvent.room}</span>
                      </div>
                    )}
                    {selectedEvent.videoCallUrl && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a
                          href={selectedEvent.videoCallUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563eb] underline truncate"
                        >
                          Join call
                        </a>
                      </div>
                    )}
                    {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                      <div className="flex items-start gap-3 text-[13px]">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{selectedEvent.attendees.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {selectedEvent.description && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                          Description
                        </span>
                        <p className="mt-1.5 text-[13px] text-foreground whitespace-pre-wrap">
                          {selectedEvent.description}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />
                  <Link
                    href="/operations/calendar"
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#c24e3f] hover:underline"
                    onClick={() => setSheetOpen(false)}
                  >
                    View in calendar
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
