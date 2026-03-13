"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";
import { useStore } from "@/stores";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminEmbeddedSurfacePage } from "@/features/admin/components/admin-embedded-surface-page";
import { getAdminStudentWorkspaceHref } from "@/lib/admin-embed-routes";

export default function AdminStudentReportDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  const reportId = params.reportId as string;
  const classId = searchParams.get("classId");

  const getStudentById = useStore((store) => store.getStudentById);
  const classes = useStore((store) => store.classes);
  const reports = useStore((store) => store.reports);
  const reportCycles = useStore((store) => store.reportCycles);

  const student = getStudentById(studentId);
  const report = reports.find((entry) => entry.id === reportId);
  const cls = classId
    ? classes.find((entry) => entry.id === classId)
    : report
      ? classes.find((entry) => entry.id === report.classId)
      : null;
  const cycle = report
    ? reportCycles.find((entry) => entry.id === report.cycleId)
    : null;

  if (!student || !report) {
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
      title={`${student.firstName} ${student.lastName}`}
      description={`${cycle?.name ?? "Report cycle"} · Embedded live report detail`}
      backHref={getAdminStudentWorkspaceHref(studentId, {
        classId,
        tab: "reports",
      })}
      backLabel={`Back to ${student.firstName}`}
      badges={
        <>
          <StatusBadge status={report.publishState} />
          {cls ? <Badge variant="outline">{cls.name}</Badge> : null}
        </>
      }
      panelTitle="Embedded live report view"
      panelDescription="This keeps the admin student workspace in place while reusing the full seeded report detail surface for the selected learner."
      embedTitle="Live report detail"
      embedSrc={`/reports/${reportId}?embed=1`}
      minHeight={1900}
    />
  );
}
