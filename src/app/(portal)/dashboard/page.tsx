"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/stores";
import { getDemoNow } from "@/lib/demo-time";
import { format } from "date-fns";
import {
  generateRecommendations,
  type RecommendationInput,
} from "@/lib/recommendation-engine";
import { getToMarkCount } from "@/lib/grade-helpers";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RecommendationList } from "@/components/dashboard/recommendation-list";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
  const state = useStore((s) => s);
  const activeClassId = useStore((s) => s.ui.activeClassId);
  const setActiveClass = useStore((s) => s.setActiveClass);

  const now = getDemoNow();
  const todayStr = format(now, "yyyy-MM-dd");

  // Dismiss/snooze (session-only)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());

  // Class filter for recommendations — syncs to activeClassId but can be overridden
  const [recClassFilter, setRecClassFilter] = useState<string | null>(null);
  useEffect(() => {
    setRecClassFilter(activeClassId);
  }, [activeClassId]);

  // Time-aware greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Build recommendation input
  const recInput: RecommendationInput = useMemo(
    () => ({
      assessments: state.assessments,
      grades: state.grades,
      classes: state.classes,
      students: state.students,
      artifacts: state.artifacts,
      incidents: state.incidents,
      reportCycles: state.reportCycles,
      reports: state.reports,
      learningGoals: state.learningGoals,
      attendanceSessions: state.attendanceSessions,
      lessonSlotAssignments: state.lessonSlotAssignments ?? [],
      lessonPlans: state.lessonPlans ?? [],
    }),
    [state]
  );

  // Generate recommendations
  const recommendations = useMemo(
    () => generateRecommendations(recInput, now, recClassFilter),
    [recInput, now, recClassFilter]
  );

  // Stat card counts
  const stats = useMemo(() => {
    const filteredAssessments = activeClassId
      ? state.assessments.filter((a) => a.classId === activeClassId)
      : state.assessments;
    const liveAssessments = filteredAssessments.filter((a) => a.status === "live");

    const toMark = liveAssessments.reduce((count, asmt) => {
      const cls = state.classes.find((c) => c.id === asmt.classId);
      if (!cls) return count;
      const asmtGrades = state.grades.filter((g) => g.assessmentId === asmt.id);
      return count + getToMarkCount(cls.studentIds, asmtGrades, asmt);
    }, 0);

    const dueToday = liveAssessments.filter(
      (a) => a.dueDate.split("T")[0] === todayStr
    ).length;

    const filteredGrades = activeClassId
      ? state.grades.filter((g) => g.classId === activeClassId)
      : state.grades;
    const readyToRelease = filteredGrades.filter(
      (g) => g.gradingStatus === "ready" && !g.releasedAt
    ).length;

    const activeCycles = state.reportCycles.filter(
      (c) => c.status === "open" || c.status === "closing"
    );
    const cycleIds = new Set(activeCycles.map((c) => c.id));
    const reportsDue = state.reports.filter(
      (r) =>
        cycleIds.has(r.cycleId) &&
        (r.publishState === "draft" || r.publishState === "ready") &&
        (!activeClassId || r.classId === activeClassId)
    ).length;

    return { toMark, dueToday, readyToRelease, reportsDue };
  }, [state, activeClassId, todayStr]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };
  const handleSnooze = (id: string) => {
    setSnoozedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">
            {greeting}, {state.currentUser?.name?.split(" ")[0] ?? "Teacher"}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {format(now, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <Select
          value={activeClassId ?? "all"}
          onValueChange={(v) => setActiveClass(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[220px] h-9 text-[13px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {state.classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <StatCards
        toMark={stats.toMark}
        dueToday={stats.dueToday}
        readyToRelease={stats.readyToRelease}
        reportsDue={stats.reportsDue}
      />

      {/* Command Center: Main + Sidebar */}
      <div className="flex gap-6">
        {/* Main area: Recommendations */}
        <div className="flex-1 min-w-0">
          <RecommendationList
            recommendations={recommendations}
            dismissedIds={dismissedIds}
            snoozedIds={snoozedIds}
            onDismiss={handleDismiss}
            onSnooze={handleSnooze}
            classFilter={recClassFilter}
            onClassFilterChange={setRecClassFilter}
            classes={state.classes.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>

        {/* Sidebar */}
        <div className="w-[280px] shrink-0 hidden lg:block">
          <DashboardSidebar
            classes={state.classes}
            now={now}
            todayStr={todayStr}
            reportCycles={state.reportCycles}
            reports={state.reports}
            incidents={state.incidents}
            artifacts={state.artifacts}
            announcements={state.announcements}
            attendanceSessions={state.attendanceSessions}
            students={state.students}
            grades={state.grades}
            assessments={state.assessments}
            learningGoals={state.learningGoals}
          />
        </div>
      </div>
    </div>
  );
}
