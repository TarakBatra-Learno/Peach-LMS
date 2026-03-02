"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
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

  // Read URL params for timetable deep-link
  const urlClassId = searchParams.get("classId");
  const urlDate = searchParams.get("date");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("register");

  // Register form state — sync with global class switcher or URL params
  const [selectedClassId, setSelectedClassId] = useState<string>(urlClassId || activeClassId || "");
  const [selectedDate, setSelectedDate] = useState(urlDate || format(new Date(), "yyyy-MM-dd"));
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return getStudentsByClassId(selectedClassId);
  }, [selectedClassId, getStudentsByClassId]);

  // Initialize records when class changes
  const applyClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const studs = getStudentsByClassId(classId);
    const defaultRecords: Record<string, AttendanceStatus> = {};
    studs.forEach((s) => {
      defaultRecords[s.id] = "present";
    });
    setRecords(defaultRecords);
    setNotes({});
    setIsDirty(false);
  };

  const handleClassChange = (classId: string) => {
    if (isDirty) {
      setPendingClassId(classId);
      setDiscardConfirmOpen(true);
      return;
    }
    applyClassChange(classId);
  };

  // Sync with global class switcher
  useEffect(() => {
    if (activeClassId && activeClassId !== selectedClassId) {
      handleClassChange(activeClassId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClassId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
    setIsDirty(true);
  };

  const handleCompleteSession = () => {
    if (!selectedClassId) {
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
      classId: selectedClassId,
      date: selectedDate,
      records: attendanceRecords,
      completedAt: new Date().toISOString(),
    });

    toast.success("Attendance session recorded");
    setDialogOpen(false);
    setSelectedClassId("");
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
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Class
                </Label>
                <Select value={selectedClassId} onValueChange={handleClassChange}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[180px]">
                <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Date
                </Label>
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
            </div>

            {selectedClassId && classStudents.length > 0 && (
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

            {selectedClassId && classStudents.length === 0 && (
              <p className="text-[13px] text-muted-foreground text-center py-8">
                No students enrolled in this class.
              </p>
            )}

            {!selectedClassId && (
              <p className="text-[13px] text-muted-foreground text-center py-8">
                Select a class to begin taking attendance.
              </p>
            )}
          </Card>

          {/* Recent sessions */}
          <div>
            <h2 className="text-[16px] font-semibold mb-3">Recent sessions</h2>
            {recentSessions.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No attendance sessions"
                description="Take attendance for a class to see sessions here."
                action={{
                  label: "Take attendance",
                  onClick: () => {
                    if (classes.length > 0) {
                      handleClassChange(classes[0].id);
                    }
                  },
                }}
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Take attendance</DialogTitle>
            <DialogDescription>
              Select a class and mark attendance for each student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[13px]">Class</Label>
                <Select value={selectedClassId} onValueChange={handleClassChange}>
                  <SelectTrigger className="mt-1.5 h-9 text-[13px]">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[13px]">Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1.5 h-9 text-[13px]"
                />
              </div>
            </div>

            {selectedClassId && classStudents.length > 0 && (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {classStudents.map((student) => {
                  const dlgStatus = records[student.id] || "present";
                  const dlgShowNote = dlgStatus !== "present";
                  return (
                  <div
                    key={student.id}
                    className="py-2 px-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium">
                        {student.firstName} {student.lastName}
                      </span>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((opt) => {
                          const isActive = dlgStatus === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(student.id, opt.value)}
                              className={cn(
                                "px-2 py-1 rounded text-[11px] font-medium transition-all border",
                                isActive && opt.value === "present" && "bg-[#dcfce7] text-[#16a34a] border-[#16a34a]/30",
                                isActive && opt.value === "absent" && "bg-[#fee2e2] text-[#dc2626] border-[#dc2626]/30",
                                isActive && opt.value === "late" && "bg-[#fef3c7] text-[#b45309] border-[#b45309]/30",
                                isActive && opt.value === "excused" && "bg-[#dbeafe] text-[#2563eb] border-[#2563eb]/30",
                                !isActive && "bg-background text-muted-foreground border-border hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {dlgShowNote && (
                      <div className="mt-1.5 ml-0">
                        <Input
                          value={notes[student.id] || ""}
                          onChange={(e) => { setNotes((prev) => ({ ...prev, [student.id]: e.target.value })); setIsDirty(true); }}
                          placeholder={`Reason for ${dlgStatus}...`}
                          className="h-7 text-[11px]"
                        />
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteSession} disabled={!selectedClassId}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Complete session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
