"use client";

import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { BookOpen, ClipboardCheck, Target, Bell, Calendar, Clock, Route, ArrowUpRight } from "lucide-react";
import { getStudentClasses, getStudentAssessments, getStudentReleasedGrades, getStudentTimetable, getStudentSubmission, getStudentSubmissionStatus, type StudentSubmissionStatus } from "@/lib/student-selectors";
import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import Link from "next/link";
import type { AppState } from "@/stores/types";
import { StudentClassFilter } from "@/components/student/student-class-filter";
import { DashboardAnnouncementsPanel } from "@/components/student/dashboard-announcements-panel";
import { useReleasedAssessmentClick } from "@/lib/hooks/use-released-assessment-click";
import { GradeResultSheet } from "@/components/student/grade-result-sheet";
import { getDemoNow } from "@/lib/demo-time";

function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </Card>
  );
}

export default function StudentHomePage() {
  const studentId = useStudentId();
  const resolvedStudentId = studentId ?? "";
  const currentUser = useStore((s) => s.currentUser);
  const studentActiveClassId = useStore((s) => s.ui.studentActiveClassId);
  const state = useStore() as AppState;
  const [ready, setReady] = useState(false);
  const { handleClick: handleGradeClick, sheetProps } = useReleasedAssessmentClick(resolvedStudentId);

  const classes = getStudentClasses(state, resolvedStudentId);
  const assessments = getStudentAssessments(state, resolvedStudentId);
  const releasedGrades = getStudentReleasedGrades(state, resolvedStudentId);
  const notifications = state.studentNotifications.filter((n) => n.studentId === resolvedStudentId && !n.read);

  const now = getDemoNow();
  const today = format(now, "yyyy-MM-dd");
  const todaySchedule = getStudentTimetable(state, resolvedStudentId, today, today);
  const activeGoals = state.studentGoals.filter(
    (goal) => goal.studentId === resolvedStudentId && goal.status === "active"
  );
  const filteredAssessments = studentActiveClassId
    ? assessments.filter((assessment) => assessment.classId === studentActiveClassId)
    : assessments;
  const submissionStatusByAssessmentId = useMemo(() => {
    const entries = filteredAssessments.map((assessment) => {
      const submission = getStudentSubmission(state, resolvedStudentId, assessment.id);
      const grade = state.grades.find(
        (entry) => entry.studentId === resolvedStudentId && entry.assessmentId === assessment.id
      );
      return [
        assessment.id,
        getStudentSubmissionStatus(grade, submission, assessment),
      ] as const;
    });

    return new Map<string, StudentSubmissionStatus>(entries);
  }, [filteredAssessments, resolvedStudentId, state]);

  useEffect(() => {
    // Simulate brief loading for skeleton demo
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Home" description="Welcome to Peach" />
        <Card className="p-8 text-center text-muted-foreground text-[14px]">
          No student selected. Please go to the entry page to select a student persona.
        </Card>
      </div>
    );
  }

  // Upcoming assessments (due in the future), filtered by active class when set
  const upcomingAssessments = filteredAssessments
    .filter((a) => {
      const due = new Date(a.dueDate);
      due.setHours(23, 59, 59, 999);
      return due >= now;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const dueThisWeekCount = filteredAssessments.filter((assessment) => {
    const due = new Date(assessment.dueDate);
    due.setHours(23, 59, 59, 999);
    const daysUntil = differenceInCalendarDays(due, now);
    const status = submissionStatusByAssessmentId.get(assessment.id);
    return (
      daysUntil >= 0 &&
      daysUntil <= 7 &&
      status !== "submitted_on_time" &&
      status !== "submitted_late" &&
      status !== "excused"
    );
  }).length;

  // Filtered released grades when class filter is active
  const filteredGrades = studentActiveClassId
    ? releasedGrades.filter((g) => g.classId === studentActiveClassId)
    : releasedGrades;
  const recentReleasedGrades = [...filteredGrades]
    .sort((a, b) => {
      const aTime = a.releasedAt ?? a.gradedAt ?? "";
      const bTime = b.releasedAt ?? b.gradedAt ?? "";
      return bTime.localeCompare(aTime);
    })
    .slice(0, 5);

  const actionQueue = (() => {
    const items: {
      id: string;
      title: string;
      subtitle: string;
      href: string;
      badge: "draft" | "due" | "overdue" | "graded";
      meta: string;
    }[] = [];

    for (const assessment of filteredAssessments) {
      const status = submissionStatusByAssessmentId.get(assessment.id) ?? "due";
      const due = new Date(assessment.dueDate);
      due.setHours(23, 59, 59, 999);
      const daysUntil = differenceInCalendarDays(due, now);
      const subtitle = classes.find((entry) => entry.id === assessment.classId)?.name ?? "Class";

      if (status === "draft") {
        items.push({
          id: `draft-${assessment.id}`,
          title: assessment.title,
          subtitle,
          href: `/student/classes/${assessment.classId}/assessments/${assessment.id}`,
          badge: "draft",
          meta:
            daysUntil <= 0
              ? "Finish and submit today"
              : daysUntil === 1
              ? "Draft due tomorrow"
              : `Draft due in ${daysUntil} days`,
        });
        continue;
      }

      if (status === "overdue") {
        items.push({
          id: `overdue-${assessment.id}`,
          title: assessment.title,
          subtitle,
          href: `/student/classes/${assessment.classId}/assessments/${assessment.id}`,
          badge: "overdue",
          meta: "This work is overdue",
        });
        continue;
      }

      if (status === "due" && daysUntil <= 2) {
        items.push({
          id: `due-${assessment.id}`,
          title: assessment.title,
          subtitle,
          href: `/student/classes/${assessment.classId}/assessments/${assessment.id}`,
          badge: "due",
          meta: daysUntil === 0 ? "Due today" : "Due tomorrow",
        });
      }
    }

    for (const grade of recentReleasedGrades.filter((entry) => entry.reportStatus === "unseen")) {
      const assessment = state.assessments.find((entry) => entry.id === grade.assessmentId);
      if (!assessment) continue;
      const subtitle = classes.find((entry) => entry.id === grade.classId)?.name ?? "Class";
      items.push({
        id: `grade-${grade.id}`,
        title: assessment.title,
        subtitle,
        href: `/student/classes/${assessment.classId}/assessments/${assessment.id}`,
        badge: "graded",
        meta: "New released feedback",
      });
    }

    const priority: Record<string, number> = {
      overdue: 0,
      draft: 1,
      due: 2,
      graded: 3,
    };

    return items
      .sort((a, b) => priority[a.badge] - priority[b.badge])
      .slice(0, 4);
  })();
  const highlightedFeedbackCount = actionQueue.filter((item) => item.badge === "graded").length;

  const firstName = currentUser?.name?.split(" ")[0] ?? "Student";

  if (!ready) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
          <Card className="p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={`Welcome back, ${firstName}`}
          description="Here's what's happening across your classes"
        />
        <div className="shrink-0 pt-1">
          <StudentClassFilter />
        </div>
      </div>

      <Card className="p-5 gap-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold flex items-center gap-2">
              <Route className="h-4 w-4 text-[#c24e3f]" />
              What needs attention
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Priority items based on your draft work, due dates, and newly released feedback.
            </p>
          </div>
          <StatusBadge
            status={actionQueue.length > 0 ? "active" : "completed"}
            label={actionQueue.length > 0 ? `${actionQueue.length} action items` : "All caught up"}
            showIcon={false}
            className="text-[10px]"
          />
        </div>

        {actionQueue.length === 0 ? (
          <p className="text-[13px] text-muted-foreground py-4 text-center">
            Nothing urgent right now. Check your schedule or recent feedback when you&apos;re ready.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {actionQueue.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-[16px] border border-border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium">{item.title}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{item.subtitle}</p>
                    <p className="mt-2 text-[12px] text-foreground/80">{item.meta}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={item.badge} showIcon={false} className="text-[10px]" />
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
            <Route className="h-4 w-4" />
            Needs Attention
          </div>
          <div className="text-[28px] font-semibold">{actionQueue.length}</div>
          <p className="text-[12px] text-muted-foreground">
            {highlightedFeedbackCount > 0 ? `${highlightedFeedbackCount} feedback item${highlightedFeedbackCount === 1 ? "" : "s"} highlighted` : "No new release alerts"}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
            <ClipboardCheck className="h-4 w-4" />
            Due This Week
          </div>
          <div className="text-[28px] font-semibold">{dueThisWeekCount}</div>
          <p className="text-[12px] text-muted-foreground">{upcomingAssessments.length} upcoming overall</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
            <Target className="h-4 w-4" />
            Released Results
          </div>
          <div className="text-[28px] font-semibold">{filteredGrades.length}</div>
          <p className="text-[12px] text-muted-foreground">
            {recentReleasedGrades.length} recent shown below
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
            <BookOpen className="h-4 w-4" />
            Active Goals
          </div>
          <div className="text-[28px] font-semibold">{activeGoals.length}</div>
          <p className="text-[12px] text-muted-foreground">
            {classes.length} enrolled class{classes.length === 1 ? "" : "es"}
          </p>
        </Card>
      </div>

      {/* Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="p-5 gap-0">
          <h2 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            Upcoming Deadlines
          </h2>
          {upcomingAssessments.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">
              No upcoming deadlines. You&apos;re all caught up!
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingAssessments.map((asmt) => {
                const cls = classes.find((c) => c.id === asmt.classId);
                const dueDate = new Date(asmt.dueDate);
                const daysUntil = differenceInCalendarDays(dueDate, now);
                return (
                  <Link
                    key={asmt.id}
                    href={`/student/classes/${asmt.classId}/assessments/${asmt.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium truncate">{asmt.title}</p>
                      <p className="text-[12px] text-muted-foreground">{cls?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {(() => {
                        const sub = getStudentSubmission(state, resolvedStudentId, asmt.id);
                        const rawGrade = state.grades.find((g) => g.studentId === resolvedStudentId && g.assessmentId === asmt.id);
                        const subStatus = getStudentSubmissionStatus(rawGrade, sub, asmt);
                        if (subStatus !== "due") return <StatusBadge status={subStatus} showIcon={false} className="text-[10px]" />;
                        return (
                          <span className={`text-[12px] font-medium ${daysUntil <= 2 ? "text-[#dc2626]" : "text-muted-foreground"}`}>
                            {daysUntil === 0 ? "Due today" : daysUntil === 1 ? "Due tomorrow" : `${daysUntil} days`}
                          </span>
                        );
                      })()}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recently Released Feedback */}
        <Card className="p-5 gap-0">
          <h2 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Recently Released Feedback
          </h2>
          {filteredGrades.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">
              No grades released yet. Check back later!
            </p>
          ) : (
            <div className="space-y-2">
              {recentReleasedGrades.map((grade) => {
                const assessment = state.assessments.find((a) => a.id === grade.assessmentId);
                const cls = classes.find((c) => c.id === grade.classId);
                const isExcused = grade.submissionStatus === "excused";
                const display = isExcused
                  ? "Excused"
                  : grade.score !== undefined && grade.totalPoints
                  ? `${grade.score}/${grade.totalPoints}`
                  : grade.dpGrade !== undefined
                    ? `${grade.dpGrade}/7`
                    : "Graded";
                return (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleGradeClick(grade.assessmentId, grade.classId)}
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium truncate">{assessment?.title ?? "Assessment"}</p>
                      <p className="text-[12px] text-muted-foreground">{cls?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[14px] font-semibold text-[#c24e3f]">
                        {display}
                      </span>
                      {grade.reportStatus === "unseen" && (
                        <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-medium text-[#2563eb]">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Today's Schedule */}
        <Card className="p-5 gap-0">
          <h2 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Today&apos;s Schedule
          </h2>
          {todaySchedule.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">
              No classes scheduled for today.
            </p>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((slot, i) => (
                <div
                  key={`${slot.classId}-${slot.slotStartTime}-${i}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium truncate">{slot.className}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {slot.lesson?.title ?? "No lesson assigned"}
                      {slot.room && ` · ${slot.room}`}
                    </p>
                  </div>
                  <span className="text-[12px] text-muted-foreground shrink-0 ml-3 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {slot.slotStartTime} - {slot.slotEndTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Unread Notifications */}
        <Card className="p-5 gap-0">
          <h2 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Unread Notifications
          </h2>
          {notifications.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">
              All caught up! No new notifications.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.linkTo ?? "/student/messages"}
                  className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60"
                >
                  <div className="h-2 w-2 rounded-full bg-[#c24e3f] mt-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{notif.title}</p>
                    <p className="text-[12px] text-muted-foreground line-clamp-1">{notif.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Announcements */}
        {studentId && <DashboardAnnouncementsPanel studentId={studentId} />}
      </div>

      {studentId && <GradeResultSheet {...sheetProps} />}
    </div>
  );
}
