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
  const activeClassId = useStore((s) => s.ui.activeClassId);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const cycle = reportCycles.find((c) => c.id === cycleId);
  const cycleReports = getReportsByCycle(cycleId);

  // Filter reports by macro filter (activeClassId)
  const filteredReports = activeClassId
    ? cycleReports.filter((r) => r.classId === activeClassId)
    : cycleReports;

  // Classes shown: respect macro filter
  const displayClassCount = activeClassId
    ? (cycle?.classIds.includes(activeClassId) ? 1 : 0)
    : (cycle?.classIds.length ?? 0);

  if (loading) return <DetailSkeleton />;
  if (!cycle)
    return (
      <EmptyState
        icon={AlertCircle}
        title="Cycle not found"
        description="This report cycle does not exist."
      />
    );

  // Helper: compute completeness of a report
  const getCompleteness = (report: typeof cycleReports[0]) => {
    const total = report.sections.length;
    if (total === 0) return 0;
    const filled = report.sections.filter((s) => {
      if (s.type === "teacher_comment") {
        const text = (s.content?.comment as string) || (s.content?.text as string) || "";
        return text.trim() !== "";
      }
      if (s.type === "attendance") return s.content?.present != null || s.content?.total != null;
      if (s.type === "portfolio_evidence") return ((s.content?.artifactIds as string[]) || []).length > 0;
      return s.content && Object.keys(s.content).length > 0;
    }).length;
    return Math.round((filled / total) * 100);
  };

  // Get teacher comment preview
  const getCommentPreview = (report: typeof cycleReports[0]) => {
    const commentSection = report.sections.find((s) => s.type === "teacher_comment");
    const text = (commentSection?.content?.comment as string) || (commentSection?.content?.text as string) || "";
    return text.length > 80 ? text.slice(0, 80) + "..." : text || "-";
  };

  // Stats (use filtered reports)
  const totalReports = filteredReports.length;
  const drafts = filteredReports.filter(
    (r) => r.publishState === "draft"
  ).length;
  const published = filteredReports.filter(
    (r) => r.publishState === "published" || r.publishState === "ready"
  ).length;
  const distributed = filteredReports.filter(
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
            {displayClassCount} class{displayClassCount !== 1 && "es"}
          </Badge>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total reports" value={totalReports} icon={FileText} />
        <StatCard label="Drafts" value={drafts} icon={ClipboardCheck} />
        <StatCard label="Published" value={published} icon={Eye} />
        <StatCard label="Distributed" value={distributed} icon={Send} />
      </div>

      {/* Report list */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports"
          description="No reports have been generated for this cycle yet."
        />
      ) : (
        <Card className="p-5 gap-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-muted-foreground">
              {totalReports} report{totalReports !== 1 ? "s" : ""} &middot; {drafts} draft{drafts !== 1 ? "s" : ""} &middot; {published} published &middot; {distributed} distributed
            </p>
          </div>
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
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                    Complete
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    Comment preview
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right py-2 pl-2 font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const student = getStudentById(report.studentId);
                  const cls = getClassById(report.classId);
                  const completeness = getCompleteness(report);
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
                        <Badge variant="outline" className="text-[11px]">
                          {cls?.name || "\u2014"}
                        </Badge>
                      </td>
                      <td className="text-center py-2 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${completeness === 100 ? "bg-green-500" : completeness > 50 ? "bg-amber-500" : "bg-red-400"}`}
                              style={{ width: `${completeness}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground">{completeness}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-[12px] text-muted-foreground truncate max-w-[200px] block">
                          {getCommentPreview(report)}
                        </span>
                      </td>
                      <td className="text-center py-2 px-2">
                        <StatusBadge status={report.publishState} />
                      </td>
                      <td className="text-right py-2 pl-2">
                        <Link href={`/reports/${report.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-[12px]">
                            Edit
                          </Button>
                        </Link>
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
