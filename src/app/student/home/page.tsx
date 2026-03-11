"use client";

import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { BookOpen, ClipboardCheck, Target, Bell, Calendar, Clock } from "lucide-react";
import { getStudentClasses, getStudentAssessments, getStudentReleasedGrades, getStudentTimetable, getStudentSubmission, getStudentSubmissionStatus } from "@/lib/student-selectors";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import type { AppState } from "@/stores/types";
import { StudentClassFilter } from "@/components/student/student-class-filter";
import { DashboardAnnouncementsPanel } from "@/components/student/dashboard-announcements-panel";
import { useReleasedAssessmentClick } from "@/lib/hooks/use-released-assessment-click";
import { GradeResultSheet } from "@/components/student/grade-result-sheet";

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
  const currentUser = useStore((s) => s.currentUser);
  const studentActiveClassId = useStore((s) => s.ui.studentActiveClassId);
  const state = useStore() as AppState;
  const [ready, setReady] = useState(false);

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

  const classes = getStudentClasses(state, studentId);
  const assessments = getStudentAssessments(state, studentId);
  const releasedGrades = getStudentReleasedGrades(state, studentId);
  const notifications = state.studentNotifications.filter((n) => n.studentId === studentId && !n.read);

  // Current date reference
  const now = new Date();

  // Today's schedule
  const today = format(now, "yyyy-MM-dd");
  const todaySchedule = useMemo(
    () => getStudentTimetable(state, studentId, today, today),
    [state, studentId, today]
  );

  // Upcoming assessments (due in the future), filtered by active class when set
  const upcomingAssessments = assessments
    .filter((a) => new Date(a.dueDate) >= now)
    .filter((a) => !studentActiveClassId || a.classId === studentActiveClassId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Filtered released grades when class filter is active
  const filteredGrades = studentActiveClassId
    ? releasedGrades.filter((g) => g.classId === studentActiveClassId)
    : releasedGrades;

  const firstName = currentUser?.name?.split(" ")[0] ?? "Student";
  const { handleClick: handleGradeClick, sheetProps } = useReleasedAssessmentClick(studentId ?? "");

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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
            <BookOpen className="h-4 w-4" />
            My Classes
          </div>
          <div className="text-[28px] font-semibold">{classes.length}</div>
          <p className="text-[12px] text-muted-foreground">Enrolled classes</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
            <ClipboardCheck className="h-4 w-4" />
            Assessments
          </div>
          <div className="text-[28px] font-semibold">{assessments.length}</div>
          <p className="text-[12px] text-muted-foreground">{upcomingAssessments.length} upcoming</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
            <Target className="h-4 w-4" />
            Grades Released
          </div>
          <div className="text-[28px] font-semibold">{releasedGrades.length}</div>
          <p className="text-[12px] text-muted-foreground">Across all classes</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
            <Bell className="h-4 w-4" />
            Notifications
          </div>
          <div className="text-[28px] font-semibold">{notifications.length}</div>
          <p className="text-[12px] text-muted-foreground">Unread</p>
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
                const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
                        const sub = getStudentSubmission(state, studentId, asmt.id);
                        const rawGrade = state.grades.find((g: any) => g.studentId === studentId && g.assessmentId === asmt.id);
                        const subStatus = getStudentSubmissionStatus(rawGrade, sub, asmt as any);
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

        {/* Recent Grades */}
        <Card className="p-5 gap-0">
          <h2 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Recent Grades
          </h2>
          {filteredGrades.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">
              No grades released yet. Check back later!
            </p>
          ) : (
            <div className="space-y-2">
              {filteredGrades.slice(0, 5).map((grade) => {
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
                        <span className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0" title="New" />
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
                <div
                  key={notif.id}
                  className="flex items-start gap-2 py-2 px-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="h-2 w-2 rounded-full bg-[#c24e3f] mt-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{notif.title}</p>
                    <p className="text-[12px] text-muted-foreground line-clamp-1">{notif.body}</p>
                  </div>
                </div>
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
