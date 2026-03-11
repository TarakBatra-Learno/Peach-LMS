"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import {
  getEffectiveParentStudentId,
  getFamilyAssessmentEntries,
  getFamilyVisibleArtifacts,
  getParentChildren,
  getParentProfile,
} from "@/lib/family-selectors";
import { getGradeCellDisplay } from "@/lib/grade-helpers";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { FamilyRequiresChild } from "@/components/family/family-requires-child";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileText, Printer, ArrowLeft, ArrowUpRight } from "lucide-react";

function formatDate(value?: string) {
  if (!value) return "Not shared yet";
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function truncateSubmission(content: string) {
  if (content.length <= 180) return content;
  return `${content.slice(0, 180).trimEnd()}...`;
}

export default function FamilyReportDetailPage() {
  const parentId = useParentId();
  const params = useParams();
  const searchParams = useSearchParams();
  const state = useStore((store) => store);
  const reportId = params.reportId as string;
  const loading = useMockLoading([reportId, parentId]);

  if (loading) return <DetailSkeleton />;

  if (!parentId) {
    return (
      <EmptyState
        icon={FileText}
        title="Not signed in"
        description="Choose a family persona from the entry page to review the report."
      />
    );
  }

  const parent = getParentProfile(state, parentId);
  const children = getParentChildren(state, parentId);
  const queryChildId = searchParams.get("child");
  const fallbackChildId = getEffectiveParentStudentId(state, parentId);
  const childId = queryChildId && children.some((child) => child.id === queryChildId)
    ? queryChildId
    : fallbackChildId;

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No linked children yet"
        description="Reports will appear here once your account is linked to a child."
      />
    );
  }

  if (!childId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Report detail" description="Choose one child to continue." />
        <FamilyRequiresChild
          title="Choose one child"
          description="Narrative report detail stays focused on one child at a time."
        />
      </div>
    );
  }

  const child = children.find((entry) => entry.id === childId);
  const report = state.reports.find(
    (entry) => entry.id === reportId && entry.studentId === childId && entry.distributionStatus === "completed"
  );

  if (!report) {
    return (
      <EmptyState
        icon={FileText}
        title="Report not found"
        description="This report either is not available for the selected child or has not been distributed to families."
      />
    );
  }

  const cycle = state.reportCycles.find((entry) => entry.id === report.cycleId);
  const cls = state.classes.find((entry) => entry.id === report.classId);
  const releasedAssessments = getFamilyAssessmentEntries(state, parentId, childId)
    .filter((entry) => entry.assessment.classId === report.classId && entry.grade)
    .slice(0, 4);
  const submittedAssessments = getFamilyAssessmentEntries(state, parentId, childId)
    .filter((entry) => entry.assessment.classId === report.classId && entry.submission)
    .slice(0, 4);
  const sharedArtifacts = getFamilyVisibleArtifacts(state, parentId, childId)
    .filter((artifact) => artifact.classId === report.classId)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <Link href="/family/reports" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to reports
      </Link>

      <PageHeader
        title={cycle?.name ?? "Progress report"}
        description={`${child?.firstName} ${child?.lastName} · ${cls?.name ?? "Class"}`}
        primaryAction={{
          label: "Print",
          icon: Printer,
          onClick: () => window.print(),
        }}
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge status="distributed" showIcon={false} />
          <Badge variant="outline">{cycle?.term}</Badge>
          <Badge variant="secondary">Shared {formatDate(report.distributedAt ?? report.publishedAt)}</Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {report.sections
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((section) => {
              if (section.type === "teacher_comment") {
                const text = typeof section.content.text === "string"
                  ? section.content.text
                  : typeof section.content.comment === "string"
                    ? section.content.comment
                    : "A narrative comment will appear here once it is added to the report.";
                return (
                  <Card key={section.configId} className="gap-0 p-5">
                    <h2 className="text-[16px] font-semibold">{section.label}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-muted-foreground">
                      {text}
                    </p>
                  </Card>
                );
              }

              if (section.type === "attendance") {
                const present = Number(section.content.present ?? 0);
                const absent = Number(section.content.absent ?? 0);
                const late = Number(section.content.late ?? 0);
                const total = Number(section.content.total ?? 0);

                return (
                  <Card key={section.configId} className="gap-0 p-5">
                    <h2 className="text-[16px] font-semibold">{section.label}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[
                        { label: "Present", value: present },
                        { label: "Absent", value: absent },
                        { label: "Late", value: late },
                        { label: "Total sessions", value: total },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[14px] border border-border p-3">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-[24px] font-semibold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              }

              return (
                <Card key={section.configId} className="gap-0 p-5">
                  <h2 className="text-[16px] font-semibold">{section.label}</h2>
                  <p className="mt-3 text-[13px] text-muted-foreground">
                    This section is included in the reporting template and is presented below through linked evidence and released results.
                  </p>
                </Card>
              );
            })}

          <Card className="gap-0 p-5">
            <h2 className="text-[16px] font-semibold">Released assessment snapshot</h2>
            {releasedAssessments.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted-foreground">
                No released assessment results were linked to this report yet.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {releasedAssessments.map((entry) => (
                  <Link key={entry.assessment.id} href={`/family/assessments/${entry.assessment.id}?child=${entry.studentId}`} className="rounded-[14px] border border-border p-4 transition-colors hover:bg-muted/40">
                    <p className="text-[13px] font-medium">{entry.assessment.title}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-[24px] font-semibold text-[#c24e3f]">
                        {entry.grade ? getGradeCellDisplay(entry.grade, entry.assessment) : "-"}
                      </p>
                    </div>
                    <p className="mt-2 text-[12px] text-muted-foreground">
                      {entry.grade ? `${entry.grade.gradingMode.replace(/_/g, " ")} result released` : "Released result"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="gap-0 p-5">
            <h2 className="text-[16px] font-semibold">Linked evidence</h2>
            {sharedArtifacts.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted-foreground">
                No family-shared evidence was linked to this report cycle yet.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {sharedArtifacts.map((artifact) => (
                  <Link
                    key={artifact.id}
                    href={`/family/learning?tab=portfolio&artifact=${artifact.id}&child=${report.studentId}`}
                    className="rounded-[14px] border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <p className="text-[13px] font-medium">{artifact.title}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{artifact.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="gap-0 p-5">
            <h2 className="text-[16px] font-semibold">Student work snapshot</h2>
            {submittedAssessments.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted-foreground">
                No visible submission samples were linked to this class yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {submittedAssessments.map((entry) => (
                  <Link
                    key={`submission_${entry.assessment.id}`}
                    href={`/family/assessments/${entry.assessment.id}?child=${entry.studentId}`}
                    className="block rounded-[14px] border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium">{entry.assessment.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {entry.submission?.submittedAt
                            ? `Submitted ${formatDate(entry.submission.submittedAt)}`
                            : "Submission shared"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.submissionStatus} showIcon={false} className="text-[10px]" />
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    {entry.submission?.content && (
                      <p className="mt-3 line-clamp-3 text-[12px] leading-5 text-muted-foreground">
                        {truncateSubmission(entry.submission.content)}
                      </p>
                    )}
                    {entry.submission && entry.submission.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.submission.attachments.slice(0, 3).map((attachment) => (
                          <Badge key={attachment.id} variant="secondary" className="text-[10px]">
                            {attachment.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="gap-0 p-5">
            <h2 className="text-[14px] font-semibold">At a glance</h2>
            <div className="mt-4 space-y-3 text-[13px]">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Student</p>
                <p className="mt-1">{child?.firstName} {child?.lastName}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Programme</p>
                <p className="mt-1">{cls?.programme ?? "IB"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Distributed</p>
                <p className="mt-1">{formatDate(report.distributedAt ?? report.publishedAt)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sections</p>
                <p className="mt-1">{report.sections.length}</p>
              </div>
            </div>
          </Card>

          <Card className="gap-0 p-5">
            <h2 className="text-[14px] font-semibold">Download-ready view</h2>
            <p className="mt-3 text-[13px] text-muted-foreground">
              This mock report is already laid out for family reading and printing. Use the print action above to demo an export-ready surface.
            </p>
            <Button variant="outline" className="mt-4 w-full" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" />
              Print report
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
