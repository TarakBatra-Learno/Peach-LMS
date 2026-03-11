"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface ClassReportsTabProps {
  classId: string;
  studentId: string;
}

export function ClassReportsTab({ classId, studentId }: ClassReportsTabProps) {
  const reports = useStore((s) => s.reports);
  const reportCycles = useStore((s) => s.reportCycles);

  const classReports = useMemo(() => {
    return reports
      .filter((r) => {
        if (r.studentId !== studentId) return false;
        if (r.classId !== classId) return false;
        // Only show distributed reports
        if (r.distributionStatus !== "completed") return false;
        return true;
      })
      .map((report) => {
        const cycle = reportCycles.find((c) => c.id === report.cycleId);
        return { report, cycle };
      })
      .sort((a, b) => {
        // Sort by distributedAt descending (most recent first)
        const aDate = a.report.distributedAt ?? "";
        const bDate = b.report.distributedAt ?? "";
        return bDate.localeCompare(aDate);
      });
  }, [reports, reportCycles, classId, studentId]);

  if (classReports.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No reports for this class yet"
        description="Reports will appear here once your teacher has distributed them."
      />
    );
  }

  return (
    <div className="space-y-3">
      {classReports.map(({ report, cycle }, index) => {
        const isLatest = index === 0;

        return (
          <Card
            key={report.id}
            className={`p-4 gap-0 ${isLatest ? "border-[#c24e3f]/30 bg-[#fff8f7]" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-[14px] font-medium truncate">
                    {cycle?.name ?? "Report"}
                  </p>
                  {isLatest && (
                    <Badge className="bg-[#c24e3f] text-white border-transparent text-[10px]">
                      Latest
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-1 ml-6">
                  {cycle?.term && <span>{cycle.term}</span>}
                  {cycle?.academicYear && <span>{cycle.academicYear}</span>}
                  {report.distributedAt && (
                    <span>
                      Distributed {format(new Date(report.distributedAt), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/student/progress/reports/${report.id}`}>
                <Button
                  variant={isLatest ? "default" : "outline"}
                  size="sm"
                  className={`text-[12px] shrink-0 ${isLatest ? "bg-[#c24e3f] hover:bg-[#a8403a]" : ""}`}
                >
                  View report
                </Button>
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
