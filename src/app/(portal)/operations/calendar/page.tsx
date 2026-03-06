"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { OperationsTabs } from "@/components/shared/operations-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AttendanceDialog } from "@/components/shared/attendance-dialog";
import { generateId } from "@/services/mock-service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";
import { expandEventsForRange, type ExpandedCalendarEvent } from "@/lib/calendar-utils";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  Users,
  Clock,
  Target,
  Megaphone,
  Trash2,
  Pencil,
  Link2,
  CheckCircle2,
  HelpCircle,
  XCircle,
  List,
  CalendarDays,
  Shield,
  ExternalLink,
} from "lucide-react";
import type { CalendarEvent, RsvpStatus } from "@/types/calendar";

const EVENT_TYPES: { value: CalendarEvent["type"]; label: string }[] = [
  { value: "class", label: "Class" },
  { value: "meeting", label: "Meeting" },
  { value: "video_call", label: "Video Call" },
  { value: "deadline", label: "Deadline" },
  { value: "event", label: "Event" },
];

const EVENT_TYPE_COLORS: Record<CalendarEvent["type"], string> = {
  class: "bg-[#dbeafe] text-[#2563eb]",
  meeting: "bg-[#fef3c7] text-[#b45309]",
  video_call: "bg-[#f3e8ff] text-[#7c3aed]",
  deadline: "bg-[#fee2e2] text-[#dc2626]",
  event: "bg-[#dcfce7] text-[#16a34a]",
};

const EVENT_TYPE_DOT_COLORS: Record<CalendarEvent["type"], string> = {
  class: "bg-[#2563eb]",
  meeting: "bg-[#b45309]",
  video_call: "bg-[#7c3aed]",
  deadline: "bg-[#dc2626]",
  event: "bg-[#16a34a]",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface EventFormState {
  title: string;
  description: string;
  type: CalendarEvent["type"];
  date: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  classId: string;
  linkedAssessmentId: string;
  linkedReportCycleId: string;
  videoCallUrl: string;
  rsvpStatus: RsvpStatus | "";
}

const defaultFormState: EventFormState = {
  title: "",
  description: "",
  type: "event",
  date: format(new Date(), "yyyy-MM-dd"),
  startTime: "09:00",
  endTime: "10:00",
  isAllDay: false,
  classId: "",
  linkedAssessmentId: "",
  linkedReportCycleId: "",
  videoCallUrl: "",
  rsvpStatus: "",
};

const RSVP_OPTIONS: { value: RsvpStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "attending", label: "Attending", icon: CheckCircle2 },
  { value: "maybe", label: "Maybe", icon: HelpCircle },
  { value: "declined", label: "Declined", icon: XCircle },
];

export default function CalendarPage() {
  const loading = useMockLoading();
  const classes = useStore((s) => s.classes);
  const assessments = useStore((s) => s.assessments);
  const reportCycles = useStore((s) => s.reportCycles);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useStore((s) => s.updateCalendarEvent);
  const deleteCalendarEvent = useStore((s) => s.deleteCalendarEvent);
  const getClassById = useStore((s) => s.getClassById);
  const incidents = useStore((s) => s.incidents);
  const attendanceSessions = useStore((s) => s.attendanceSessions);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(defaultFormState);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [calView, setCalView] = useState<"month" | "week">("month");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [typeFilter, setTypeFilter] = useState<CalendarEvent["type"] | "all">("all");

  // Attendance dialog state
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceClassId, setAttendanceClassId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>("");

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Visible date range for expansion (covers both month and week views)
  const visibleRange = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthCalStart = startOfWeek(monthStart);
    const monthCalEnd = endOfWeek(monthEnd);
    const weekEnd = endOfWeek(currentWeekStart);
    // Use the broadest range that covers both views
    const rangeStart = monthCalStart < currentWeekStart ? monthCalStart : currentWeekStart;
    const rangeEnd = monthCalEnd > weekEnd ? monthCalEnd : weekEnd;
    return { start: rangeStart, end: rangeEnd };
  }, [currentMonth, currentWeekStart]);

  // Group events by date (with type filter + recurrence expansion)
  const eventsByDate = useMemo(() => {
    const filtered = typeFilter === "all"
      ? calendarEvents
      : calendarEvents.filter((evt) => evt.type === typeFilter);
    const expanded = expandEventsForRange(filtered, visibleRange.start, visibleRange.end);
    const map: Record<string, ExpandedCalendarEvent[]> = {};
    expanded.forEach((evt) => {
      const dateKey = evt.materializedDate;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(evt);
    });
    return map;
  }, [calendarEvents, typeFilter, visibleRange]);

  // Events for selected date
  const selectedDateEvents = useMemo((): ExpandedCalendarEvent[] => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return (eventsByDate[dateKey] || []).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  }, [selectedDate, eventsByDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart);
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  const updateForm = (updates: Partial<EventFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const openAddDialog = () => {
    setEditMode(false);
    setEditEventId(null);
    setForm({
      ...defaultFormState,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    });
    setAddDialogOpen(true);
  };

  const openEditDialog = (evt: CalendarEvent) => {
    setEditMode(true);
    setEditEventId(evt.id);
    setForm({
      title: evt.title,
      description: evt.description || "",
      type: evt.type,
      date: format(parseISO(evt.startTime), "yyyy-MM-dd"),
      startTime: evt.isAllDay ? "09:00" : format(parseISO(evt.startTime), "HH:mm"),
      endTime: evt.isAllDay ? "10:00" : format(parseISO(evt.endTime), "HH:mm"),
      isAllDay: evt.isAllDay,
      classId: evt.classId || "",
      linkedAssessmentId: evt.linkedAssessmentId || "",
      linkedReportCycleId: evt.linkedReportCycleId || "",
      videoCallUrl: evt.videoCallUrl || "",
      rsvpStatus: evt.rsvpStatus || "",
    });
    setSheetOpen(false);
    setAddDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const startTime = form.isAllDay
      ? `${form.date}T00:00:00`
      : `${form.date}T${form.startTime}:00`;
    const endTime = form.isAllDay
      ? `${form.date}T23:59:59`
      : `${form.date}T${form.endTime}:00`;

    const linkedAssessmentId = form.linkedAssessmentId && form.linkedAssessmentId !== "none" ? form.linkedAssessmentId : undefined;
    const linkedReportCycleId = form.linkedReportCycleId && form.linkedReportCycleId !== "none" ? form.linkedReportCycleId : undefined;
    const videoCallUrl = form.videoCallUrl.trim() || undefined;
    const rsvpStatus = form.rsvpStatus || undefined;

    if (editMode && editEventId) {
      updateCalendarEvent(editEventId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        startTime,
        endTime,
        isAllDay: form.isAllDay,
        classId: form.classId || undefined,
        linkedAssessmentId,
        linkedReportCycleId,
        videoCallUrl,
        rsvpStatus,
      });
      toast.success("Event updated");
    } else {
      addCalendarEvent({
        id: generateId("evt"),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        startTime,
        endTime,
        isAllDay: form.isAllDay,
        classId: form.classId || undefined,
        linkedAssessmentId,
        linkedReportCycleId,
        videoCallUrl,
        rsvpStatus,
        recurrence: "none",
      });
      toast.success("Event created");
    }

    setAddDialogOpen(false);
    setForm(defaultFormState);
  };

  const handleDeleteEvent = () => {
    if (eventToDelete) {
      deleteCalendarEvent(eventToDelete);
      toast.success("Event deleted");
      setEventToDelete(null);
      setSheetOpen(false);
      setSelectedEvent(null);
    }
  };

  const openEventSheet = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <div>
        <OperationsTabs />
        <PageHeader title="Calendar" />
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div>
      <OperationsTabs />
      <PageHeader
        title="Calendar"
        description="Manage your schedule, events, and deadlines"
        primaryAction={{
          label: "Add event",
          onClick: openAddDialog,
          icon: CalendarPlus,
        }}
      />

      {/* View toggle + navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-semibold">
          {calView === "month"
            ? format(currentMonth, "MMMM yyyy")
            : `${format(currentWeekStart, "MMM d")} – ${format(endOfWeek(currentWeekStart), "MMM d, yyyy")}`}
        </h2>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0 border border-border rounded-md overflow-hidden">
            <Button
              variant={calView === "month" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-[12px] rounded-none gap-1"
              onClick={() => setCalView("month")}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Month
            </Button>
            <Button
              variant={calView === "week" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-[12px] rounded-none gap-1"
              onClick={() => setCalView("week")}
            >
              <List className="h-3.5 w-3.5" />
              Week
            </Button>
          </div>
          {/* Navigation */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              calView === "month"
                ? setCurrentMonth(subMonths(currentMonth, 1))
                : setCurrentWeekStart(subWeeks(currentWeekStart, 1))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => {
              if (calView === "month") {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              } else {
                setCurrentWeekStart(startOfWeek(new Date()));
              }
            }}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              calView === "month"
                ? setCurrentMonth(addMonths(currentMonth, 1))
                : setCurrentWeekStart(addWeeks(currentWeekStart, 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => setTypeFilter("all")}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border",
            typeFilter === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-border hover:bg-muted"
          )}
        >
          All
        </button>
        {EVENT_TYPES.map((t) => (
          <button
            type="button"
            key={t.value}
            onClick={() => setTypeFilter(t.value as CalendarEvent["type"])}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border",
              typeFilter === t.value
                ? cn("border-transparent", EVENT_TYPE_COLORS[t.value as CalendarEvent["type"]])
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Month view */}
      {calView === "month" && (<>
      <Card className="p-0 gap-0 overflow-hidden mb-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[12px] font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[80px] p-1.5 border-b border-r border-border text-left transition-colors hover:bg-muted/50 relative",
                  !isCurrentMonth && "bg-muted/20",
                  isSelected && "bg-[#fff2f0] ring-1 ring-[#c24e3f]/20",
                  idx % 7 === 6 && "border-r-0"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-6 w-6 rounded-full text-[12px] font-medium",
                    isToday && "bg-[#c24e3f] text-white",
                    !isToday && isCurrentMonth && "text-foreground",
                    !isToday && !isCurrentMonth && "text-muted-foreground/50"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((evt, evtIdx) => (
                      <div
                        key={`${evt.id}-${evtIdx}`}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          EVENT_TYPE_DOT_COLORS[evt.type]
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground leading-none">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected date events */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            <Button variant="outline" size="sm" onClick={openAddDialog}>
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              Add event
            </Button>
          </div>

          {selectedDateEvents.length === 0 ? (
            <Card className="p-8 gap-0">
              <p className="text-center text-[13px] text-muted-foreground">
                No events for this day.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map((evt, evtIdx) => {
                const cls = evt.classId ? getClassById(evt.classId) : undefined;
                const linkedAssessment = evt.linkedAssessmentId
                  ? assessments.find((a) => a.id === evt.linkedAssessmentId)
                  : undefined;
                const linkedCycle = evt.linkedReportCycleId
                  ? reportCycles.find((rc) => rc.id === evt.linkedReportCycleId)
                  : undefined;
                return (
                  <Card
                    key={`${evt.id}-${evtIdx}`}
                    className="p-4 gap-0 cursor-pointer hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:border-border/80 transition-all"
                    onClick={() => openEventSheet(evt)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[14px] font-medium truncate">
                            {evt.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px] shrink-0 border-transparent",
                              EVENT_TYPE_COLORS[evt.type]
                            )}
                          >
                            {EVENT_TYPES.find((t) => t.value === evt.type)?.label}
                          </Badge>
                          {linkedAssessment && (
                            <Badge variant="outline" className="text-[11px] shrink-0 bg-[#f3e8ff] text-[#7c3aed] border-transparent">
                              <Target className="h-3 w-3 mr-1" />
                              {linkedAssessment.title}
                            </Badge>
                          )}
                          {linkedCycle && (
                            <Badge variant="outline" className="text-[11px] shrink-0 bg-[#fef3c7] text-[#b45309] border-transparent">
                              <Megaphone className="h-3 w-3 mr-1" />
                              {linkedCycle.name}
                            </Badge>
                          )}
                          {evt.linkedIncidentId && (() => {
                            const inc = incidents.find((i) => i.id === evt.linkedIncidentId);
                            return inc ? (
                              <Badge variant="outline" className="text-[11px] shrink-0 bg-[#fee2e2] text-[#dc2626] border-transparent">
                                <Shield className="h-3 w-3 mr-1" />
                                Incident
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                          {evt.isAllDay ? (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              All day
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {format(parseISO(evt.startTime), "h:mm a")} -{" "}
                              {format(parseISO(evt.endTime), "h:mm a")}
                            </span>
                          )}
                          {cls && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {cls.name}
                            </span>
                          )}
                          {evt.videoCallUrl && (
                            <a
                              href={evt.videoCallUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[#2563eb] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Video className="h-3.5 w-3.5" />
                              Join call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedDate && calendarEvents.length === 0 && (
        <EmptyState
          icon={CalendarIcon}
          title="No events yet"
          description="Add events to keep track of classes, meetings, deadlines, and more."
          action={{ label: "Add event", onClick: openAddDialog }}
        />
      )}
      </>)}

      {/* Week view (D4) */}
      {calView === "week" && (
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvts = (eventsByDate[dateKey] || []).sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            );
            const isToday = isSameDay(day, new Date());
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-7 w-7 rounded-full text-[13px] font-semibold",
                      isToday && "bg-[#c24e3f] text-white",
                      !isToday && "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <span className="text-[14px] font-medium">
                    {format(day, "EEEE, MMMM d")}
                  </span>
                  {isToday && (
                    <Badge variant="outline" className="text-[10px] ml-1 bg-[#fff2f0] text-[#c24e3f] border-[#c24e3f]/20">
                      Today
                    </Badge>
                  )}
                </div>
                {dayEvts.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground ml-9 mb-2">No events</p>
                ) : (
                  <div className="space-y-1.5 ml-9 mb-2">
                    {dayEvts.map((evt, evtIdx) => {
                      const cls = evt.classId ? getClassById(evt.classId) : undefined;
                      return (
                        <Card
                          key={`${evt.id}-${evtIdx}`}
                          className="p-3 gap-0 cursor-pointer hover:shadow-sm transition-all"
                          onClick={() => openEventSheet(evt)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <div
                              className={cn(
                                "h-2.5 w-2.5 rounded-full shrink-0",
                                EVENT_TYPE_DOT_COLORS[evt.type]
                              )}
                            />
                            <span className="text-[13px] font-medium">{evt.title}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] shrink-0 border-transparent",
                                EVENT_TYPE_COLORS[evt.type]
                              )}
                            >
                              {EVENT_TYPES.find((t) => t.value === evt.type)?.label || evt.type}
                            </Badge>
                            {evt.isAllDay ? (
                              <span className="text-[11px] text-muted-foreground">All day</span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                {format(parseISO(evt.startTime), "h:mm a")} – {format(parseISO(evt.endTime), "h:mm a")}
                              </span>
                            )}
                            {cls && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {cls.name}
                              </span>
                            )}
                            {evt.linkedIncidentId && (() => {
                              const inc = incidents.find((i) => i.id === evt.linkedIncidentId);
                              return inc ? (
                                <span className="text-[11px] text-[#dc2626] flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Incident linked
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
                <Separator />
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Event Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit event" : "Add event"}</DialogTitle>
            <DialogDescription>
              {editMode
                ? "Update the event details below."
                : "Create a new calendar event."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto min-h-0">
            <div>
              <Label className="text-[13px]">Title</Label>
              <Input
                placeholder="Event title"
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                className="mt-1.5 h-9 text-[13px]"
              />
            </div>

            <div>
              <Label className="text-[13px]">Description</Label>
              <Textarea
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                className="mt-1.5 text-[13px] min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[13px]">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => updateForm({ type: v as CalendarEvent["type"] })}
                >
                  <SelectTrigger className="mt-1.5 h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[13px]">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm({ date: e.target.value })}
                  className="mt-1.5 h-9 text-[13px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="all-day"
                checked={form.isAllDay}
                onCheckedChange={(checked) => updateForm({ isAllDay: checked })}
              />
              <Label htmlFor="all-day" className="text-[13px] cursor-pointer">
                All-day event
              </Label>
            </div>

            {!form.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[13px]">Start time</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => updateForm({ startTime: e.target.value })}
                    className="mt-1.5 h-9 text-[13px]"
                  />
                </div>
                <div>
                  <Label className="text-[13px]">End time</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => updateForm({ endTime: e.target.value })}
                    className="mt-1.5 h-9 text-[13px]"
                  />
                </div>
              </div>
            )}

            {classes.length > 0 && (
              <div>
                <Label className="text-[13px]">Link to class (optional)</Label>
                <Select
                  value={form.classId}
                  onValueChange={(v) => updateForm({ classId: v })}
                >
                  <SelectTrigger className="mt-1.5 h-9 text-[13px]">
                    <SelectValue placeholder="No class linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No class linked</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Link to assessment / report cycle */}
            <div className="grid grid-cols-2 gap-4">
              {assessments.length > 0 && (
                <div>
                  <Label className="text-[13px]">Link to assessment</Label>
                  <Select
                    value={form.linkedAssessmentId}
                    onValueChange={(v) => updateForm({ linkedAssessmentId: v })}
                  >
                    <SelectTrigger className="mt-1.5 h-9 text-[13px]">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {assessments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {reportCycles.length > 0 && (
                <div>
                  <Label className="text-[13px]">Link to report cycle</Label>
                  <Select
                    value={form.linkedReportCycleId}
                    onValueChange={(v) => updateForm({ linkedReportCycleId: v })}
                  >
                    <SelectTrigger className="mt-1.5 h-9 text-[13px]">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {reportCycles.map((rc) => (
                        <SelectItem key={rc.id} value={rc.id}>
                          {rc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Video call URL */}
            <div>
              <Label className="text-[13px]">Video call link (optional)</Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={form.videoCallUrl}
                onChange={(e) => updateForm({ videoCallUrl: e.target.value })}
                className="mt-1.5 h-9 text-[13px]"
              />
            </div>

            {/* RSVP status */}
            <div>
              <Label className="text-[13px] mb-1.5 block">RSVP</Label>
              <div className="flex gap-1">
                {RSVP_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = form.rsvpStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        updateForm({ rsvpStatus: isActive ? "" : opt.value })
                      }
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all border",
                        isActive && opt.value === "attending" && "bg-[#dcfce7] text-[#16a34a] border-[#16a34a]/30",
                        isActive && opt.value === "maybe" && "bg-[#fef3c7] text-[#b45309] border-[#b45309]/30",
                        isActive && opt.value === "declined" && "bg-[#fee2e2] text-[#dc2626] border-[#dc2626]/30",
                        !isActive && "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editMode ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[420px]">
          {selectedEvent && (() => {
            const isClassEvent = selectedEvent.type === "class";
            const sheetDateStr = format(parseISO(selectedEvent.startTime), "yyyy-MM-dd");
            const calAttTaken = isClassEvent && selectedEvent.classId
              ? attendanceSessions.some(
                  (s) => s.classId === selectedEvent.classId && s.date === sheetDateStr
                )
              : false;

            return (
            <>
              <SheetHeader>
                <SheetTitle className="text-[18px]">{selectedEvent.title}</SheetTitle>
                <SheetDescription>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px] border-transparent",
                      EVENT_TYPE_COLORS[selectedEvent.type]
                    )}
                  >
                    {EVENT_TYPES.find((t) => t.value === selectedEvent.type)?.label}
                  </Badge>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[13px]">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      {format(parseISO(selectedEvent.startTime), "EEEE, MMMM d, yyyy")}
                    </span>
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
                        {format(parseISO(selectedEvent.startTime), "h:mm a")} -{" "}
                        {format(parseISO(selectedEvent.endTime), "h:mm a")}
                      </span>
                    </div>
                  )}
                  {selectedEvent.classId && (
                    <div className="flex items-center gap-3 text-[13px]">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {getClassById(selectedEvent.classId)?.name || "Unknown class"}
                      </span>
                    </div>
                  )}
                  {isClassEvent && (
                    <div className="flex items-center gap-3 text-[13px]">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      {calAttTaken ? (
                        <Badge variant="outline" className="text-[11px] bg-[#dcfce7] text-[#16a34a] border-transparent">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Taken
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Not taken</span>
                      )}
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
                        {selectedEvent.videoCallUrl}
                      </a>
                    </div>
                  )}
                  {selectedEvent.linkedAssessmentId && (() => {
                    const a = assessments.find((x) => x.id === selectedEvent.linkedAssessmentId);
                    return a ? (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Assessment: {a.title}</span>
                      </div>
                    ) : null;
                  })()}
                  {selectedEvent.linkedReportCycleId && (() => {
                    const rc = reportCycles.find((x) => x.id === selectedEvent.linkedReportCycleId);
                    return rc ? (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Megaphone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Report cycle: {rc.name}</span>
                      </div>
                    ) : null;
                  })()}
                  {selectedEvent.linkedIncidentId && (() => {
                    const inc = incidents.find((x) => x.id === selectedEvent.linkedIncidentId);
                    return inc ? (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Link
                          href="/support"
                          className="text-[#2563eb] hover:underline inline-flex items-center gap-1"
                        >
                          Incident: {inc.title}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    ) : null;
                  })()}
                  {selectedEvent.rsvpStatus && (
                    <div className="flex items-center gap-3 text-[13px]">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>RSVP: <span className="capitalize font-medium">{selectedEvent.rsvpStatus}</span></span>
                    </div>
                  )}
                </div>

                {/* RSVP quick toggle */}
                <div>
                  <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Your RSVP
                  </span>
                  <div className="flex gap-1 mt-1.5">
                    {RSVP_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isActive = selectedEvent.rsvpStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const newStatus = isActive ? undefined : opt.value;
                            updateCalendarEvent(selectedEvent.id, { rsvpStatus: newStatus });
                            setSelectedEvent({ ...selectedEvent, rsvpStatus: newStatus });
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all border",
                            isActive && opt.value === "attending" && "bg-[#dcfce7] text-[#16a34a] border-[#16a34a]/30",
                            isActive && opt.value === "maybe" && "bg-[#fef3c7] text-[#b45309] border-[#b45309]/30",
                            isActive && opt.value === "declined" && "bg-[#fee2e2] text-[#dc2626] border-[#dc2626]/30",
                            !isActive && "bg-background text-muted-foreground border-border hover:bg-muted"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
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

                {isClassEvent && selectedEvent.classId && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAttendanceClassId(selectedEvent.classId!);
                        setAttendanceDate(sheetDateStr);
                        setAttendanceDialogOpen(true);
                      }}
                    >
                      {calAttTaken ? (
                        <>
                          <Pencil className="h-4 w-4 mr-1.5" />
                          Edit attendance
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Take attendance
                        </>
                      )}
                    </Button>
                    <Link
                      href={`/classes/${selectedEvent.classId}`}
                      className="inline-flex items-center gap-1.5 text-[13px] text-[#c24e3f] hover:underline"
                      onClick={() => setSheetOpen(false)}
                    >
                      View class
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(selectedEvent)}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-[#dc2626] hover:text-[#dc2626] hover:bg-[#fee2e2]"
                    onClick={() => {
                      setEventToDelete(selectedEvent.id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteEvent}
        destructive
      />

      {/* Attendance Dialog */}
      <AttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        prefilledClassId={attendanceClassId || undefined}
        prefilledDate={attendanceDate || undefined}
      />
    </div>
  );
}
