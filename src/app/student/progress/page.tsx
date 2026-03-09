"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import {
  getStudentReleasedGrades,
  getStudentAssessments,
  getStudentClasses,
  getStudentReports,
  getStudentSubmissions,
  computeStudentGoalProgress,
  type StudentGoalProgress,
} from "@/lib/student-selectors";
import { getGradePercentage } from "@/lib/grade-helpers";
import type { Assessment } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import {
  BarChart3,
  FileText,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

const MASTERY_COLORS: Record<string, string> = {
  exceeding: "bg-[#dcfce7] text-[#16a34a] border-transparent",
  meeting: "bg-[#dbeafe] text-[#2563eb] border-transparent",
  approaching: "bg-[#fef9c3] text-[#b45309] border-transparent",
  beginning: "bg-[#fee2e2] text-[#dc2626] border-transparent",
  not_assessed: "bg-muted text-muted-foreground",
};

const MASTERY_BAR_COLORS: Record<string, string> = {
  exceeding: "bg-[#16a34a]",
  meeting: "bg-[#2563eb]",
  approaching: "bg-[#b45309]",
  beginning: "bg-[#dc2626]",
};

const CATEGORY_LABELS: Record<string, string> = {
  standard: "Standards",
  atl_skill: "ATL Skills",
  learner_profile: "Learner Profile",
};

export default function StudentProgressPage() {
  const studentId = useStudentId();
  const loading = useMockLoading([studentId]);
  const state = useStore((s) => s);
  const rawAssessments = useStore((s) => s.assessments);

  const enrolledClasses = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );

  // Grades across all classes
  const allReleasedGrades = useMemo(
    () => (studentId ? getStudentReleasedGrades(state, studentId) : []),
    [state, studentId]
  );

  const allAssessments = useMemo(
    () => (studentId ? getStudentAssessments(state, studentId) : []),
    [state, studentId]
  );

  const allSubmissions = useMemo(
    () => (studentId ? getStudentSubmissions(state, studentId) : []),
    [state, studentId]
  );

  const reports = useMemo(
    () => (studentId ? getStudentReports(state, studentId) : []),
    [state, studentId]
  );

  // Learning goal progress (curriculum-driven)
  const goalProgress = useMemo(
    () => (studentId ? computeStudentGoalProgress(state, studentId) : []),
    [state, studentId]
  );

  const goalsWithData = goalProgress.filter((g) => g.assessmentCount > 0).length;

  // Raw assessment map for grade calculation
  const rawAssessmentMap = useMemo(() => {
    const map = new Map<string, Assessment>();
    for (const a of rawAssessments) map.set(a.id, a);
    return map;
  }, [rawAssessments]);

  // Analytics
  const overallAverage = useMemo(() => {
    if (allReleasedGrades.length === 0) return null;
    const percentages = allReleasedGrades
      .map((g) => {
        const a = rawAssessmentMap.get(g.assessmentId);
        if (!a) return null;
        return getGradePercentage(g, a);
      })
      .filter((p): p is number => p !== null);
    if (percentages.length === 0) return null;
    return Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length);
  }, [allReleasedGrades, rawAssessmentMap]);

  const submittedCount = allSubmissions.filter(
    (s) => s.status === "submitted" || s.status === "resubmitted"
  ).length;

  if (loading) return <DetailSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Not signed in"
        description="Please sign in as a student to view your progress."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="My Progress"
        description="Track your grades, learning goals, and reports across all classes"
      />

      {/* Analytics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Overall Average"
          value={overallAverage !== null ? `${overallAverage}%` : "N/A"}
          icon={TrendingUp}
        />
        <StatCard
          label="Assignments Submitted"
          value={`${submittedCount}/${allAssessments.length}`}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Goals Tracked"
          value={`${goalsWithData}/${goalProgress.length}`}
          icon={Target}
        />
        <StatCard
          label="Reports Available"
          value={String(reports.length)}
          icon={FileText}
        />
      </div>

      <Tabs defaultValue="grades">
        <TabsList className="mb-4">
          <TabsTrigger value="grades" className="text-[13px]">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Grades
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-[13px]">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="goals" className="text-[13px]">
            <Target className="h-3.5 w-3.5 mr-1.5" />
            Learning Goals
          </TabsTrigger>
        </TabsList>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <ProgressGradesTab
            enrolledClasses={enrolledClasses}
            allReleasedGrades={allReleasedGrades}
            allAssessments={allAssessments}
            rawAssessmentMap={rawAssessmentMap}
          />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <ProgressReportsTab reports={reports} enrolledClasses={enrolledClasses} />
        </TabsContent>

        {/* Learning Goals Tab */}
        <TabsContent value="goals">
          <LearningGoalTracker goalProgress={goalProgress} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Grades Tab ────────────────────────────────────────────────────────────

function ProgressGradesTab({
  enrolledClasses,
  allReleasedGrades,
  allAssessments,
  rawAssessmentMap,
}: {
  enrolledClasses: import("@/types/class").Class[];
  allReleasedGrades: GradeRecord[];
  allAssessments: import("@/lib/student-permissions").StudentAssessmentView[];
  rawAssessmentMap: Map<string, Assessment>;
}) {
  if (allReleasedGrades.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No grades released yet"
        description="Grades will appear here once your teachers release them."
      />
    );
  }

  // Group by class
  const gradesByClass = new Map<string, GradeRecord[]>();
  for (const g of allReleasedGrades) {
    const list = gradesByClass.get(g.classId) ?? [];
    list.push(g);
    gradesByClass.set(g.classId, list);
  }

  const assessmentMap = new Map(allAssessments.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      {Array.from(gradesByClass.entries()).map(([classId, grades]) => {
        const cls = enrolledClasses.find((c) => c.id === classId);
        // Compute class average
        const percentages = grades
          .map((g) => {
            const a = rawAssessmentMap.get(g.assessmentId);
            if (!a) return null;
            return getGradePercentage(g, a);
          })
          .filter((p): p is number => p !== null);
        const avg = percentages.length > 0
          ? Math.round(percentages.reduce((s, p) => s + p, 0) / percentages.length)
          : null;

        return (
          <div key={classId}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-[14px] font-semibold">{cls?.name ?? classId}</h3>
                <Badge variant="outline" className="text-[11px]">
                  {grades.length} grade{grades.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              {avg !== null && (
                <span className={`text-[14px] font-semibold ${
                  avg >= 70 ? "text-[#16a34a]" : avg >= 50 ? "text-[#b45309]" : "text-[#dc2626]"
                }`}>
                  {avg}% avg
                </span>
              )}
            </div>
            <div className="space-y-2">
              {grades.map((grade) => {
                const assessment = assessmentMap.get(grade.assessmentId);
                const rawAssessment = rawAssessmentMap.get(grade.assessmentId);
                const percentage = rawAssessment ? getGradePercentage(grade, rawAssessment) : null;

                return (
                  <Card key={grade.id} className="p-3 gap-0">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate">
                          {assessment?.title ?? grade.assessmentId}
                        </p>
                        {assessment && (
                          <p className="text-[11px] text-muted-foreground">
                            Due {format(new Date(assessment.dueDate), "MMM d")} &middot; {assessment.gradingMode.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {percentage !== null && (
                          <span className={`text-[14px] font-semibold ${
                            percentage >= 70 ? "text-[#16a34a]" : percentage >= 50 ? "text-[#b45309]" : "text-[#dc2626]"
                          }`}>
                            {percentage}%
                          </span>
                        )}
                        <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Reports Tab ───────────────────────────────────────────────────────────

function ProgressReportsTab({
  reports,
  enrolledClasses,
}: {
  reports: import("@/types/report").Report[];
  enrolledClasses: import("@/types/class").Class[];
}) {
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No reports available"
        description="Your reports will appear here once your teachers distribute them."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const cls = enrolledClasses.find((c) => c.id === report.classId);
        return (
          <Link key={report.id} href={`/student/progress/reports/${report.id}`}>
            <Card className="p-4 gap-0 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium">
                    {cls?.name ?? "Report"} Report
                  </p>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground mt-0.5">
                    {report.distributedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.distributedAt), "MMM d, yyyy")}
                      </span>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {report.distributionStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.viewedByStudentAt ? (
                    <Badge variant="secondary" className="text-[10px]">Viewed</Badge>
                  ) : (
                    <Badge className="bg-[#dbeafe] text-[#2563eb] border-transparent text-[10px]">
                      New
                    </Badge>
                  )}
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Learning Goal Tracker ─────────────────────────────────────────────────

function LearningGoalTracker({
  goalProgress,
}: {
  goalProgress: StudentGoalProgress[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const hasAnyData = goalProgress.some((g) => g.assessmentCount > 0);

  if (!hasAnyData) {
    return (
      <EmptyState
        icon={Target}
        title="No learning goal data yet"
        description="Your mastery levels will appear here once your teachers release grades."
      />
    );
  }

  const toggleExpanded = (goalId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  // Group by category
  const categories: { key: string; label: string; goals: StudentGoalProgress[] }[] = [];
  const grouped = new Map<string, StudentGoalProgress[]>();
  for (const g of goalProgress) {
    const list = grouped.get(g.goalCategory) ?? [];
    list.push(g);
    grouped.set(g.goalCategory, list);
  }
  for (const key of ["standard", "atl_skill", "learner_profile"]) {
    const goals = grouped.get(key);
    if (goals && goals.length > 0) {
      categories.push({ key, label: CATEGORY_LABELS[key] ?? key, goals });
    }
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const withData = cat.goals.filter((g) => g.assessmentCount > 0).length;
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[14px] font-semibold">{cat.label}</h3>
              <Badge variant="outline" className="text-[11px]">
                {withData}/{cat.goals.length} tracked
              </Badge>
            </div>
            <div className="space-y-2">
              {cat.goals.map((goal) => {
                const isExpanded = expanded.has(goal.goalId);
                const totalLevels = Object.values(goal.levels).reduce((s, n) => s + n, 0);

                return (
                  <Card key={goal.goalId} className="p-0 gap-0 overflow-hidden">
                    <button
                      className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                      onClick={() => goal.assessmentCount > 0 && toggleExpanded(goal.goalId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {goal.assessmentCount > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )
                          ) : (
                            <div className="w-4" />
                          )}
                          <Badge variant="outline" className="text-[11px] font-mono shrink-0">
                            {goal.goalCode}
                          </Badge>
                          <span className="text-[13px] font-medium truncate">{goal.goalTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {goal.assessmentCount > 0 ? (
                            <>
                              <span className="text-[11px] text-muted-foreground">
                                {goal.assessmentCount} assessment{goal.assessmentCount !== 1 ? "s" : ""}
                              </span>
                              {goal.latestLevel && (
                                <Badge className={`text-[10px] ${MASTERY_COLORS[goal.latestLevel] ?? ""}`}>
                                  {goal.latestLevel.replace(/_/g, " ")}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">No data yet</span>
                          )}
                        </div>
                      </div>

                      {/* Mastery distribution bar */}
                      {totalLevels > 0 && (
                        <div className="flex h-1.5 rounded-full overflow-hidden mt-3 ml-6">
                          {(["exceeding", "meeting", "approaching", "beginning"] as const).map((level) => {
                            const count = goal.levels[level] ?? 0;
                            if (count === 0) return null;
                            const pct = (count / totalLevels) * 100;
                            return (
                              <div
                                key={level}
                                className={`h-full ${MASTERY_BAR_COLORS[level]}`}
                                style={{ width: `${pct}%` }}
                                title={`${level}: ${count}`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </button>

                    {/* Expanded: assessment details */}
                    {isExpanded && goal.assessments.length > 0 && (
                      <div className="border-t bg-muted/20 px-4 py-3 space-y-2">
                        {goal.assessments.map((asmt, i) => (
                          <div
                            key={`${asmt.assessmentId}-${i}`}
                            className="flex items-center justify-between py-1"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium truncate">{asmt.assessmentTitle}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {asmt.className}
                                {asmt.gradedAt && ` · ${format(new Date(asmt.gradedAt), "MMM d")}`}
                              </p>
                            </div>
                            <Badge className={`text-[10px] shrink-0 ml-2 ${MASTERY_COLORS[asmt.level] ?? ""}`}>
                              {asmt.level.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2">
        <span className="text-[11px] text-muted-foreground">Legend:</span>
        {(["exceeding", "meeting", "approaching", "beginning"] as const).map((level) => (
          <span key={level} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${MASTERY_BAR_COLORS[level]}`} />
            <span className="text-[11px] text-muted-foreground capitalize">{level}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
