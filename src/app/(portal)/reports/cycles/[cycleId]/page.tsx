"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Send,
  Eye,
  AlertCircle,
  Lock,
  Unlock,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function ReportCycleDetailPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const loading = useMockLoading([cycleId]);

  const reportCycles = useStore((s) => s.reportCycles);
  const reports = useStore((s) => s.reports);
  const getReportsByCycle = useStore((s) => s.getReportsByCycle);
  const updateReportCycle = useStore((s) => s.updateReportCycle);
  const getStudentById = useStore((s) => s.getStudentById);
  const getClassById = useStore((s) => s.getClassById);
  const reportTemplates = useStore((s) => s.reportTemplates);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const cycle = reportCycles.find((c) => c.id === cycleId);
  const cycleReports = getReportsByCycle(cycleId);

  if (loading) return <DetailSkeleton />;
  if (!cycle)
    return (
      <EmptyState
        icon={AlertCircle}
        title="Cycle not found"
        description="This report cycle does not exist."
      />
    );

  // Stats
  const totalReports = cycleReports.length;
  const drafts = cycleReports.filter(
    (r) => r.publishState === "draft"
  ).length;
  const published = cycleReports.filter(
    (r) => r.publishState === "published" || r.publishState === "ready"
  ).length;
  const distributed = cycleReports.filter(
    (r) => r.publishState === "distributed"
  ).length;

  const isClosed = cycle.status === "closed";

  const handleToggleCycleStatus = () => {
    if (isClosed) {
      updateReportCycle(cycleId, { status: "open" });
      toast.success("Report cycle reopened");
    } else {
      updateReportCycle(cycleId, { status: "closed" });
      toast.success("Report cycle closed");
    }
  };

  return (
    <div>
      <PageHeader
        title={cycle.name}
        description={`${cycle.term} \u00b7 ${cycle.academicYear} \u00b7 ${format(parseISO(cycle.startDate), "MMM d")} \u2013 ${format(parseISO(cycle.endDate), "MMM d, yyyy")}`}
        primaryAction={{
          label: isClosed ? "Reopen Cycle" : "Close Cycle",
          onClick: () => setConfirmOpen(true),
          icon: isClosed ? Unlock : Lock,
        }}
      >
        <div className="flex gap-2 mt-2">
          <StatusBadge status={cycle.status} />
          <Badge variant="outline" className="text-[11px]">
            {cycle.classIds.length} class{cycle.classIds.length !== 1 && "es"}
          </Badge>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Reports" value={totalReports} icon={FileText} />
        <StatCard label="Drafts" value={drafts} icon={ClipboardCheck} />
        <StatCard label="Published" value={published} icon={Eye} />
        <StatCard label="Distributed" value={distributed} icon={Send} />
      </div>

      {/* Report list */}
      {cycleReports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports"
          description="No reports have been generated for this cycle yet."
        />
      ) : (
        <Card className="p-5 gap-0">
          <p className="text-[13px] text-muted-foreground mb-4">
            Student reports in this cycle
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Student
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    Class
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    Template
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {cycleReports.map((report) => {
                  const student = getStudentById(report.studentId);
                  const cls = getClassById(report.classId);
                  const template = reportTemplates.find(
                    (t) => t.id === report.templateId
                  );
                  return (
                    <tr
                      key={report.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2 pr-4">
                        <Link
                          href={`/reports/${report.id}`}
                          className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors"
                        >
                          {student
                            ? `${student.firstName} ${student.lastName}`
                            : "Unknown Student"}
                        </Link>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {cls?.name || "\u2014"}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {template?.name || "\u2014"}
                      </td>
                      <td className="text-center py-2 px-2">
                        <StatusBadge status={report.publishState} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isClosed ? "Reopen Report Cycle" : "Close Report Cycle"}
        description={
          isClosed
            ? "Reopening this cycle will allow editing of reports again. Are you sure?"
            : "Closing this cycle will prevent further edits to reports. Are you sure?"
        }
        confirmLabel={isClosed ? "Reopen" : "Close Cycle"}
        onConfirm={handleToggleCycleStatus}
        destructive={!isClosed}
      />
    </div>
  );
}
