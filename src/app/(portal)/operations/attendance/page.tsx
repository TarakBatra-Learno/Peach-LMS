"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OperationsTabs } from "@/components/shared/operations-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { generateId } from "@/services/mock-service";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AttendanceDialog } from "@/components/shared/attendance-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { format, parseISO, getDay, addDays, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ClipboardCheck,
  Users,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type { AttendanceRecord } from "@/types/attendance";
import type { AttendanceStatus } from "@/types/common";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "present", label: "Present", icon: CheckCircle2 },
  { value: "absent", label: "Absent", icon: XCircle },
  { value: "late", label: "Late", icon: Clock },
  { value: "excused", label: "Excused", icon: ShieldCheck },
];

const DAY_MAP: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };
const DAY_LABELS: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri" };

interface ScheduledSession {
  date: string; // yyyy-MM-dd
  dayLabel: string;
  startTime: string;
  endTime: string;
  room?: string;
  taken: boolean;
}

export default function AttendancePage() {
  const loading = useMockLoading();
  const searchParams = useSearchParams();
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const attendanceSessions = useStore((s) => s.attendanceSessions);
  const addAttendanceSession = useStore((s) => s.addAttendanceSession);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const getClassById = useStore((s) => s.getClassById);

  const activeClassId = useStore((s) => s.ui.activeClassId);
  const setActiveClass = useStore((s) => s.setActiveClass);

  // Read URL params for timetable deep-link
  const urlClassId = searchParams.get("classId");
  const urlDate = searchParams.get("date");

  // Sync URL classId into macro filter (idempotent + validated)
  useEffect(() => {
    if (urlClassId && urlClassId !== activeClassId && classes.some((c) => c.id === urlClassId)) {
      setActiveClass(urlClassId);
    }
  }, [urlClassId, activeClassId, classes, setActiveClass]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("register");

  // Register form state
  const [selectedDate, setSelectedDate] = useState(urlDate || format(new Date(), "yyyy-MM-dd"));
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);
  const [useCustomDate, setUseCustomDate] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === activeClassId),
    [classes, activeClassId]
  );

  // Generate scheduled sessions for the selected class
  const scheduledSessions = useMemo((): ScheduledSession[] => {
    if (!selectedClass) return [];
    const today = new Date();
    const sessions: ScheduledSession[] = [];

    // Look back 7 days and forward 21 days
    for (let d = -7; d <= 21; d++) {
      const date = d < 0 ? subDays(today, Math.abs(d)) : addDays(today, d);
      const jsDay = getDay(date); // 0=Sun, 1=Mon...
      const dateStr = format(date, "yyyy-MM-dd");

      for (const slot of selectedClass.schedule) {
        const slotDay = DAY_MAP[slot.day];
        if (slotDay === jsDay) {
          const taken = attendanceSessions.some(
            (s) => s.classId === activeClassId && s.date === dateStr
          );
          sessions.push({
            date: dateStr,
            dayLabel: DAY_LABELS[slot.day] || slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room,
            taken,
          });
        }
      }
    }

    return sessions;
  }, [selectedClass, activeClassId, attendanceSessions]);

  const classStudents = useMemo(() => {
    if (!activeClassId) return [];
    return getStudentsByClassId(activeClassId);
  }, [activeClassId, getStudentsByClassId]);

  // Initialize records when class changes
  const applyClassChange = (classId: string) => {
    setActiveClass(classId);
    setUseCustomDate(false);
    const studs = getStudentsByClassId(classId);
    const defaultRecords: Record<string, AttendanceStatus> = {};
    studs.forEach((s) => {
      defaultRecords[s.id] = "present";
    });
    setRecords(defaultRecords);
    setNotes({});
    setIsDirty(false);
  };

  // When activeClassId changes (TopBar switch), reset form state
  const prevClassRef = useRef(activeClassId);
  useEffect(() => {
    if (activeClassId && activeClassId !== prevClassRef.current) {
      if (isDirty) {
        setPendingClassId(activeClassId);
        setDiscardConfirmOpen(true);
      } else {
        // Reset form state for the new class
        setUseCustomDate(false);
        const studs = getStudentsByClassId(activeClassId);
        const defaultRecords: Record<string, AttendanceStatus> = {};
        studs.forEach((s) => {
          defaultRecords[s.id] = "present";
        });
        setRecords(defaultRecords);
        setNotes({});
        setIsDirty(false);
      }
    }
    prevClassRef.current = activeClassId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClassId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
    setIsDirty(true);
  };

  // Schedule validation — warn if selected date doesn't match class schedule (custom date mode only)
  const scheduleWarning = useMemo(() => {
    if (!useCustomDate) return null;
    if (!activeClassId || !selectedDate) return null;
    const cls = getClassById(activeClassId);
    if (!cls || !cls.schedule || cls.schedule.length === 0) return null;
    const date = new Date(selectedDate + "T12:00:00");
    const jsDay = getDay(date);
    const matchesSchedule = cls.schedule.some((slot) => DAY_MAP[slot.day] === jsDay);
    if (matchesSchedule) return null;
    const scheduleDays = cls.schedule.map((s) => DAY_LABELS[s.day] || s.day).join(", ");
    return `No lesson scheduled for this date. This class meets on ${scheduleDays}.`;
  }, [useCustomDate, activeClassId, selectedDate, getClassById]);

  // Auto-select session: URL date → today → next upcoming untaken
  useEffect(() => {
    if (!activeClassId || scheduledSessions.length === 0) return;
    if (useCustomDate) return;

    // If URL has a date param that matches a session, select it
    if (urlDate) {
      const match = scheduledSessions.find((s) => s.date === urlDate);
      if (match) {
        setSelectedDate(urlDate);
        return;
      }
    }

    // Try today
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayMatch = scheduledSessions.find((s) => s.date === todayStr);
    if (todayMatch) {
      setSelectedDate(todayStr);
      return;
    }

    // Next upcoming untaken
    const upcoming = scheduledSessions.find((s) => s.date >= todayStr && !s.taken);
    if (upcoming) {
      setSelectedDate(upcoming.date);
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClassId, scheduledSessions]);

  const handleCompleteSession = () => {
    if (!activeClassId) {
      toast.error("Please select a class");
      return;
    }
    if (classStudents.length === 0) {
      toast.error("No students in this class");
      return;
    }

    const attendanceRecords: AttendanceRecord[] = classStudents.map((s) => ({
      studentId: s.id,
      status: records[s.id] || "present",
      arrivedAt: records[s.id] === "late" ? format(new Date(), "HH:mm") : undefined,
      note: notes[s.id]?.trim() || undefined,
    }));

    addAttendanceSession({
      id: generateId("att"),
      classId: activeClassId,
      date: selectedDate,
      records: attendanceRecords,
      completedAt: new Date().toISOString(),
    });

    toast.success("Attendance session recorded");
    setDialogOpen(false);
    setRecords({});
    setNotes({});
    setIsDirty(false);
  };

  // Analytics calculations
  const analytics = useMemo(() => {
    const allRecords = attendanceSessions.flatMap((s) => s.records);
    const total = allRecords.length;
    const present = allRecords.filter((r) => r.status === "present").length;
    const late = allRecords.filter((r) => r.status === "late").length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    const uniqueClasses = new Set(attendanceSessions.map((s) => s.classId)).size;
    const uniqueStudents = new Set(allRecords.map((r) => r.studentId)).size;

    return {
      rate,
      totalSessions: attendanceSessions.length,
      classesTracked: uniqueClasses,
      totalStudents: uniqueStudents,
      totalRecords: total,
      presentCount: present,
      absentCount: allRecords.filter((r) => r.status === "absent").length,
      lateCount: late,
      excusedCount: allRecords.filter((r) => r.status === "excused").length,
    };
  }, [attendanceSessions]);

  // Trend data: attendance % per session sorted by date asc
  const trendData = useMemo(() => {
    return [...attendanceSessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20)
      .map((session) => {
        const total = session.records.length;
        const presentOrLate = session.records.filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;
        const rate = total > 0 ? Math.round((presentOrLate / total) * 100) : 0;
        const cls = getClassById(session.classId);
        return {
          date: format(parseISO(session.date), "MMM d"),
          rate,
          className: cls?.name || "Unknown",
        };
      });
  }, [attendanceSessions, getClassById]);

  // Exception flags: students with attendance < 85%
  const exceptionStudents = useMemo(() => {
    const studentMap: Record<string, { total: number; presentOrLate: number; absent: number }> = {};
    attendanceSessions.forEach((session) => {
      session.records.forEach((r) => {
        if (!studentMap[r.studentId]) {
          studentMap[r.studentId] = { total: 0, presentOrLate: 0, absent: 0 };
        }
        studentMap[r.studentId].total += 1;
        if (r.status === "present" || r.status === "late") {
          studentMap[r.studentId].presentOrLate += 1;
        }
        if (r.status === "absent") {
          studentMap[r.studentId].absent += 1;
        }
      });
    });

    return Object.entries(studentMap)
      .map(([studentId, data]) => {
        const rate = data.total > 0 ? Math.round((data.presentOrLate / data.total) * 100) : 100;
        const student = students.find((s) => s.id === studentId);
        return {
          studentId,
          name: student ? `${student.firstName} ${student.lastName}` : "Unknown",
          rate,
          absences: data.absent,
          total: data.total,
        };
      })
      .filter((s) => s.rate < 85)
      .sort((a, b) => a.rate - b.rate);
  }, [attendanceSessions, students]);

  // Recent sessions sorted by date desc
  const recentSessions = useMemo(() => {
    return [...attendanceSessions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);
  }, [attendanceSessions]);

  if (loading) {
    return (
      <div>
        <OperationsTabs />
        <PageHeader title="Attendance" />
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div>
      <OperationsTabs />
      <PageHeader
        title="Attendance"
        description="Track and manage student attendance across your classes"
        primaryAction={{
          label: "Take attendance",
          onClick: () => setDialogOpen(true),
          icon: ClipboardCheck,
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="register" className="text-[13px]">
            <ClipboardCheck className="h-4 w-4 mr-1.5" />
            Register
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-[13px]">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          {/* Quick take attendance inline */}
          <Card className="p-5 gap-0">
            <div className="space-y-4 mb-4">
              {/* Session picker */}
              {activeClassId && !useCustomDate && (
                <div className="w-[280px]">
                  <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Session
                  </Label>
                  <div className="space-y-1 max-h-[180px] overflow-y-auto rounded-md border border-input p-1">
                    {scheduledSessions.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground px-2 py-3 text-center">
                        No scheduled sessions found.
                      </p>
                    ) : (
                      scheduledSessions.map((session) => {
                        const isSelected = selectedDate === session.date;
                        const isToday = session.date === format(new Date(), "yyyy-MM-dd");
                        return (
                          <button
                            key={session.date}
                            type="button"
                            onClick={() => { setSelectedDate(session.date); setIsDirty(false); }}
                            disabled={session.taken}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors text-left",
                              isSelected && !session.taken && "bg-[#fff2f0] border border-[#c24e3f]/30",
                              !isSelected && !session.taken && "hover:bg-muted/50",
                              session.taken && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium">
                                {session.dayLabel} {format(new Date(session.date + "T12:00:00"), "d MMM")}
                              </span>
                              <span className="text-muted-foreground">
                                {session.startTime}–{session.endTime}
                              </span>
                              {session.room && (
                                <span className="text-muted-foreground">({session.room})</span>
                              )}
                              {isToday && (
                                <span className="text-[10px] font-semibold text-[#c24e3f] uppercase">Today</span>
                              )}
                            </div>
                            {session.taken && (
                              <span className="flex items-center gap-1 text-[11px] text-[#16a34a] font-medium shrink-0">
                                <CheckCircle2 className="h-3 w-3" />
                                Taken
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseCustomDate(true)}
                    className="mt-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    Custom date
                  </button>
                </div>
              )}

              {/* Custom date fallback */}
              {activeClassId && useCustomDate && (
                <div className="w-[180px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                      Date
                    </Label>
                    <button
                      type="button"
                      onClick={() => setUseCustomDate(false)}
                      className="text-[12px] text-muted-foreground hover:text-foreground transition-colors underline"
                    >
                      Back to sessions
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-9 text-[13px]"
                    />
                    {selectedDate === format(new Date(), "yyyy-MM-dd") && (
                      <Badge variant="default" className="text-[10px] shrink-0">Today</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {scheduleWarning && activeClassId && useCustomDate && (
              <div className="flex items-start gap-2 rounded-md bg-[#fef3c7] border border-[#b45309]/20 px-3 py-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-[#b45309] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#b45309]">{scheduleWarning}</p>
              </div>
            )}

            {activeClassId && classStudents.length > 0 && (
              <>
                <Separator className="mb-4" />
                <div className="space-y-2">
                  {classStudents.map((student) => {
                    const currentStatus = records[student.id] || "present";
                    const showNote = currentStatus !== "present";
                    return (
                    <div
                      key={student.id}
                      className="py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[12px] font-medium text-muted-foreground shrink-0">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <span className="text-[14px] font-medium truncate">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {STATUS_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = currentStatus === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(student.id, opt.value)}
                                className={cn(
                                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all border",
                                  isActive && opt.value === "present" && "bg-[#dcfce7] text-[#16a34a] border-[#16a34a]/30",
                                  isActive && opt.value === "absent" && "bg-[#fee2e2] text-[#dc2626] border-[#dc2626]/30",
                                  isActive && opt.value === "late" && "bg-[#fef3c7] text-[#b45309] border-[#b45309]/30",
                                  isActive && opt.value === "excused" && "bg-[#dbeafe] text-[#2563eb] border-[#2563eb]/30",
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
                      {showNote && (
                        <div className="ml-11 mt-1.5">
                          <Input
                            value={notes[student.id] || ""}
                            onChange={(e) => { setNotes((prev) => ({ ...prev, [student.id]: e.target.value })); setIsDirty(true); }}
                            placeholder={`Reason for ${currentStatus}...`}
                            className="h-7 text-[12px] max-w-[320px]"
                          />
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-3 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16a34a]" />
                      {Object.values(records).filter((s) => s === "present").length} present
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-[#dc2626]" />
                      {Object.values(records).filter((s) => s === "absent").length} absent
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#b45309]" />
                      {Object.values(records).filter((s) => s === "late").length} late
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#2563eb]" />
                      {Object.values(records).filter((s) => s === "excused").length} excused
                    </span>
                  </div>
                  <Button size="sm" onClick={handleCompleteSession}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Complete session
                  </Button>
                </div>
              </>
            )}

            {activeClassId && classStudents.length === 0 && (
              <p className="text-[13px] text-muted-foreground text-center py-8">
                No students enrolled in this class.
              </p>
            )}

            {!activeClassId && (
              <EmptyState
                icon={ClipboardCheck}
                title="Select a class"
                description="Choose a class from the top bar to take attendance."
              />
            )}
          </Card>

          {/* Recent sessions */}
          <div>
            <h2 className="text-[16px] font-semibold mb-3">Recent sessions</h2>
            {recentSessions.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No attendance sessions"
                description="Select a class from the top bar and take attendance to see sessions here."
              />
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session) => {
                  const cls = getClassById(session.classId);
                  const presentCount = session.records.filter(
                    (r) => r.status === "present"
                  ).length;
                  const absentCount = session.records.filter(
                    (r) => r.status === "absent"
                  ).length;
                  const lateCount = session.records.filter(
                    (r) => r.status === "late"
                  ).length;
                  const excusedCount = session.records.filter(
                    (r) => r.status === "excused"
                  ).length;
                  const total = session.records.length;
                  const attendanceRate =
                    total > 0
                      ? Math.round(((presentCount + lateCount) / total) * 100)
                      : 0;

                  return (
                    <Card
                      key={session.id}
                      className="p-4 gap-0 flex flex-row items-center justify-between"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="rounded-lg bg-muted p-2 shrink-0">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-medium">
                              {cls?.name || "Unknown class"}
                            </span>
                            <Badge variant="outline" className="text-[11px]">
                              {format(parseISO(session.date), "MMM d, yyyy")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground">
                            <span>{total} students</span>
                            <span className="text-[#16a34a]">{presentCount} present</span>
                            <span className="text-[#dc2626]">{absentCount} absent</span>
                            {lateCount > 0 && (
                              <span className="text-[#b45309]">{lateCount} late</span>
                            )}
                            {excusedCount > 0 && (
                              <span className="text-[#2563eb]">{excusedCount} excused</span>
                            )}
                          </div>
                          {/* Show notes for non-present students */}
                          {session.records.filter((r) => r.note).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {session.records.filter((r) => r.note).map((r) => {
                                const stu = students.find((s) => s.id === r.studentId);
                                return (
                                  <p key={r.studentId} className="text-[11px] text-muted-foreground italic">
                                    <Link
                                      href={`/students/${r.studentId}?classId=${session.classId}`}
                                      className="text-[#c24e3f] hover:underline not-italic font-medium"
                                    >
                                      {stu ? `${stu.firstName} ${stu.lastName}` : "Student"}
                                    </Link>
                                    : {r.note}
                                  </p>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "text-[13px] font-semibold",
                            attendanceRate >= 90
                              ? "text-[#16a34a]"
                              : attendanceRate >= 75
                                ? "text-[#b45309]"
                                : "text-[#dc2626]"
                          )}
                        >
                          {attendanceRate}%
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Attendance rate"
              value={`${analytics.rate}%`}
              icon={BarChart3}
              trend={
                analytics.rate >= 90
                  ? { direction: "up", label: "Good standing" }
                  : analytics.rate >= 75
                    ? { direction: "flat", label: "Needs attention" }
                    : { direction: "down", label: "Requires action" }
              }
            />
            <StatCard
              label="Total sessions"
              value={analytics.totalSessions}
              icon={ClipboardCheck}
            />
            <StatCard
              label="Classes tracked"
              value={analytics.classesTracked}
              icon={Users}
            />
            <StatCard
              label="Students tracked"
              value={analytics.totalStudents ?? 0}
              icon={Users}
            />
          </div>

          {/* Recharts trend chart */}
          {trendData.length > 1 && (
            <Card className="p-5 gap-0">
              <h3 className="text-[14px] font-semibold mb-4">Attendance trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, "Attendance"]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#c24e3f"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#c24e3f" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {analytics.totalRecords > 0 && (
            <Card className="p-5 gap-0">
              <h3 className="text-[14px] font-semibold mb-1">Status breakdown</h3>
              <p className="text-[12px] text-muted-foreground mb-4">
                Across {analytics.totalSessions} session{analytics.totalSessions !== 1 ? "s" : ""}{" "}
                with {analytics.classesTracked} class{analytics.classesTracked !== 1 ? "es" : ""}{" "}
                ({analytics.totalRecords} total records)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Present", count: analytics.presentCount, bg: "bg-[#dcfce7]/50", color: "text-[#16a34a]", Icon: CheckCircle2 },
                  { label: "Absent", count: analytics.absentCount, bg: "bg-[#fee2e2]/50", color: "text-[#dc2626]", Icon: XCircle },
                  { label: "Late", count: analytics.lateCount, bg: "bg-[#fef3c7]/50", color: "text-[#b45309]", Icon: Clock },
                  { label: "Excused", count: analytics.excusedCount, bg: "bg-[#dbeafe]/50", color: "text-[#2563eb]", Icon: ShieldCheck },
                ].map((item) => {
                  const pct = analytics.totalRecords > 0
                    ? Math.round((item.count / analytics.totalRecords) * 100)
                    : 0;
                  return (
                    <div key={item.label} className={`p-4 rounded-lg ${item.bg}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <item.Icon className={`h-4 w-4 ${item.color}`} />
                        <span className="text-[12px] text-muted-foreground">{item.label}</span>
                      </div>
                      <div className={`text-[20px] font-semibold ${item.color}`}>
                        {item.count}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {pct}% of all records
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Exception flags */}
          {exceptionStudents.length > 0 && (
            <Card className="p-5 gap-0">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-[#b45309]" />
                <h3 className="text-[14px] font-semibold">Attendance exceptions</h3>
                <Badge variant="outline" className="text-[11px]">
                  {exceptionStudents.length} student{exceptionStudents.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {exceptionStudents.map((s) => (
                  <div
                    key={s.studentId}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          s.rate < 70 ? "bg-[#dc2626]" : "bg-[#f59e0b]"
                        )}
                      />
                      <Link
                        href={`/students/${s.studentId}`}
                        className="text-[13px] font-medium text-[#c24e3f] hover:underline truncate"
                      >
                        {s.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span
                        className={cn(
                          "text-[13px] font-semibold",
                          s.rate < 70 ? "text-[#dc2626]" : "text-[#b45309]"
                        )}
                      >
                        {s.rate}%
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {s.absences} absence{s.absences !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {analytics.totalSessions === 0 && (
            <EmptyState
              icon={BarChart3}
              title="No analytics data"
              description="Start recording attendance sessions to see analytics and trends."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Take Attendance Dialog */}
      <AttendanceDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <ConfirmDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title="Discard unsaved changes?"
        description="You have unsaved attendance changes. Switching classes will discard them."
        confirmLabel="Discard"
        onConfirm={() => {
          if (pendingClassId) {
            applyClassChange(pendingClassId);
            setPendingClassId(null);
          }
        }}
        destructive
      />
    </div>
  );
}
