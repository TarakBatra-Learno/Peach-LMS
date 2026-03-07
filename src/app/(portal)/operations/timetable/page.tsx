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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  Pencil,
  Trash2,
  CalendarPlus,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { CalendarEvent, RsvpStatus } from "@/types/calendar";
import { format, addDays, isSameDay, parseISO, getDay } from "date-fns";
import { PERIODS } from "@/lib/timetable-constants";

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

const RSVP_OPTIONS: { value: RsvpStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "attending", label: "Attending", icon: CheckCircle2 },
  { value: "maybe", label: "Maybe", icon: HelpCircle },
  { value: "declined", label: "Declined", icon: XCircle },
];

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

export default function TimetablePage() {
  const loading = useMockLoading();
  const classes = useStore((s) => s.classes);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const getClassById = useStore((s) => s.getClassById);
  const attendanceSessions = useStore((s) => s.attendanceSessions);
  const assessments = useStore((s) => s.assessments);
  const reportCycles = useStore((s) => s.reportCycles);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useStore((s) => s.updateCalendarEvent);
  const deleteCalendarEvent = useStore((s) => s.deleteCalendarEvent);

  const activeClassId = useStore((s) => s.ui.activeClassId);

  const [weekOffset, setWeekOffset] = useState(0);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null);

  // Add / Edit event dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(defaultFormState);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Attendance dialog state
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceClassId, setAttendanceClassId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>("");

  // Due day sheet state (Section A)
  const [dueDaySheetOpen, setDueDaySheetOpen] = useState(false);
  const [dueDayEvents, setDueDayEvents] = useState<CalendarEvent[]>([]);
  const [dueDayDate, setDueDayDate] = useState<Date | null>(null);

  // Overflow sheet state (Section B)
  const [overflowSheetOpen, setOverflowSheetOpen] = useState(false);
  const [overflowEvents, setOverflowEvents] = useState<CalendarEvent[]>([]);
  const [overflowDayDate, setOverflowDayDate] = useState<Date | null>(null);

  const openEventSheet = (event: CalendarEvent, dayDate: Date) => {
    setSelectedEvent(event);
    setSelectedEventDate(dayDate);
    setSheetOpen(true);
  };

  const updateForm = (updates: Partial<EventFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const openAddDialog = () => {
    setEditMode(false);
    setEditEventId(null);
    setForm({
      ...defaultFormState,
      date: format(new Date(), "yyyy-MM-dd"),
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

  // Section D: Rolling 5-day window
  const today = new Date();
  const baseDate = addDays(today, weekOffset * 5);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(baseDate, i));

  // Filter events for timetable: all non-all-day events
  // When a class is selected in the macro filter, show that class's events + all non-class events
  const timetableEvents = useMemo(() => {
    return calendarEvents.filter((e) => {
      // Exclude all-day events (they don't have time slots)
      if (e.isAllDay) return false;
      // Class filter: when a specific class is selected, only show matching class events + all non-class events
      if (activeClassId) {
        if (e.type === "class" && e.classId !== activeClassId) return false;
      }
      return true;
    });
  }, [calendarEvents, activeClassId]);

  // Section D: Place events into the timetable grid using date-string keys
  const grid = useMemo(() => {
    const result: Record<string, Record<string, CalendarEvent[]>> = {};
    weekDays.forEach((dayDate) => {
      const key = format(dayDate, "yyyy-MM-dd");
      result[key] = {};
      PERIODS.forEach((period) => {
        result[key][period.label] = [];
      });
    });

    timetableEvents.forEach((event) => {
      const eventDate = parseISO(event.startTime);
      const eventTime = format(eventDate, "HH:mm");

      weekDays.forEach((dayDate) => {
        const isOnDay =
          isSameDay(eventDate, dayDate) ||
          (event.recurrence === "weekly" && getDay(eventDate) === getDay(dayDate));
        if (!isOnDay) return;

        const dayKey = format(dayDate, "yyyy-MM-dd");
        for (const period of PERIODS) {
          if (period.isBreak && event.type === "class") continue;
          if (eventTime >= period.start && eventTime < period.end) {
            result[dayKey][period.label].push(event);
            break;
          }
        }
      });
    });

    return result;
  }, [timetableEvents, weekDays]);

  // Deadlines for the current week
  const weekDeadlines = useMemo(() => {
    const result: Record<number, CalendarEvent[]> = {};
    const deadlines = calendarEvents.filter((e) => {
      if (e.type !== "deadline") return false;
      if (activeClassId) {
        if (e.classId !== activeClassId) return false;
      }
      // Only show deadlines for published assessments
      if (e.linkedAssessmentId) {
        const linkedAsmt = assessments.find((a) => a.id === e.linkedAssessmentId);
        if (linkedAsmt && linkedAsmt.status !== "published") return false;
      }
      return true;
    });

    deadlines.forEach((event) => {
      const eventDate = parseISO(event.startTime);
      weekDays.forEach((dayDate, dayIndex) => {
        const isOnDay =
          isSameDay(eventDate, dayDate) ||
          (event.recurrence === "weekly" && getDay(eventDate) === getDay(dayDate));
        if (isOnDay) {
          if (!result[dayIndex]) result[dayIndex] = [];
          result[dayIndex].push(event);
        }
      });
    });

    return result;
  }, [calendarEvents, activeClassId, weekDays, assessments]);

  const hasWeekDeadlines = Object.values(weekDeadlines).some((d) => d.length > 0);

  // Open add event dialog pre-filled for a timetable slot
  const openAddDialogForSlot = (dayDate: Date, period: (typeof PERIODS)[number]) => {
    setEditMode(false);
    setEditEventId(null);
    setForm({
      ...defaultFormState,
      date: format(dayDate, "yyyy-MM-dd"),
      startTime: period.start,
      endTime: period.end,
    });
    setAddDialogOpen(true);
  };

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
        primaryAction={{
          label: "Add event",
          onClick: openAddDialog,
          icon: CalendarPlus,
        }}
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

      </div>

      {timetableEvents.length === 0 && !hasWeekDeadlines ? (
        <EmptyState
          icon={Clock}
          title="No timetable events"
          description="Class events will appear here. Create calendar events with type 'Class' to populate the timetable."
        />
      ) : timetableEvents.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-[13px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-3 py-1.5 font-medium text-muted-foreground w-20 sticky top-0 left-0 z-20 bg-background border-r">
                    Time
                  </th>
                  {weekDays.map((dayDate) => {
                    const isToday = isSameDay(dayDate, today);
                    return (
                      <th
                        key={format(dayDate, "yyyy-MM-dd")}
                        className={cn(
                          "text-left px-3 py-1.5 font-medium sticky top-0 z-10 bg-background",
                          isToday
                            ? "text-[#c24e3f] bg-[#fff2f0] border-l-2 border-l-[#c24e3f]"
                            : "text-muted-foreground"
                        )}
                      >
                        {isToday && (
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#c24e3f]">Today</div>
                        )}
                        <div>{format(dayDate, "EEE")}</div>
                        <div className="text-[11px] font-normal">
                          {format(dayDate, "MMM d")}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Due row — first body row */}
                {hasWeekDeadlines && (
                  <tr className="border-b bg-[#fee2e2]/10">
                    <td className="px-2 py-1 align-top sticky left-0 z-[5] bg-background border-r">
                      <div className="font-medium text-[12px] flex items-center gap-1 text-[#dc2626]">
                        <Target className="h-3 w-3 shrink-0" />
                        Due
                      </div>
                    </td>
                    {weekDays.map((dayDate, dayIdx) => {
                      const dayDeadlines = weekDeadlines[dayIdx] || [];
                      const visibleDeadlines = dayDeadlines.slice(0, 2);
                      const deadlineOverflow = dayDeadlines.length - 2;
                      return (
                        <td
                          key={format(dayDate, "yyyy-MM-dd") + "-due"}
                          className={cn(
                            "px-1.5 py-1 align-top",
                            isSameDay(dayDate, today) && "bg-[#fff2f0]/40"
                          )}
                        >
                          {visibleDeadlines.map((evt) => {
                            const dlClass = evt.classId ? getClassById(evt.classId) : null;
                            return (
                              <button
                                key={evt.id}
                                type="button"
                                onClick={() => openEventSheet(evt, dayDate)}
                                className="w-full text-left mb-0.5"
                              >
                                <div className="rounded bg-[#fee2e2] border border-[#dc2626]/20 px-1.5 py-0.5 hover:bg-[#fecaca] transition-colors cursor-pointer min-w-0">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span title={dlClass?.name || ""} className="shrink-0 flex">
                                      <BookOpen className="h-2.5 w-2.5 text-[#dc2626]" />
                                    </span>
                                    <span className="text-[11px] font-medium text-[#dc2626] truncate">{evt.title}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {deadlineOverflow > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setDueDaySheetOpen(true);
                                setDueDayEvents(dayDeadlines);
                                setDueDayDate(dayDate);
                              }}
                              className="text-[10px] text-[#dc2626]/70 hover:underline cursor-pointer mt-0.5"
                            >
                              +{deadlineOverflow} more
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )}
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
                      <td className="px-2 py-1 align-top sticky left-0 z-[5] bg-background border-r">
                        <div className="font-medium text-[12px]">{period.label}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {period.start}–{period.end}
                        </div>
                      </td>
                      {weekDays.map((dayDate, dayIdx) => {
                        const dayKey = format(dayDate, "yyyy-MM-dd");
                        const cellEvents = grid[dayKey]?.[period.label] || [];
                        const visible = cellEvents.slice(0, 2);
                        const overflow = cellEvents.length - 2;

                        return (
                          <td
                            key={dayKey}
                            className={cn(
                              "px-1.5 py-1 align-top min-h-[36px] cursor-pointer hover:bg-muted/30 transition-colors",
                              isSameDay(dayDate, today) && "bg-[#fff2f0]/40"
                            )}
                            onClick={() => openAddDialogForSlot(dayDate, period)}
                          >
                            {visible.map((event, evtIdx) => {
                              const cls = event.classId
                                ? getClassById(event.classId)
                                : null;
                              const isClassEvent = event.type === "class";
                              const style = !isClassEvent ? NON_CLASS_STYLES[event.type] : null;
                              const Icon = !isClassEvent ? NON_CLASS_ICONS[event.type] : null;

                              if (isClassEvent) {
                                const cellDateStr = format(dayDate, "yyyy-MM-dd");
                                const cellAttTaken = event.classId
                                  ? attendanceSessions.some(
                                      (s) => s.classId === event.classId && s.date === cellDateStr
                                    )
                                  : false;
                                return (
                                  <button
                                    key={`${event.id}-${evtIdx}`}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openEventSheet(event, dayDate); }}
                                    className="w-full text-left"
                                  >
                                    <div className="rounded-md bg-[#fff2f0] border border-[#c24e3f]/20 px-1.5 py-1 mb-1 hover:bg-[#ffe8e5] transition-colors cursor-pointer min-w-0">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span className="font-medium text-[12px] text-[#c24e3f] truncate flex-1 min-w-0">
                                          {cls?.name || event.title}
                                        </span>
                                        {cellAttTaken && (
                                          <CheckCircle2 className="h-3 w-3 text-[#16a34a] shrink-0" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 min-w-0">
                                        {cls && (
                                          <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {cls.studentIds.length}
                                          </span>
                                        )}
                                        {event.room && (
                                          <span className="flex items-center gap-0.5 truncate">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            {event.room}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  key={`${event.id}-${evtIdx}`}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openEventSheet(event, dayDate); }}
                                  className="w-full text-left"
                                >
                                  <div className={cn(
                                    "rounded-md border px-1.5 py-1 mb-1 hover:opacity-80 transition-colors cursor-pointer min-w-0",
                                    style?.bg,
                                    style?.border
                                  )}>
                                    <div className={cn("font-medium text-[12px] truncate flex items-center gap-1 min-w-0", style?.text)}>
                                      {Icon && <Icon className="h-3 w-3 shrink-0" />}
                                      <span className="truncate">{event.title}</span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                      {format(parseISO(event.startTime), "h:mm a")}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                            {overflow > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOverflowSheetOpen(true);
                                  setOverflowEvents(cellEvents);
                                  setOverflowDayDate(dayDate);
                                }}
                                className="text-[10px] text-muted-foreground hover:underline cursor-pointer mt-0.5"
                              >
                                +{overflow} more
                              </button>
                            )}
                            {isBreak && cellEvents.length === 0 && dayIdx === 0 && (
                              <span className="text-[11px] text-muted-foreground italic">
                                {period.label}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {/* Due Day Sheet (Section A) */}
      <Sheet open={dueDaySheetOpen} onOpenChange={setDueDaySheetOpen}>
        <SheetContent className="sm:max-w-[380px]">
          <SheetHeader>
            <SheetTitle>Due {dueDayDate ? format(dueDayDate, "EEEE, MMM d") : ""}</SheetTitle>
            <SheetDescription>{dueDayEvents.length} item{dueDayEvents.length !== 1 ? "s" : ""} due</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {dueDayEvents.map((evt) => (
              <button
                key={evt.id}
                type="button"
                onClick={() => {
                  setDueDaySheetOpen(false);
                  openEventSheet(evt, dueDayDate!);
                }}
                className="w-full text-left rounded-md border border-[#dc2626]/20 bg-[#fee2e2] px-3 py-2 hover:bg-[#fecaca] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-[#dc2626] shrink-0" />
                  <span className="text-[13px] font-medium text-[#dc2626] truncate">{evt.title}</span>
                </div>
                {evt.classId && (() => {
                  const cls = getClassById(evt.classId);
                  return cls ? <div className="text-[11px] text-muted-foreground mt-0.5 ml-[22px]">{cls.name}</div> : null;
                })()}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Overflow Sheet (Section B) */}
      <Sheet open={overflowSheetOpen} onOpenChange={setOverflowSheetOpen}>
        <SheetContent className="sm:max-w-[380px]">
          <SheetHeader>
            <SheetTitle>Events</SheetTitle>
            <SheetDescription>
              {overflowDayDate ? format(overflowDayDate, "EEEE, MMM d") : ""} · {overflowEvents.length} events
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {overflowEvents.map((evt) => {
              const cls = evt.classId ? getClassById(evt.classId) : null;
              const isClassEvent = evt.type === "class";
              const style = !isClassEvent ? NON_CLASS_STYLES[evt.type] : null;
              const Icon = !isClassEvent ? NON_CLASS_ICONS[evt.type] : null;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => {
                    setOverflowSheetOpen(false);
                    openEventSheet(evt, overflowDayDate!);
                  }}
                  className={cn(
                    "w-full text-left rounded-md border px-3 py-2 hover:opacity-80 transition-colors",
                    isClassEvent ? "border-[#c24e3f]/20 bg-[#fff2f0]" : cn(style?.border, style?.bg)
                  )}
                >
                  <div className={cn("flex items-center gap-2 text-[13px] font-medium", isClassEvent ? "text-[#c24e3f]" : style?.text)}>
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{isClassEvent ? (cls?.name || evt.title) : evt.title}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {format(parseISO(evt.startTime), "h:mm a")} – {format(parseISO(evt.endTime), "h:mm a")}
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Unified Event Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[420px]">
          {selectedEvent && (() => {
            const isClassEvent = selectedEvent.type === "class";
            const cls = selectedEvent.classId ? getClassById(selectedEvent.classId) : null;
            const style = NON_CLASS_STYLES[selectedEvent.type];
            const SheetIcon = NON_CLASS_ICONS[selectedEvent.type];
            const typeLabel = selectedEvent.type === "video_call" ? "Video Call"
              : selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1);

            // Check attendance status for class events
            const attendanceDateStr = selectedEventDate ? format(selectedEventDate, "yyyy-MM-dd") : null;
            const attendanceTaken = isClassEvent && selectedEvent.classId && attendanceDateStr
              ? attendanceSessions.some(
                  (s) => s.classId === selectedEvent.classId && s.date === attendanceDateStr
                )
              : false;

            if (isClassEvent) {
              return (
                <>
                  <SheetHeader>
                    <SheetTitle className="text-[18px]">{cls?.name || selectedEvent.title}</SheetTitle>
                    <SheetDescription>
                      <Badge
                        variant="outline"
                        className="text-[11px] border-transparent bg-[#dbeafe] text-[#2563eb]"
                      >
                        Class
                      </Badge>
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-3">
                      {selectedEventDate && (
                        <div className="flex items-center gap-3 text-[13px]">
                          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{format(selectedEventDate, "EEEE, MMMM d, yyyy")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[13px]">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>
                          {format(parseISO(selectedEvent.startTime), "h:mm a")} –{" "}
                          {format(parseISO(selectedEvent.endTime), "h:mm a")}
                        </span>
                      </div>
                      {selectedEvent.room && (
                        <div className="flex items-center gap-3 text-[13px]">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{selectedEvent.room}</span>
                        </div>
                      )}
                      {cls && (
                        <div className="flex items-center gap-3 text-[13px]">
                          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{cls.studentIds.length} students</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[13px]">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        {attendanceTaken ? (
                          <Badge variant="outline" className="text-[11px] bg-[#dcfce7] text-[#16a34a] border-transparent">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Taken
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not taken</span>
                        )}
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

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedEvent.classId && attendanceDateStr) {
                            setAttendanceClassId(selectedEvent.classId);
                            setAttendanceDate(attendanceDateStr);
                            setAttendanceDialogOpen(true);
                          }
                        }}
                      >
                        {attendanceTaken ? (
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
                      {selectedEvent.classId && (
                        <Link
                          href={`/classes/${selectedEvent.classId}`}
                          className="inline-flex items-center gap-1.5 text-[13px] text-[#c24e3f] hover:underline"
                          onClick={() => setSheetOpen(false)}
                        >
                          View class
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              );
            }

            // Non-class event detail
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
                      {SheetIcon && <SheetIcon className="h-3 w-3 mr-1" />}
                      {typeLabel}
                    </Badge>
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div className="space-y-3">
                    {selectedEventDate && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{format(selectedEventDate, "EEEE, MMMM d, yyyy")}</span>
                      </div>
                    )}
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
                    {selectedEvent.linkedAssessmentId && (() => {
                      const a = assessments.find((x) => x.id === selectedEvent.linkedAssessmentId);
                      return a ? (
                        <div className="flex items-center gap-3 text-[13px]">
                          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Link
                            href={`/assessments/${a.id}`}
                            className="text-[#c24e3f] hover:underline"
                            onClick={() => setSheetOpen(false)}
                          >
                            Assessment: {a.title}
                          </Link>
                        </div>
                      ) : null;
                    })()}
                    {selectedEvent.linkedReportCycleId && (() => {
                      const rc = reportCycles.find((x) => x.id === selectedEvent.linkedReportCycleId);
                      return rc ? (
                        <div className="flex items-center gap-3 text-[13px]">
                          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>Report cycle: {rc.name}</span>
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

                  {selectedEvent.linkedAssessmentId && (() => {
                    const linkedAsmt = assessments.find((x) => x.id === selectedEvent.linkedAssessmentId);
                    return linkedAsmt ? (
                      <Link
                        href={`/assessments/${linkedAsmt.id}`}
                        onClick={() => setSheetOpen(false)}
                        className="inline-flex items-center justify-center gap-2 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] font-medium text-[#c24e3f] hover:bg-muted transition-colors"
                      >
                        Open assessment
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null;
                  })()}
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
                  const RsvpIcon = opt.icon;
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
                      <RsvpIcon className="h-3.5 w-3.5" />
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
