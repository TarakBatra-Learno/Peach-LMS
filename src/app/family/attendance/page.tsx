"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { getFamilyDemoNowMs } from "@/lib/family-demo";
import { getEffectiveParentStudentId, getFamilyAttendanceEntries, getParentChildren, getParentProfile } from "@/lib/family-selectors";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { FamilyRequiresChild } from "@/components/family/family-requires-child";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, AlertTriangle } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FamilyAttendancePage() {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const searchParams = useSearchParams();
  const loading = useMockLoading([parentId]);
  const demoNowMs = getFamilyDemoNowMs();
  const [classFilter, setClassFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("30");

  if (loading) {
    return (
      <>
        <PageHeader title="Attendance" description="Daily and session attendance in a family-safe view" />
        <CardGridSkeleton count={4} />
      </>
    );
  }

  if (!parentId) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Not signed in"
        description="Choose a family persona from the entry page to review attendance."
      />
    );
  }

  const parent = getParentProfile(state, parentId);
  const children = getParentChildren(state, parentId);
  const queryChildId = searchParams.get("child");
  const fallbackChildId = getEffectiveParentStudentId(state, parentId);
  const childId =
    queryChildId && children.some((entry) => entry.id === queryChildId)
      ? queryChildId
      : fallbackChildId;

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No linked children yet"
        description="Attendance records will appear here once your family account is linked."
      />
    );
  }

  if (!childId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance" description="Choose one child to review detailed attendance history." />
        <FamilyRequiresChild
          title="Choose one child for attendance detail"
          description="Attendance history, notes, and patterns stay scoped to one child at a time."
        />
      </div>
    );
  }

  const child = children.find((entry) => entry.id === childId);
  const classOptions = state.classes
    .filter((entry) => child?.classIds.includes(entry.id))
    .map((entry) => ({ value: entry.id, label: entry.subject }));
  const cutoffDays = Number(rangeFilter);
  const cutoff = demoNowMs - cutoffDays * 24 * 60 * 60 * 1000;

  const entries = getFamilyAttendanceEntries(state, parentId, childId).filter((entry) => {
    if (classFilter !== "all" && entry.classId !== classFilter) return false;
    return new Date(entry.date).getTime() >= cutoff;
  });

  const summary = {
    present: entries.filter((entry) => entry.record.status === "present").length,
    absent: entries.filter((entry) => entry.record.status === "absent").length,
    late: entries.filter((entry) => entry.record.status === "late").length,
    excused: entries.filter((entry) => entry.record.status === "excused").length,
  };

  const alertCount = entries.filter((entry) => entry.record.status === "absent" || entry.record.status === "late").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={`A clear attendance record for ${child?.firstName}.`}
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{child?.gradeLevel}</Badge>
          <Badge variant="secondary">Last {rangeFilter} days</Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Present" value={summary.present} icon={CheckSquare} />
        <StatCard label="Absent" value={summary.absent} icon={AlertTriangle} />
        <StatCard label="Late" value={summary.late} icon={Clock} />
        <StatCard label="Family alerts" value={alertCount} icon={AlertTriangle} />
      </div>

      <FilterBar
        filters={[
          {
            key: "class",
            label: "Class",
            options: [{ value: "all", label: "All classes" }, ...classOptions],
            value: classFilter,
            onChange: setClassFilter,
          },
          {
            key: "range",
            label: "Range",
            options: [
              { value: "14", label: "Last 14 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last term" },
            ],
            value: rangeFilter,
            onChange: setRangeFilter,
          },
        ]}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No attendance records in this range"
          description="Try a wider date range or check back after the next school day."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="gap-0 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium">{entry.className}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{formatDate(entry.date)}</p>
                </div>
                <StatusBadge status={entry.record.status} showIcon={false} />
              </div>
              {(entry.record.status === "late" || entry.record.status === "excused") && entry.record.note && (
                <p className="mt-3 text-[12px] text-muted-foreground">
                  {entry.record.note}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
