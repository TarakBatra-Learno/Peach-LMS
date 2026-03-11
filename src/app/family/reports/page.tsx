"use client";

import Link from "next/link";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { getEffectiveParentStudentId, getFamilyVisibleReports, getParentChildren, getParentProfile } from "@/lib/family-selectors";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { FamilyRequiresChild } from "@/components/family/family-requires-child";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileText } from "lucide-react";

function formatDate(value?: string) {
  if (!value) return "Not shared yet";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FamilyReportsPage() {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const loading = useMockLoading([parentId]);

  if (loading) {
    return (
      <>
        <PageHeader title="Reports" description="Published narrative reports and family-facing progress snapshots" />
        <CardGridSkeleton count={4} />
      </>
    );
  }

  if (!parentId) {
    return (
      <EmptyState
        icon={FileText}
        title="Not signed in"
        description="Choose a family persona from the entry page to review distributed reports."
      />
    );
  }

  const parent = getParentProfile(state, parentId);
  const children = getParentChildren(state, parentId);
  const childId = getEffectiveParentStudentId(state, parentId);

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No linked children yet"
        description="Reports will appear here once your family account is linked to a child."
      />
    );
  }

  if (!childId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Choose one child to review narrative reports and published progress." />
        <FamilyRequiresChild
          title="Choose one child for report detail"
          description="Reports stay focused on one child at a time so the narrative, attendance summary, and linked evidence stay easy to read."
        />
      </div>
    );
  }

  const child = children.find((entry) => entry.id === childId);
  const reports = getFamilyVisibleReports(state, parentId, childId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`Published and distributed reports for ${child?.firstName}.`}
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{child?.gradeLevel}</Badge>
          <Badge variant="secondary">{reports.length} available</Badge>
        </div>
      </PageHeader>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports available yet"
          description="Reports will appear here when the school distributes them to families."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {reports.map((report) => {
            const cycle = state.reportCycles.find((entry) => entry.id === report.cycleId);
            const cls = state.classes.find((entry) => entry.id === report.classId);
            return (
              <Link
                key={report.id}
                href={`/family/reports/${report.id}?child=${report.studentId}`}
                className="block"
              >
                <Card className="gap-0 p-5 transition-colors hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">
                        {cycle?.name ?? "Progress report"}
                      </p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {cls?.name ?? "Class"} · {formatDate(report.distributedAt ?? report.publishedAt)}
                      </p>
                    </div>
                    <StatusBadge status="distributed" showIcon={false} className="text-[10px]" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {cycle?.term}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {report.sections.length} sections
                    </Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
