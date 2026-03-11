"use client";

import Link from "next/link";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { getFamilyDemoNowMs } from "@/lib/family-demo";
import {
  getEffectiveParentStudentId,
  getFamilyAnnouncements,
  getFamilyAssessmentEntries,
  getFamilyAttendanceEntries,
  getFamilyCalendarItems,
  getFamilyDeadlineEntries,
  getFamilyMessagesForThread,
  getFamilyNotifications,
  getFamilyThreads,
  getFamilyVisibleArtifacts,
  getFamilyVisibleClassroomUpdates,
  getFamilyVisibleReports,
  getParentChildren,
  getParentProfile,
} from "@/lib/family-selectors";
import { getGradeCellDisplay } from "@/lib/grade-helpers";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  BookOpen,
  CalendarClock,
  CheckSquare,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

function formatWhen(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function childNameById(children: ReturnType<typeof getParentChildren>, studentId: string) {
  const child = children.find((entry) => entry.id === studentId);
  return child ? `${child.firstName} ${child.lastName}` : "Student";
}

export default function FamilyHomePage() {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const loading = useMockLoading([parentId]);
  const demoNowMs = getFamilyDemoNowMs();

  if (loading) {
    return (
      <>
        <PageHeader title="Home" description="A calm view of what matters for your family this week" />
        <CardGridSkeleton count={8} />
      </>
    );
  }

  if (!parentId) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Not signed in"
        description="Choose a family persona from the entry page to explore the parent portal."
      />
    );
  }

  const parent = getParentProfile(state, parentId);
  const children = getParentChildren(state, parentId);
  const activeStudentId = getEffectiveParentStudentId(state, parentId);
  const selectedIds = activeStudentId ? [activeStudentId] : children.map((child) => child.id);
  const inAllChildrenMode = !activeStudentId && children.length > 1;

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No children linked yet"
        description="Once the school links your family account to a child, their learning, messages, and reports will appear here."
      />
    );
  }

  const learningHighlights = getFamilyVisibleArtifacts(state, parentId, activeStudentId).slice(0, 4);
  const classroomUpdates = getFamilyVisibleClassroomUpdates(state, parentId, activeStudentId).slice(0, 4);
  const announcements = getFamilyAnnouncements(state, parentId, activeStudentId);
  const deadlines = getFamilyDeadlineEntries(state, parentId, activeStudentId)
    .filter((entry) => entry.submissionStatus === "due" || entry.submissionStatus === "overdue")
    .slice(0, 5);
  const upcomingEvents = getFamilyCalendarItems(state, parentId, activeStudentId)
    .filter((event) => new Date(event.startsAt).getTime() >= demoNowMs)
    .slice(0, 5);
  const reports = selectedIds
    .flatMap((studentId) => getFamilyVisibleReports(state, parentId, studentId))
    .sort((a, b) => (b.distributedAt ?? "").localeCompare(a.distributedAt ?? ""));
  const latestReport = reports[0];
  const results = selectedIds
    .flatMap((studentId) => getFamilyAssessmentEntries(state, parentId, studentId))
    .filter((entry) => entry.grade)
    .sort((a, b) => (b.grade?.releasedAt ?? "").localeCompare(a.grade?.releasedAt ?? ""));
  const latestResult = results[0];
  const attendanceEntries = selectedIds
    .flatMap((studentId) => getFamilyAttendanceEntries(state, parentId, studentId));
  const recentAttendance = attendanceEntries.slice(0, 20);
  const attendanceSummary = {
    present: recentAttendance.filter((entry) => entry.record.status === "present").length,
    absent: recentAttendance.filter((entry) => entry.record.status === "absent").length,
    late: recentAttendance.filter((entry) => entry.record.status === "late").length,
    excused: recentAttendance.filter((entry) => entry.record.status === "excused").length,
  };
  const weekAgo = demoNowMs - 7 * 24 * 60 * 60 * 1000;
  const newLearningCount = learningHighlights.filter(
    (artifact) => new Date(artifact.updatedAt).getTime() >= weekAgo
  ).length;
  const unreadAnnouncements = announcements.filter(
    (announcement) => !announcement.readByParentIds.includes(parentId)
  ).length;
  const visibleThreads = [
    ...getFamilyThreads(state, parentId, "direct", activeStudentId),
    ...getFamilyThreads(state, parentId, "channel", activeStudentId),
  ];
  const unreadMessageCount = visibleThreads.reduce((count, thread) => {
    const unread = getFamilyMessagesForThread(state, thread.id).filter(
      (message) => !message.readByParentIds.includes(parentId) && message.authorRole !== "parent"
    ).length;
    return count + unread;
  }, 0);
  const unreadNotificationCount = getFamilyNotifications(state, parentId, activeStudentId).filter(
    (notification) => !notification.read
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home"
        description={
          inAllChildrenMode
            ? `A shared view across ${children.length} children`
            : `A calm update for ${childNameById(children, selectedIds[0])}`
        }
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{parent.householdName}</Badge>
          {inAllChildrenMode ? (
            <Badge variant="secondary">All children</Badge>
          ) : (
            <Badge variant="secondary">
              {children.find((child) => child.id === selectedIds[0])?.gradeLevel}
            </Badge>
          )}
          <Badge variant="outline">{unreadNotificationCount} unread notifications</Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New learning this week" value={newLearningCount} icon={Sparkles} />
        <StatCard label="Upcoming deadlines" value={deadlines.length} icon={CalendarClock} />
        <StatCard label="Unread announcements" value={unreadAnnouncements} icon={Bell} />
        <StatCard label="Inbox to review" value={unreadMessageCount} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="gap-0 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <Sparkles className="h-4 w-4 text-[#c24e3f]" />
              New learning this week
            </h2>
            <Link href="/family/learning">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#c24e3f]">
                Open learning
              </Button>
            </Link>
          </div>
          {learningHighlights.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No portfolio updates have been shared yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {learningHighlights.map((artifact) => (
                <Link
                  key={artifact.id}
                  href={`/family/learning?tab=portfolio&artifact=${artifact.id}&child=${artifact.studentId}`}
                  className="rounded-[14px] border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">{artifact.title}</p>
                      <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                        {artifact.description || "Shared learning evidence"}
                      </p>
                    </div>
                    <StatusBadge status={artifact.familyShareStatus} showIcon={false} className="shrink-0 text-[10px]" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{formatWhen(artifact.updatedAt)}</span>
                    <span>{childNameById(children, artifact.studentId)}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {artifact.mediaType}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="gap-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <CalendarClock className="h-4 w-4 text-[#c24e3f]" />
              Upcoming deadlines
            </h2>
            <Link href="/family/assessments">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#c24e3f]">
                View all
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {deadlines.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No active deadlines right now.
              </p>
            ) : (
              deadlines.map((entry) => (
                <Link
                  key={entry.assessment.id}
                  href={`/family/assessments/${entry.assessment.id}?child=${entry.studentId}`}
                  className="block rounded-[14px] border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">{entry.assessment.title}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {entry.className} · Due {formatWhen(entry.assessment.dueDate)}
                      </p>
                    </div>
                    <StatusBadge status={entry.submissionStatus} showIcon={false} className="text-[10px]" />
                  </div>
                  {inAllChildrenMode && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {entry.studentName}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="gap-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <BookOpen className="h-4 w-4 text-[#c24e3f]" />
              Latest result
            </h2>
            <Link href="/family/assessments">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#c24e3f]">
                Results
              </Button>
            </Link>
          </div>
          {latestResult ? (
            <Link href={`/family/assessments/${latestResult.assessment.id}?child=${latestResult.studentId}`} className="block rounded-[14px] border border-border p-4 transition-colors hover:bg-muted/40">
              <p className="text-[14px] font-medium">{latestResult.assessment.title}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {latestResult.className}
                {inAllChildrenMode ? ` · ${latestResult.studentName}` : ""}
              </p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-semibold text-[#c24e3f]">
                    {getGradeCellDisplay(latestResult.grade, latestResult.assessment)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Released {formatWhen(latestResult.grade?.releasedAt ?? latestResult.assessment.dueDate)}
                  </p>
                </div>
                <StatusBadge status="released" showIcon={false} />
              </div>
            </Link>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Released results will appear here once teachers publish them for family view.
            </p>
          )}
        </Card>

        <Card className="gap-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <FileText className="h-4 w-4 text-[#c24e3f]" />
              Latest report
            </h2>
            <Link href="/family/reports">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#c24e3f]">
                View reports
              </Button>
            </Link>
          </div>
          {latestReport ? (
            <Link href={`/family/reports/${latestReport.id}?child=${latestReport.studentId}`} className="block rounded-[14px] border border-border p-4 transition-colors hover:bg-muted/40">
              <p className="text-[14px] font-medium">
                {state.reportCycles.find((cycle) => cycle.id === latestReport.cycleId)?.name ?? "Progress report"}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {childNameById(children, latestReport.studentId)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge status="distributed" showIcon={false} />
                <span className="text-[11px] text-muted-foreground">
                  Shared {formatWhen(latestReport.distributedAt ?? latestReport.publishedAt ?? "")}
                </span>
              </div>
            </Link>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Reports will appear here when the school distributes them to families.
            </p>
          )}
        </Card>

        <Card className="gap-0 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <CalendarDays className="h-4 w-4 text-[#c24e3f]" />
              Recent classroom updates
            </h2>
            <Link href="/family/learning?tab=updates">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#c24e3f]">
                Open feed
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {classroomUpdates.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Teachers have not shared any class updates yet.
              </p>
            ) : (
              classroomUpdates.map((update) => (
                <Link
                  key={update.id}
                  href={`/family/learning?tab=updates&update=${update.id}&child=${update.studentIds[0] ?? selectedIds[0]}`}
                  className="block rounded-[14px] border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">{update.title}</p>
                      <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                        {update.body}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatWhen(update.createdAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {state.classes.find((entry) => entry.id === update.classId)?.subject ?? "Class"}
                    </Badge>
                    {inAllChildrenMode && update.studentIds[0] && (
                      <Badge variant="secondary" className="text-[10px]">
                        {childNameById(children, update.studentIds[0])}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="gap-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <CheckSquare className="h-4 w-4 text-[#c24e3f]" />
              Attendance snapshot
            </h2>
            <Link href="/family/attendance">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#c24e3f]">
                Open attendance
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Present</p>
              <p className="mt-1 text-[22px] font-semibold">{attendanceSummary.present}</p>
            </div>
            <div className="rounded-[14px] border border-border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Late / absent</p>
              <p className="mt-1 text-[22px] font-semibold">
                {attendanceSummary.late + attendanceSummary.absent}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {recentAttendance.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-[12px] bg-muted/50 px-3 py-2">
                <div>
                  <p className="text-[12px] font-medium">{entry.className}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatWhen(entry.date)}
                  </p>
                </div>
                <StatusBadge status={entry.record.status} showIcon={false} className="text-[10px]" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <Bell className="h-4 w-4 text-[#c24e3f]" />
              Latest announcements
            </h2>
            <Link href="/family/messages?tab=announcements">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#c24e3f]">
                View all
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.slice(0, 3).map((announcement) => (
              <Link
                key={announcement.id}
                href="/family/messages?tab=announcements"
                className="block rounded-[14px] border border-border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{announcement.title}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                      {announcement.body}
                    </p>
                  </div>
                  {!announcement.readByParentIds.includes(parentId) && (
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#2563eb]" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="gap-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <CalendarDays className="h-4 w-4 text-[#c24e3f]" />
              Upcoming events
            </h2>
            <Link href="/family/calendar">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#c24e3f]">
                Calendar
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No upcoming events are scheduled in the current demo window.
              </p>
            ) : (
              upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href="/family/calendar"
                  className="block rounded-[14px] border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <p className="text-[13px] font-medium">{event.title}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {formatWhen(event.startsAt)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="gap-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <MessageSquare className="h-4 w-4 text-[#c24e3f]" />
              Quick links
            </h2>
          </div>
          <div className="space-y-2">
            {[
              { href: "/family/messages", label: "Open messages" },
              { href: "/family/calendar", label: "Review calendar" },
              { href: "/family/more", label: "Policies and settings" },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="outline" className="h-9 w-full justify-between text-[13px]">
                  {link.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
