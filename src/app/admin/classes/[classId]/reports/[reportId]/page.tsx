"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";
import { useStore } from "@/stores";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminEmbeddedSurfacePage } from "@/features/admin/components/admin-embedded-surface-page";
import { getAdminClassWorkspaceHref } from "@/lib/admin-embed-routes";

export default function AdminClassReportDetailPage() {
  const params = useParams();
  const classId = params.classId as string;
  const reportId = params.reportId as string;

  const classes = useStore((store) => store.classes);
  const students = useStore((store) => store.students);
  const reports = useStore((store) => store.reports);
  const reportCycles = useStore((store) => store.reportCycles);

  const cls = classes.find((entry) => entry.id === classId);
  const report = reports.find((entry) => entry.id === reportId);
  const student = report
    ? students.find((entry) => entry.id === report.studentId)
    : null;
  const cycle = report
    ? reportCycles.find((entry) => entry.id === report.cycleId)
    : null;

  if (!cls || !report) {
    return (
      <EmptyState
        icon={FileText}
        title="Report not found"
        description="This report is not available in the seeded prototype data."
      />
    );
  }

  return (
    <AdminEmbeddedSurfacePage
      title={`${student?.firstName ?? "Student"} ${student?.lastName ?? ""}`.trim()}
      description={`${cls.name} · ${cycle?.name ?? "Report cycle"} · Embedded live report detail`}
      backHref={getAdminClassWorkspaceHref(classId, { tab: "reports" })}
      backLabel={`Back to ${cls.name}`}
      badges={
        <>
          <StatusBadge status={report.publishState} />
          {cycle ? <Badge variant="outline">{cycle.term}</Badge> : null}
        </>
      }
      panelTitle="Embedded live report view"
      panelDescription="This is the existing teacher report detail inside admin, so report sections, evidence, and publishing context stay intact while leadership navigation remains unchanged."
      embedTitle="Live report detail"
      embedSrc={`/reports/${reportId}?embed=1`}
      minHeight={1900}
    />
  );
}
