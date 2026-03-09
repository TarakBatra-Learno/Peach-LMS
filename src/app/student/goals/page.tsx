"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  getStudentPersonalGoals,
  getStudentClasses,
  getGoalEvidenceCount,
  getGoalEvidenceLinks,
} from "@/lib/student-selectors";
import { GoalCreateDrawer } from "@/components/student/goal-create-drawer";
import {
  Target,
  Plus,
  AlertCircle,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { GoalStatus } from "@/types/student-goal";

const STATUS_OPTIONS: { label: string; value: GoalStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

export default function StudentGoalsPage() {
  const studentId = useStudentId();
  const loading = useMockLoading([studentId]);
  const state = useStore((s) => s);

  const [createOpen, setCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<GoalStatus | "all">("all");

  const enrolledClasses = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );

  const goals = useMemo(
    () =>
      studentId
        ? getStudentPersonalGoals(
            state,
            studentId,
            filterStatus === "all" ? undefined : filterStatus
          )
        : [],
    [state, studentId, filterStatus]
  );

  const activeCount = useMemo(
    () =>
      studentId
        ? getStudentPersonalGoals(state, studentId, "active").length
        : 0,
    [state, studentId]
  );

  if (loading) return <DetailSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Not signed in"
        description="Please sign in as a student to view your goals."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="My Goals"
        description={
          activeCount > 0
            ? `${activeCount} active goal${activeCount !== 1 ? "s" : ""}`
            : "Set personal intentions and collect evidence of growth"
        }
        primaryAction={{
          label: "New goal",
          icon: Plus,
          onClick: () => setCreateOpen(true),
        }}
      />

      {/* Status filter */}
      <div className="flex gap-1.5 mb-5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
              filterStatus === opt.value
                ? "bg-[#c24e3f] text-white border-[#c24e3f]"
                : "text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setFilterStatus(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={filterStatus !== "all" ? `No ${filterStatus} goals` : "No goals yet"}
          description={
            filterStatus !== "all"
              ? `You don't have any ${filterStatus} goals. Try changing the filter.`
              : "Create your first personal goal to start collecting evidence of your growth."
          }
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              state={state}
              classes={enrolledClasses}
            />
          ))}
        </div>
      )}

      <GoalCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        studentId={studentId}
        enrolledClasses={enrolledClasses}
      />
    </div>
  );
}

function GoalCard({
  goal,
  state,
  classes,
}: {
  goal: import("@/types/student-goal").StudentGoal;
  state: import("@/stores/types").AppState;
  classes: import("@/types/class").Class[];
}) {
  const evidenceCount = getGoalEvidenceCount(state, goal.id);
  const evidenceLinks = getGoalEvidenceLinks(state, goal.id);
  const latestEvidence = evidenceLinks[0];

  const linkedClasses = goal.linkedClassIds
    .map((id) => classes.find((c) => c.id === id))
    .filter(Boolean);

  const learningGoals = state.learningGoals.filter((lg) =>
    goal.linkedLearningGoalIds.includes(lg.id)
  );

  return (
    <Link href={`/student/goals/${goal.id}`}>
      <Card className="p-4 gap-0 hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium">{goal.title}</p>
            {goal.description && (
              <p className="text-[13px] text-muted-foreground line-clamp-2 mt-0.5">
                {goal.description}
              </p>
            )}
          </div>
          <StatusBadge status={goal.status} />
        </div>

        {/* Context badges */}
        {(linkedClasses.length > 0 || learningGoals.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {linkedClasses.map((cls) => (
              <Badge key={cls!.id} variant="outline" className="text-[10px]">
                {cls!.name}
              </Badge>
            ))}
            {learningGoals.map((lg) => (
              <Badge key={lg.id} variant="secondary" className="text-[10px]">
                {lg.code}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: evidence count + latest reflection */}
        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            {evidenceCount} evidence
          </span>
          <span>·</span>
          <span>{format(new Date(goal.updatedAt), "MMM d")}</span>
          {latestEvidence && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <MessageSquare className="h-3 w-3 shrink-0" />
                <span className="truncate">{latestEvidence.reflection}</span>
              </span>
            </>
          )}
        </div>
      </Card>
    </Link>
  );
}
