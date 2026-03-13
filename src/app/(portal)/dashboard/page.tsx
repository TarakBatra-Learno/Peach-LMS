"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { DashboardSkeleton } from "@/components/shared/skeleton-loader";
import { TEACHER } from "@/lib/constants";
import {
  ClipboardCheck,
  Users,
  FolderOpen,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
  Megaphone,
  FileText,
  Image as ImageIcon,
  MapPin,
  Handshake,
  Video,
  Target,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { PERIODS } from "@/lib/timetable-constants";
import { expandEventsForDate, getPeriodStatus } from "@/lib/calendar-utils";
import { getToMarkCount, isGradeComplete } from "@/lib/grade-helpers";
import { getDemoNow } from "@/lib/demo-time";

export default function DashboardPage() {
  const router = useRouter();
  const loading = useMockLoading();
  const assessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const students = useStore((s) => s.students);
  const artifacts = useStore((s) => s.artifacts);
  const incidents = useStore((s) => s.incidents);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const attendanceSessions = useStore((s) => s.attendanceSessions);
  const classes = useStore((s) => s.classes);
  const announcements = useStore((s) => s.announcements);
  const channels = useStore((s) => s.channels);
  const reportCycles = useStore((s) => s.reportCycles);
  const reports = useStore((s) => s.reports);

  const activeClassId = useStore((s) => s.ui.activeClassId);

  // Build set of student IDs for the active class (or all students)
  const classStudentIds = useMemo(() => {
    if (!activeClassId) return null; // null means "all"
    const cls = classes.find((c) => c.id === activeClassId);
    return cls ? new Set(cls.studentIds) : null;
  }, [activeClassId, classes]);

  const today = getDemoNow();
  const todayStr = format(today, "yyyy-MM-dd");

  // Expand recurring events for today
  const todayExpanded = useMemo(
    () => expandEventsForDate(calendarEvents, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calendarEvents, todayStr]
  );

  // All-day events for today
  const todayAllDay = useMemo(
    () => todayExpanded.filter((e) => e.isAllDay),
    [todayExpanded]
  );

  // Map expanded events to periods
  const periodEvents = useMemo(() => {
    const map: Record<string, typeof todayExpanded> = {};
    PERIODS.forEach((p) => { map[p.label] = []; });
    todayExpanded.forEach((evt) => {
      if (evt.isAllDay) return;
      const eventTime = format(parseISO(evt.startTime), "HH:mm");
      // Try to match to a period (including break periods for non-class events)
      for (const period of PERIODS) {
        if (period.isBreak && evt.type === "class") continue;
        if (eventTime >= period.start && eventTime < period.end) {
          map[period.label].push(evt);
          break;
        }
      }
    });
    return map;
  }, [todayExpanded]);

  // Current time for period status
  const currentTimeStr = format(today, "HH:mm");

  // Detect live lesson for registration prompt
  const liveLesson = useMemo(() => {
    for (const period of PERIODS) {
      if (period.isBreak) continue;
      const status = getPeriodStatus(period.start, period.end, currentTimeStr);
      if (status === "current") {
        const classEvt = periodEvents[period.label]?.find((e) => e.type === "class" && e.classId);
        if (classEvt) {
          // Check if attendance already taken
          const alreadyTaken = attendanceSessions.some(
            (s) => s.classId === classEvt.classId && s.date === todayStr
          );
          if (!alreadyTaken) {
            const cls = classes.find((c) => c.id === classEvt.classId);
            return { period, event: classEvt, cls };
          }
        }
        break;
      }
    }
    return null;
  }, [periodEvents, currentTimeStr, attendanceSessions, todayStr, classes]);

  if (loading) return <DashboardSkeleton />;

  // Compute dashboard data — filtered by active class when set
  const filteredAssessments = activeClassId
    ? assessments.filter((a) => a.classId === activeClassId)
    : assessments;
  const publishedAssessments = filteredAssessments.filter((a) => a.status === "live" || a.status === "published");
  const toMarkCount = publishedAssessments.reduce((count, asmt) => {
    const classObj = classes.find((c) => c.id === asmt.classId);
    if (!classObj) return count;
    const asmtGrades = grades.filter((g) => g.assessmentId === asmt.id);
    return count + getToMarkCount(classObj.studentIds, asmtGrades, asmt);
  }, 0);

  const filteredArtifacts = classStudentIds
    ? artifacts.filter((a) => classStudentIds.has(a.studentId))
    : artifacts;
  const pendingArtifacts = filteredArtifacts.filter((a) => a.approvalStatus === "pending");
  const filteredIncidents = classStudentIds
    ? incidents.filter((i) => classStudentIds.has(i.studentId))
    : incidents;
  const openIncidents = filteredIncidents.filter((i) => i.status !== "resolved");

  // Recent attendance exceptions (last 7 days)
  const recentSessions = attendanceSessions.filter((s) => {
    const sessionDate = parseISO(s.date);
    return isBefore(addDays(today, -7), sessionDate);
  });
  const attendanceExceptions: { studentId: string; status: string; date: string; note?: string }[] = [];
  recentSessions.forEach((session) => {
    session.records.forEach((r) => {
      if (r.status !== "present") {
        if (classStudentIds && !classStudentIds.has(r.studentId)) return;
        attendanceExceptions.push({
          studentId: r.studentId,
          status: r.status,
          date: session.date,
          note: r.note,
        });
      }
    });
  });

  const getStudentName = (id: string) => {
    const s = students.find((st) => st.id === id);
    return s ? `${s.firstName} ${s.lastName}` : "Unknown";
  };

  return (
    <div>
      <PageHeader title="Dashboard" description={`Welcome back, ${TEACHER.name}`} />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="To mark"
          value={toMarkCount}
          icon={ClipboardCheck}
          trend={toMarkCount > 10 ? { direction: "up", label: "Needs attention" } : undefined}
        />
        <StatCard label="Students" value={classStudentIds ? classStudentIds.size : students.length} icon={Users} />
        <StatCard
          label="Pending reviews"
          value={pendingArtifacts.length}
          icon={FolderOpen}
        />
        <StatCard
          label="Open incidents"
          value={openIncidents.length}
          icon={AlertTriangle}
          trend={openIncidents.length > 3 ? { direction: "up", label: `${openIncidents.length} unresolved` } : undefined}
        />
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Today's Timetable */}
        <Card className="p-5 gap-0 h-full lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#c24e3f]" />
              Today&apos;s timetable
            </h2>
            <Link href="/operations/timetable" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View timetable <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Registration prompt */}
          {liveLesson && (
            <div className="mb-4 rounded-lg border border-[#c24e3f]/20 bg-[#fff2f0] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#c24e3f]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c24e3f] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c24e3f]" />
                    </span>
                    {liveLesson.period.label} is in progress
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {liveLesson.cls?.name || liveLesson.event.title}
                    {liveLesson.event.room && ` · ${liveLesson.event.room}`}
                  </p>
                </div>
                <Link
                  href={`/operations/attendance?classId=${liveLesson.event.classId}&date=${todayStr}`}
                  className="shrink-0"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#c24e3f] text-white text-[12px] font-medium hover:bg-[#a83d32] transition-colors">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Take registration
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* All-day events banner */}
          {todayAllDay.length > 0 && (
            <div className="mb-3 flex items-center gap-2 text-[12px] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">All day:</span>
              {todayAllDay.map((e, i) => (
                <span key={`${e.id}-${i}`}>
                  {i > 0 && ", "}
                  {e.title}
                </span>
              ))}
            </div>
          )}

          {/* Period timeline */}
          <div className="space-y-0">
            {PERIODS.map((period) => {
              const status = getPeriodStatus(period.start, period.end, currentTimeStr);
              const events = periodEvents[period.label] || [];
              const isCurrent = status === "current";
              const isPast = status === "past";
              const classEvt = events.find((e) => e.type === "class");
              const nonClassEvts = events.filter((e) => e.type !== "class");
              const cls = classEvt?.classId ? classes.find((c) => c.id === classEvt.classId) : null;

              return (
                <div
                  key={period.label}
                  className={cn(
                    "flex gap-3 py-2 border-b border-border/30 last:border-0",
                    isPast && "opacity-50",
                    isCurrent && "bg-[#fff2f0]/30 -mx-5 px-5 rounded-md"
                  )}
                >
                  {/* Time column */}
                  <div className="w-[52px] shrink-0 pt-0.5">
                    <div className={cn(
                      "text-[12px] font-medium",
                      isCurrent ? "text-[#c24e3f]" : "text-muted-foreground"
                    )}>
                      {period.start}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex flex-col items-center pt-1.5 shrink-0">
                    {isCurrent ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c24e3f] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c24e3f]" />
                      </span>
                    ) : (
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        isPast ? "bg-muted-foreground/30" : "bg-border"
                      )} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-[12px] font-medium",
                      isCurrent ? "text-[#c24e3f]" : "text-muted-foreground"
                    )}>
                      {period.label}
                    </div>

                    {period.isBreak && nonClassEvts.length === 0 ? (
                      <div className="text-[12px] text-muted-foreground italic mt-0.5">
                        {period.label}
                      </div>
                    ) : classEvt ? (
                      <div className="mt-0.5">
                        <div className="text-[13px] font-medium truncate">
                          {cls?.name || classEvt.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {cls && (
                            <span className="flex items-center gap-0.5">
                              <Users className="h-3 w-3" />
                              {cls.studentIds.length} students
                            </span>
                          )}
                          {classEvt.room && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {classEvt.room}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : nonClassEvts.length > 0 ? (
                      <div className="mt-0.5 space-y-1">
                        {nonClassEvts.map((evt, i) => {
                          const TypeIcon = evt.type === "meeting" ? Handshake
                            : evt.type === "video_call" ? Video
                            : evt.type === "deadline" ? Target
                            : CalendarDays;
                          return (
                            <div key={`${evt.id}-${i}`} className="text-[12px] flex items-center gap-1.5">
                              <TypeIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{evt.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        Free period
                      </div>
                    )}

                    {/* Show non-class events alongside class event if both exist */}
                    {classEvt && nonClassEvts.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {nonClassEvts.map((evt, i) => {
                          const TypeIcon = evt.type === "meeting" ? Handshake
                            : evt.type === "video_call" ? Video
                            : evt.type === "deadline" ? Target
                            : CalendarDays;
                          return (
                            <div key={`${evt.id}-${i}`} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <TypeIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{evt.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Grading Tasks */}
        <Card className="p-5 gap-0 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[#c24e3f]" />
              Grading tasks
              {toMarkCount > 0 && (
                <Badge variant="secondary" className="text-[11px]">{toMarkCount}</Badge>
              )}
            </h2>
            <Link href="/assessments" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {publishedAssessments.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">No assessments to mark</p>
          ) : (
            <div className="space-y-2">
              {publishedAssessments.slice(0, 5).map((asmt) => {
                const cls = classes.find((c) => c.id === asmt.classId);
                const asmtGrades = grades.filter((g) => g.assessmentId === asmt.id);
                const gradedCount = asmtGrades.filter((g) => isGradeComplete(g, asmt)).length;
                const excusedForAsmt = asmtGrades.filter((g) => g.submissionStatus === "excused").length;
                const totalStudents = (cls?.studentIds.length || 0) - excusedForAsmt;
                return (
                  <Link key={asmt.id} href={`/assessments/${asmt.id}`} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{asmt.title}</p>
                      <p className="text-[12px] text-muted-foreground">{cls?.name}</p>
                    </div>
                    <span className="text-[12px] text-muted-foreground shrink-0">
                      {gradedCount}/{totalStudents} graded
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Attendance Exceptions */}
        <Card className="p-5 gap-0 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#c24e3f]" />
              Attendance exceptions
              {attendanceExceptions.length > 0 && (
                <Badge variant="secondary" className="text-[11px]">{attendanceExceptions.length}</Badge>
              )}
            </h2>
            <Link href="/operations/attendance" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {attendanceExceptions.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">No recent exceptions</p>
          ) : (
            <div className="space-y-2">
              {attendanceExceptions.slice(0, 5).map((ex, i) => (
                <Link key={`${ex.studentId}-${ex.date}-${i}`} href={`/students/${ex.studentId}${activeClassId ? `?classId=${activeClassId}` : ""}`} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{getStudentName(ex.studentId)}</p>
                    <p className="text-[12px] text-muted-foreground">{format(parseISO(ex.date), "MMM d")}</p>
                  </div>
                  <StatusBadge status={ex.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Support Follow-ups */}
        <Card className="p-5 gap-0 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#c24e3f]" />
              Support follow-ups
              {openIncidents.length > 0 && (
                <Badge variant="secondary" className="text-[11px]">{openIncidents.length}</Badge>
              )}
            </h2>
            <Link href="/support" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {openIncidents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">No open follow-ups</p>
          ) : (
            <div className="space-y-2">
              {openIncidents.slice(0, 5).map((incident) => (
                <div key={incident.id} onClick={() => router.push("/support")} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{incident.title}</p>
                    <p className="text-[12px] text-muted-foreground">
                      <Link href={`/students/${incident.studentId}`} className="text-[#c24e3f] hover:underline" onClick={(e) => e.stopPropagation()}>
                        {getStudentName(incident.studentId)}
                      </Link>
                    </p>
                  </div>
                  <StatusBadge status={incident.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Portfolio Activity (B5) */}
        <Card className="p-5 gap-0 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <ImageIcon aria-hidden="true" className="h-4 w-4 text-[#c24e3f]" />
              Portfolio activity
              {pendingArtifacts.length > 0 && (
                <Badge variant="secondary" className="text-[11px]">{pendingArtifacts.length} pending</Badge>
              )}
            </h2>
            <Link href="/portfolio" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {artifacts.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">No portfolio activity yet</p>
          ) : (
            <div className="space-y-2">
              {[...artifacts]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((artifact) => (
                  <div key={artifact.id} onClick={() => router.push("/portfolio")} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{artifact.title}</p>
                      <p className="text-[12px] text-muted-foreground">
                        <Link href={`/students/${artifact.studentId}`} className="text-[#c24e3f] hover:underline" onClick={(e) => e.stopPropagation()}>
                          {getStudentName(artifact.studentId)}
                        </Link>
                      </p>
                    </div>
                    <StatusBadge status={artifact.approvalStatus} />
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Recent Announcements (B5) */}
        <Card className="p-5 gap-0 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#c24e3f]" />
              Recent announcements
            </h2>
            <Link href="/communication" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">No announcements yet</p>
          ) : (
            <div className="space-y-2">
              {[...announcements]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((ann) => {
                  const channel = channels.find((c) => c.id === ann.channelId);
                  const cls = channel ? classes.find((c) => c.id === channel.classId) : null;
                  return (
                    <Link key={ann.id} href="/communication" className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{ann.title}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {cls?.name || "General"} &middot; {format(parseISO(ann.createdAt), "MMM d")}
                        </p>
                      </div>
                      <StatusBadge status={ann.status} showIcon={false} />
                    </Link>
                  );
                })}
            </div>
          )}
        </Card>

        {/* Report Cycle Status (B5) */}
        <Card className="p-5 gap-0 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#c24e3f]" />
              Report cycles
            </h2>
            <Link href="/reports" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {reportCycles.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">No report cycles</p>
          ) : (
            <div className="space-y-3">
              {reportCycles.map((cycle) => {
                const cycleReports = reports.filter((r) => r.cycleId === cycle.id);
                const drafts = cycleReports.filter((r) => r.publishState === "draft").length;
                const ready = cycleReports.filter((r) => r.publishState === "ready").length;
                const published = cycleReports.filter((r) => r.publishState === "published").length;
                const distributed = cycleReports.filter((r) => r.publishState === "distributed").length;
                const total = cycleReports.length;
                const completedPercent = total > 0 ? Math.round(((published + distributed) / total) * 100) : 0;
                return (
                  <Link key={cycle.id} href={`/reports/cycles/${cycle.id}`} className="block p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-medium">{cycle.name}</p>
                      <StatusBadge status={cycle.status} showIcon={false} />
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-[#c24e3f] rounded-full transition-all"
                        style={{ width: `${completedPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{drafts} draft</span>
                      <span>&middot;</span>
                      <span>{ready} ready</span>
                      <span>&middot;</span>
                      <span>{published + distributed} published</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
