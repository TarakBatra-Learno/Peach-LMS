"use client";

import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { DashboardSkeleton } from "@/components/shared/skeleton-loader";
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
  Image,
} from "lucide-react";
import Link from "next/link";
import { format, isToday, parseISO, isBefore, addDays } from "date-fns";

export default function DashboardPage() {
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

  if (loading) return <DashboardSkeleton />;

  // Compute dashboard data
  const publishedAssessments = assessments.filter((a) => a.status === "published");
  const ungradedCount = publishedAssessments.reduce((count, asmt) => {
    const classObj = classes.find((c) => c.id === asmt.classId);
    if (!classObj) return count;
    const studentCount = classObj.studentIds.length;
    const gradedCount = grades.filter((g) => g.assessmentId === asmt.id && !g.isMissing).length;
    return count + Math.max(0, studentCount - gradedCount);
  }, 0);

  const pendingArtifacts = artifacts.filter((a) => a.approvalStatus === "pending");
  const openIncidents = incidents.filter((i) => i.status !== "resolved");

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const todayEvents = calendarEvents.filter((e) => {
    const eventDate = e.startTime.split("T")[0];
    return eventDate === todayStr;
  });

  // Recent attendance exceptions (last 7 days)
  const recentSessions = attendanceSessions.filter((s) => {
    const sessionDate = parseISO(s.date);
    return isBefore(addDays(today, -7), sessionDate);
  });
  const attendanceExceptions: { studentId: string; status: string; date: string; note?: string }[] = [];
  recentSessions.forEach((session) => {
    session.records.forEach((r) => {
      if (r.status !== "present") {
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
      <PageHeader title="Dashboard" description="Welcome back, Ms. Mitchell" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Ungraded"
          value={ungradedCount}
          icon={ClipboardCheck}
          trend={ungradedCount > 10 ? { direction: "up", label: "Needs attention" } : undefined}
        />
        <StatCard label="Students" value={students.length} icon={Users} />
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
        {/* Today's Schedule */}
        <Card className="p-5 gap-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#c24e3f]" />
              Today&apos;s schedule
            </h2>
            <Link href="/operations/calendar" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View calendar <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">Nothing scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="text-[12px] text-muted-foreground w-[60px] shrink-0">
                    {event.isAllDay ? "All day" : format(parseISO(event.startTime), "HH:mm")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{event.title}</p>
                  </div>
                  <StatusBadge status={event.type} showIcon={false} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Grading Tasks */}
        <Card className="p-5 gap-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[#c24e3f]" />
              Grading tasks
              {ungradedCount > 0 && (
                <Badge variant="secondary" className="text-[11px]">{ungradedCount}</Badge>
              )}
            </h2>
            <Link href="/assessments" className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {publishedAssessments.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4">No assessments need grading</p>
          ) : (
            <div className="space-y-2">
              {publishedAssessments.slice(0, 5).map((asmt) => {
                const cls = classes.find((c) => c.id === asmt.classId);
                const gradedCount = grades.filter((g) => g.assessmentId === asmt.id && !g.isMissing).length;
                const totalStudents = cls?.studentIds.length || 0;
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
        <Card className="p-5 gap-0">
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
                <Link key={`${ex.studentId}-${ex.date}-${i}`} href={`/students/${ex.studentId}`} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
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
        <Card className="p-5 gap-0">
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
                <Link key={incident.id} href="/support" className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{incident.title}</p>
                    <p className="text-[12px] text-muted-foreground">{getStudentName(incident.studentId)}</p>
                  </div>
                  <StatusBadge status={incident.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Portfolio Activity (B5) */}
        <Card className="p-5 gap-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <Image className="h-4 w-4 text-[#c24e3f]" />
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
                  <Link key={artifact.id} href="/portfolio" className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{artifact.title}</p>
                      <p className="text-[12px] text-muted-foreground">{getStudentName(artifact.studentId)}</p>
                    </div>
                    <StatusBadge status={artifact.approvalStatus} />
                  </Link>
                ))}
            </div>
          )}
        </Card>

        {/* Recent Announcements (B5) */}
        <Card className="p-5 gap-0">
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
        <Card className="p-5 gap-0">
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
