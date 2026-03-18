"use client";

import { useMemo, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStudentReports } from "@/lib/student-selectors";
import { buildReportPrefillContext } from "@/lib/report-prefill";
import { AddToGoalDialog } from "@/components/student/add-to-goal-dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertCircle,
  Calendar,
  BookOpen,
  CheckCircle2,
  Eye,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function StudentReportDetailPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const studentId = useStudentId();
  const loading = useMockLoading([reportId]);
  const state = useStore((s) => s);
  const updateReport = useStore((s) => s.updateReport);
  const assessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const learningGoals = useStore((s) => s.learningGoals);
  const unitPlans = useStore((s) => s.unitPlans);
  const assessmentReports = useStore((s) => s.assessmentReports);

  const reports = useMemo(
    () => (studentId ? getStudentReports(state, studentId) : []),
    [state, studentId]
  );

  const [addToGoalOpen, setAddToGoalOpen] = useState(false);

  const report = reports.find((r) => r.id === reportId);
  const cls = report ? state.classes.find((c) => c.id === report.classId) : null;
  const cycle = report ? state.reportCycles.find((c) => c.id === report.cycleId) : null;
  const reportPrefillContext = useMemo(
    () =>
      report
        ? buildReportPrefillContext({
            report,
            assessments,
            grades,
            learningGoals,
            unitPlans,
            assessmentReports,
            releasedOnlyAssessmentSources: true,
            releasedOnlySuggestions: true,
          })
        : null,
    [report, assessments, grades, learningGoals, unitPlans, assessmentReports],
  );

  // Record viewedByStudentAt on first view
  useEffect(() => {
    if (report && !report.viewedByStudentAt) {
      updateReport(report.id, { viewedByStudentAt: new Date().toISOString() });
    }
  }, [report, updateReport]);

  if (loading) return <DetailSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Not signed in"
        description="Please sign in as a student to view this report."
      />
    );
  }

  if (!report) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Report not found"
        description="This report doesn't exist or hasn't been distributed yet."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`${cls?.name ?? "Class"} Report`}
        description={cycle?.name ?? "Report details"}
      >
        <div className="flex items-center gap-2 mt-2">
          {report.distributedAt && (
            <Badge variant="outline" className="text-[11px] flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(report.distributedAt), "MMM d, yyyy")}
            </Badge>
          )}
          {report.viewedByStudentAt && (
            <Badge variant="secondary" className="text-[11px] flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Viewed {format(new Date(report.viewedByStudentAt), "MMM d")}
            </Badge>
          )}
        </div>
      </PageHeader>

      <div className="space-y-4">
        {reportPrefillContext ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4 gap-0">
              <h3 className="text-[14px] font-semibold">Assessment signals feeding this report</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Released assessments and standards evidence that shaped the academic summary for this report.
              </p>
              <div className="mt-4 space-y-3">
                {reportPrefillContext.assessmentSources.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    Your released assessment signals will appear here once teachers publish them into the report.
                  </p>
                ) : (
                  reportPrefillContext.assessmentSources.slice(0, 3).map((source) => (
                    <Link
                      key={source.assessmentId}
                      href={`/student/classes/${report.classId}/assessments/${source.assessmentId}`}
                      className="block rounded-xl border border-border/60 p-3 hover:bg-muted/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-medium">{source.assessmentTitle}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {source.gradeLabel}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {source.typeLabel} · {source.intentLabel}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4 gap-0">
              <h3 className="text-[14px] font-semibold">Suggested from released assessment feedback</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                These highlights come from assessment reports that have already been released to you.
              </p>
              <div className="mt-4 space-y-3">
                {reportPrefillContext.aiSuggestionSources.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    No released assessment feedback has been linked into this report yet.
                  </p>
                ) : (
                  reportPrefillContext.aiSuggestionSources.slice(0, 3).map((source) => (
                    <div key={source.reportId} className="rounded-xl border border-border/60 p-3">
                      <p className="text-[13px] font-medium">{source.assessmentTitle}</p>
                      <p className="mt-2 text-[12px] text-muted-foreground line-clamp-2">{source.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {report.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <Card key={section.configId} className="p-5 gap-0">
              <h3 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
                <SectionIcon type={section.type} />
                {section.label}
              </h3>
              <ReportSectionContent section={section} reportPrefillContext={reportPrefillContext} />
            </Card>
          ))}
      </div>

      {/* Add to goal */}
      <Button
        variant="outline"
        size="sm"
        className="mt-4 text-[12px]"
        onClick={() => setAddToGoalOpen(true)}
      >
        <Target className="h-3.5 w-3.5 mr-1.5" />
        Add to a goal
      </Button>

      <div className="mt-6">
        <Link
          href="/student/progress"
          className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1"
        >
          &larr; Back to progress
        </Link>
      </div>

      {report && studentId && (
        <AddToGoalDialog
          open={addToGoalOpen}
          onClose={() => setAddToGoalOpen(false)}
          sourceType="report"
          sourceId={report.id}
          sourceTitle={`${cls?.name ?? "Class"} Report`}
          studentId={studentId}
          surface="report"
        />
      )}
    </div>
  );
}

function SectionIcon({ type }: { type: string }) {
  switch (type) {
    case "grades":
    case "myp_criteria":
    case "dp_grades":
      return <BookOpen className="h-4 w-4 text-muted-foreground" />;
    case "attendance":
      return <Calendar className="h-4 w-4 text-muted-foreground" />;
    case "teacher_comment":
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  }
}

function ReportSectionContent({
  section,
  reportPrefillContext,
}: {
  section: import("@/types/report").ReportSection;
  reportPrefillContext: ReturnType<typeof buildReportPrefillContext> | null;
}) {
  const content = section.content;

  // Render based on section type
  if (section.type === "teacher_comment" || section.type === "custom_text") {
    const text = (content as Record<string, unknown>).text as string | undefined;
    return (
      <p className="text-[13px] text-muted-foreground whitespace-pre-wrap">
        {text ?? "No content available."}
      </p>
    );
  }

  if (section.type === "attendance") {
    const data = content as Record<string, number>;
    return (
      <div className="grid grid-cols-4 gap-3">
        {["present", "absent", "late", "total"].map((key) => (
          <div key={key} className="text-center">
            <p className="text-[20px] font-semibold">{data[key] ?? 0}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{key}</p>
          </div>
        ))}
      </div>
    );
  }

  if (section.type === "grades") {
    const items = (content as Record<string, unknown>).items as Array<Record<string, unknown>> | undefined;
    if (!items?.length) {
      return <p className="text-[13px] text-muted-foreground">No grade data available.</p>;
    }
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <span className="text-[13px]">{String(item.label ?? item.subject ?? "Item")}</span>
            <Badge variant="secondary" className="text-[12px]">
              {String(item.grade ?? item.score ?? item.level ?? "-")}
            </Badge>
          </div>
        ))}
      </div>
    );
  }

  if (section.type === "standards_skills") {
    const skillsFromContent = (content as Record<string, unknown>).skills as Array<Record<string, unknown>> | undefined;
    const derivedSkills = reportPrefillContext
      ? Array.from(
          new Map(
            reportPrefillContext.assessmentSources
              .flatMap((source) => source.standards)
              .map((skill) => [skill.goalId, skill])
          ).values()
        )
      : [];
    const skills = skillsFromContent?.length ? skillsFromContent : derivedSkills;
    if (!skills?.length) {
      return <p className="text-[13px] text-muted-foreground">No standards or skills data available.</p>;
    }

    return (
      <div className="space-y-2">
        {skills.map((skill, i) => {
          const skillRecord = skill as Record<string, unknown>;
          return (
          <div key={i} className="flex items-center justify-between gap-3 py-1">
            <div>
              <p className="text-[13px] font-medium">
                {String(skillRecord.title ?? skillRecord.label ?? "Learning target")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {[skillRecord.code, skillRecord.category].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Badge variant="secondary" className="text-[12px]">
              {String(skillRecord.level ?? "Not assessed")}
            </Badge>
          </div>
        )})}
      </div>
    );
  }

  // Generic fallback: render content as key-value pairs
  const entries = Object.entries(content).filter(
    ([, v]) => typeof v === "string" || typeof v === "number"
  );
  if (entries.length === 0) {
    return <p className="text-[13px] text-muted-foreground">Section content available in full report.</p>;
  }
  return (
    <div className="space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between py-1">
          <span className="text-[13px] text-muted-foreground capitalize">
            {key.replace(/_/g, " ")}
          </span>
          <span className="text-[13px] font-medium">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}
