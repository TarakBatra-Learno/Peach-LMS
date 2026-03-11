"use client";

import Link from "next/link";
import { useState } from "react";
import { addDays, addMonths, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { getFamilyDemoNow, getFamilyDemoNowMs } from "@/lib/family-demo";
import {
  getEffectiveParentStudentId,
  getFamilyCalendarItems,
  getFamilyDeadlineEntries,
  getFamilyTimetable,
  getParentChildren,
  getParentProfile,
} from "@/lib/family-selectors";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { FilterBar } from "@/components/shared/filter-bar";
import { FamilyRequiresChild } from "@/components/family/family-requires-child";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Video,
} from "lucide-react";
import type { FamilyCalendarEvent } from "@/types/family";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EVENT_TYPE_LABELS: Record<FamilyCalendarEvent["type"], string> = {
  school_event: "School event",
  class_event: "Class event",
  meeting: "Meeting",
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTimeRange(event: FamilyCalendarEvent) {
  if (event.isAllDay) return "All day";
  return `${new Date(event.startsAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })} - ${new Date(event.endsAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function deadlineBucket(
  dueDate: string,
  submissionStatus: string,
  demoNowMs: number
) {
  if (submissionStatus === "submitted_on_time" || submissionStatus === "submitted_late") {
    return "submitted";
  }
  if (submissionStatus === "overdue" || new Date(dueDate).getTime() < demoNowMs) {
    return "overdue";
  }
  return "upcoming";
}

export default function FamilyCalendarPage() {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const loading = useMockLoading([parentId]);
  const demoNow = getFamilyDemoNow();
  const demoNowMs = getFamilyDemoNowMs();
  const [activeTab, setActiveTab] = useState("calendar");
  const [eventView, setEventView] = useState<"month" | "agenda">("month");
  const [eventClassFilter, setEventClassFilter] = useState("all");
  const [scheduleClassFilter, setScheduleClassFilter] = useState("all");
  const [deadlineClassFilter, setDeadlineClassFilter] = useState("all");
  const [deadlineStatusFilter, setDeadlineStatusFilter] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(demoNow));
  const [selectedDate, setSelectedDate] = useState(demoNow);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  if (loading) {
    return (
      <>
        <PageHeader title="Calendar" description="Events, child schedule, and assignment deadlines in one family view" />
        <CardGridSkeleton count={6} />
      </>
    );
  }

  if (!parentId) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Not signed in"
        description="Choose a family persona from the entry page to explore the calendar."
      />
    );
  }

  const parent = getParentProfile(state, parentId);
  const children = getParentChildren(state, parentId);
  const activeStudentId = getEffectiveParentStudentId(state, parentId);

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No linked children yet"
        description="Calendar events and deadlines will appear here once your family account is linked."
      />
    );
  }

  const classOptions = [
    { value: "all", label: "All classes" },
    ...state.classes
      .filter((entry) => {
        if (activeStudentId) {
          return children.find((child) => child.id === activeStudentId)?.classIds.includes(entry.id);
        }
        return children.some((child) => child.classIds.includes(entry.id));
      })
      .map((entry) => ({ value: entry.id, label: entry.subject })),
  ];

  const calendarItems = getFamilyCalendarItems(state, parentId, activeStudentId).filter((event) => {
    if (eventClassFilter === "all") return true;
    return event.classId === eventClassFilter;
  });
  const selectedEvent = calendarItems.find((event) => event.id === selectedEventId) ?? null;

  const monthStart = startOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const selectedDateEvents = calendarItems.filter((event) =>
    isSameDay(new Date(event.startsAt), selectedDate)
  );
  const agendaItems = calendarItems.filter((event) => new Date(event.endsAt).getTime() >= demoNowMs - 24 * 60 * 60 * 1000);

  const scheduleChild = activeStudentId
    ? children.find((child) => child.id === activeStudentId)
    : null;
  const scheduleWeekStart = addDays(startOfWeek(demoNow, { weekStartsOn: 1 }), weekOffset * 7);
  const scheduleRangeStart = format(scheduleWeekStart, "yyyy-MM-dd");
  const scheduleRangeEnd = format(addDays(scheduleWeekStart, 6), "yyyy-MM-dd");
  const scheduleSlots = activeStudentId
    ? getFamilyTimetable(state, parentId, activeStudentId, scheduleRangeStart, scheduleRangeEnd).filter((slot) =>
        scheduleClassFilter === "all" ? true : slot.classId === scheduleClassFilter
      )
    : [];
  const weekDays = Array.from({ length: 5 }, (_, index) => addDays(scheduleWeekStart, index));
  const selectedSlot = selectedSlotId
    ? scheduleSlots.find(
        (slot) => `${slot.date}_${slot.classId}_${slot.slotStartTime}` === selectedSlotId
      ) ?? null
    : null;

  const deadlineEntries = getFamilyDeadlineEntries(state, parentId, activeStudentId).filter((entry) => {
    if (deadlineClassFilter !== "all" && entry.assessment.classId !== deadlineClassFilter) {
      return false;
    }
    const bucket = deadlineBucket(entry.assessment.dueDate, entry.submissionStatus, demoNowMs);
    return deadlineStatusFilter === "all" ? true : bucket === deadlineStatusFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="A clear view of events, weekly schedule, and deadlines for your family."
      >
        <div className="mt-2 flex flex-wrap gap-2">
          {activeStudentId ? (
            <Badge variant="outline">
              {children.find((child) => child.id === activeStudentId)?.firstName}
            </Badge>
          ) : (
            <Badge variant="outline">All children</Badge>
          )}
          <Badge variant="secondary">{calendarItems.length} events in view</Badge>
          <Badge variant="secondary">{deadlineEntries.length} deadlines in scope</Badge>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">School calendar</TabsTrigger>
          <TabsTrigger value="schedule">Child schedule</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <FilterBar
            filters={[
              {
                key: "class",
                label: "Class",
                options: classOptions,
                value: eventClassFilter,
                onChange: setEventClassFilter,
              },
            ]}
          >
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={eventView === "month" ? "default" : "outline"}
                size="sm"
                className="h-9 text-[12px]"
                onClick={() => setEventView("month")}
              >
                Month
              </Button>
              <Button
                variant={eventView === "agenda" ? "default" : "outline"}
                size="sm"
                className="h-9 text-[12px]"
                onClick={() => setEventView("agenda")}
              >
                Agenda
              </Button>
            </div>
          </FilterBar>

          {eventView === "month" ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
              <Card className="gap-0 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="mr-1.5 h-4 w-4" />
                    Prev
                  </Button>
                  <h2 className="text-[16px] font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    Next
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-2">
                  {WEEKDAY_LABELS.map((day) => (
                    <div key={day} className="px-2 text-center text-[11px] font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {monthDays.map((day) => {
                    const dayEvents = calendarItems.filter((event) => isSameDay(new Date(event.startsAt), day));
                    const isSelected = isSameDay(day, selectedDate);
                    const inMonth = isSameMonth(day, currentMonth);

                    return (
                      <button
                        key={day.toISOString()}
                        className={cn(
                          "min-h-[112px] rounded-[16px] border p-2 text-left transition-colors",
                          isSelected ? "border-[#c24e3f]/30 bg-[#fff2f0]" : "border-border hover:bg-muted/40",
                          !inMonth && "opacity-40"
                        )}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn("text-[12px]", isSelected && "font-semibold text-[#c24e3f]")}>
                            {format(day, "d")}
                          </span>
                          {dayEvents.length > 0 && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                              {dayEvents.length}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div key={event.id} className="rounded-[10px] bg-muted px-2 py-1 text-[10px] font-medium">
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="px-1 text-[10px] text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="gap-0 p-5">
                <div className="mb-4">
                  <h2 className="text-[16px] font-semibold">{format(selectedDate, "EEEE, MMMM d")}</h2>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Family-facing events, meetings, and reminders
                  </p>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="Nothing scheduled"
                    description="No school or class events are scheduled on this day."
                  />
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <button
                        key={event.id}
                        className="w-full rounded-[16px] border border-border p-4 text-left transition-colors hover:bg-muted/40"
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium">{event.title}</p>
                            <p className="mt-1 text-[12px] text-muted-foreground">{formatTimeRange(event)}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {EVENT_TYPE_LABELS[event.type]}
                          </Badge>
                        </div>
                        <p className="mt-3 line-clamp-2 text-[12px] text-muted-foreground">{event.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : agendaItems.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming events"
              description="Try a different class filter or check back after the next school update."
            />
          ) : (
            <div className="space-y-4">
              {agendaItems.map((event) => (
                <Card key={event.id} className="gap-0 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-medium">{event.title}</h2>
                        <Badge variant="outline" className="text-[10px]">
                          {EVENT_TYPE_LABELS[event.type]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {formatLongDate(event.startsAt)} · {formatTimeRange(event)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => setSelectedEventId(event.id)}>
                      View details
                    </Button>
                  </div>
                  <p className="mt-3 text-[13px] text-muted-foreground">{event.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {event.classId && (
                      <Badge variant="secondary" className="text-[10px]">
                        {state.classes.find((entry) => entry.id === event.classId)?.subject ?? "Class"}
                      </Badge>
                    )}
                    {!activeStudentId &&
                      children
                        .filter((child) => event.studentIds.includes(child.id))
                        .map((child) => (
                          <Badge key={`${event.id}_${child.id}`} variant="outline" className="text-[10px]">
                            {child.firstName}
                          </Badge>
                        ))}
                    {event.location && (
                      <Badge variant="outline" className="text-[10px]">
                        {event.location}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          {!activeStudentId ? (
            <FamilyRequiresChild
              title="Choose one child for schedule detail"
              description="Weekly class schedules stay focused on one child at a time so the timetable stays readable."
            />
          ) : (
            <>
              <FilterBar
                filters={[
                  {
                    key: "class",
                    label: "Class",
                    options: classOptions,
                    value: scheduleClassFilter,
                    onChange: setScheduleClassFilter,
                  },
                ]}
              >
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 text-[12px]" onClick={() => setWeekOffset((value) => value - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Prev week
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 text-[12px]" onClick={() => setWeekOffset((value) => value + 1)}>
                    Next week
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                  {weekOffset !== 0 && (
                    <Button variant="ghost" size="sm" className="h-9 text-[12px]" onClick={() => setWeekOffset(0)}>
                      Demo week
                    </Button>
                  )}
                </div>
              </FilterBar>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                {weekDays.map((day) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const daySlots = scheduleSlots.filter((slot) => slot.date === dayKey);
                  return (
                    <Card key={dayKey} className="gap-0 p-4">
                      <div className="mb-4">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{format(day, "EEE")}</p>
                        <h2 className="mt-1 text-[15px] font-semibold">{format(day, "MMM d")}</h2>
                      </div>
                      {daySlots.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground">No scheduled classes.</p>
                      ) : (
                        <div className="space-y-3">
                          {daySlots.map((slot) => {
                            const slotId = `${slot.date}_${slot.classId}_${slot.slotStartTime}`;
                            return (
                              <button
                                key={slotId}
                                className="w-full rounded-[14px] border border-border bg-background p-3 text-left transition-colors hover:bg-muted/40"
                                onClick={() => setSelectedSlotId(slotId)}
                              >
                                <p className="text-[13px] font-medium">{slot.className}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {slot.slotStartTime} - {slot.slotEndTime}
                                  {slot.room ? ` · ${slot.room}` : ""}
                                </p>
                                {slot.lesson && (
                                  <p className="mt-2 line-clamp-2 text-[12px] text-muted-foreground">
                                    {slot.lesson.title}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              <Card className="gap-0 p-5">
                <h2 className="text-[15px] font-semibold">{scheduleChild?.firstName}&apos;s weekly pattern</h2>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  This weekly view shows recurring class blocks plus any assigned lesson titles that have already been published for student-facing view.
                </p>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          <FilterBar
            filters={[
              {
                key: "class",
                label: "Class",
                options: classOptions,
                value: deadlineClassFilter,
                onChange: setDeadlineClassFilter,
              },
              {
                key: "status",
                label: "Status",
                options: [
                  { value: "all", label: "All deadlines" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "overdue", label: "Overdue" },
                  { value: "submitted", label: "Submitted" },
                ],
                value: deadlineStatusFilter,
                onChange: setDeadlineStatusFilter,
              },
            ]}
          />

          {deadlineEntries.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No deadlines in this view"
              description="Try a different class or status filter."
            />
          ) : (
            <div className="space-y-4">
              {deadlineEntries.map((entry) => {
                const bucket = deadlineBucket(entry.assessment.dueDate, entry.submissionStatus, demoNowMs);
                return (
                  <Link
                    key={`${entry.studentId}_${entry.assessment.id}`}
                    href={`/family/assessments/${entry.assessment.id}?child=${entry.studentId}`}
                    className="block"
                  >
                    <Card className="gap-0 p-5 transition-colors hover:bg-muted/40">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium">{entry.assessment.title}</p>
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            {entry.className} · Due {formatShortDate(entry.assessment.dueDate)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <StatusBadge status={entry.submissionStatus} showIcon={false} className="text-[10px]" />
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              bucket === "overdue" && "border-[#c24e3f]/30 text-[#c24e3f]"
                            )}
                          >
                            {bucket}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.unit && (
                          <Badge variant="secondary" className="text-[10px]">
                            {entry.unit.title}
                          </Badge>
                        )}
                        {!activeStudentId && (
                          <Badge variant="outline" className="text-[10px]">
                            {entry.studentName}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <SheetContent side="right" className="w-[440px] sm:max-w-[440px]">
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedEvent.title}</SheetTitle>
                <SheetDescription>{EVENT_TYPE_LABELS[selectedEvent.type]}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>{formatLongDate(selectedEvent.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeRange(selectedEvent)}</span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Details</h3>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedEvent.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedEvent.classId && (
                    <Badge variant="secondary">{state.classes.find((entry) => entry.id === selectedEvent.classId)?.name ?? "Class"}</Badge>
                  )}
                  {children
                    .filter((child) => selectedEvent.studentIds.includes(child.id))
                    .map((child) => (
                      <Badge key={`${selectedEvent.id}_${child.id}`} variant="outline">
                        {child.firstName} {child.lastName}
                      </Badge>
                    ))}
                </div>

                {selectedEvent.meetingLink && (
                  <a href={selectedEvent.meetingLink} target="_blank" rel="noreferrer">
                    <Button className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Open meeting link
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </a>
                )}

                {selectedEvent.attachment?.url && (
                  <a href={selectedEvent.attachment.url} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {selectedEvent.attachment.label}
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlotId(null)}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          {selectedSlot && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedSlot.className}</SheetTitle>
                <SheetDescription>
                  {formatLongDate(`${selectedSlot.date}T08:00:00.000Z`)} · {selectedSlot.slotStartTime} - {selectedSlot.slotEndTime}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="space-y-2 text-[13px] text-muted-foreground">
                  {selectedSlot.room && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedSlot.room}</span>
                    </div>
                  )}
                  {selectedSlot.unitTitle && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{selectedSlot.unitTitle}</span>
                    </div>
                  )}
                </div>

                {selectedSlot.lesson ? (
                  <div>
                    <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Published lesson focus</h3>
                    <p className="mt-2 text-[15px] font-medium">{selectedSlot.lesson.title}</p>
                    {selectedSlot.lesson.objectives && selectedSlot.lesson.objectives.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {selectedSlot.lesson.objectives.map((objective) => (
                          <div key={objective} className="rounded-[14px] bg-muted px-3 py-2 text-[12px] text-muted-foreground">
                            {objective}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={Clock}
                    title="No published lesson detail yet"
                    description="The recurring class block is visible here even when no lesson title has been shared to the student-facing view."
                  />
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
