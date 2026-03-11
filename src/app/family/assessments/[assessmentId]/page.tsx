"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { getFamilyAssessmentEntries, getFamilyVisibleArtifacts, getParentChildren, getParentProfile, getEffectiveParentStudentId } from "@/lib/family-selectors";
import { getGradeCellDisplay, getGradePercentage } from "@/lib/grade-helpers";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { FamilyRequiresChild } from "@/components/family/family-requires-child";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Target, ArrowLeft, FileText, ArrowUpRight } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function truncateSubmission(content: string) {
  if (content.length <= 220) return content;
  return `${content.slice(0, 220).trimEnd()}...`;
}

export default function FamilyAssessmentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const parentId = useParentId();
  const assessmentId = params.assessmentId as string;
  const loading = useMockLoading([assessmentId, parentId]);
  const state = useStore((store) => store);

  if (loading) return <DetailSkeleton />;

  if (!parentId) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Not signed in"
        description="Choose a family persona from the entry page to review assessment detail."
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
        icon={ClipboardCheck}
        title="No linked children yet"
        description="Assessment detail will appear here once your family account is linked."
      />
    );
  }

  if (!childId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment detail" description="Choose one child to continue." />
        <FamilyRequiresChild
          title="Choose one child"
          description="Assessment detail stays focused on one child at a time so due dates, submissions, and released results remain clear."
        />
      </div>
    );
  }

  const child = children.find((entry) => entry.id === childId);
  const assessmentEntry = getFamilyAssessmentEntries(state, parentId, childId).find(
    (entry) => entry.assessment.id === assessmentId
  );

  if (!assessmentEntry) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Assessment not found"
        description="This assessment either has not been shared with families or does not belong to the selected child."
      />
    );
  }

  const relatedEvidence = getFamilyVisibleArtifacts(state, parentId, childId).filter(
    (artifact) => artifact.classId === assessmentEntry.assessment.classId
  );
  const percent = assessmentEntry.grade
    ? getGradePercentage(assessmentEntry.grade, assessmentEntry.assessment)
    : null;

  return (
    <div className="space-y-6">
      <Link href="/family/assessments" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to assessments
      </Link>

      <PageHeader
        title={assessmentEntry.assessment.title}
        description={`${assessmentEntry.className} · ${child?.firstName ?? assessmentEntry.studentName}`}
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{assessmentEntry.assessment.gradingMode.replace(/_/g, " ")}</Badge>
          <Badge variant="secondary">Due {formatDate(assessmentEntry.assessment.dueDate)}</Badge>
          <StatusBadge status={assessmentEntry.submissionStatus} showIcon={false} />
          {assessmentEntry.grade && <StatusBadge status="released" showIcon={false} />}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {assessmentEntry.assessment.studentInstructions && (
            <Card className="gap-0 p-5">
              <h2 className="text-[16px] font-semibold">Instructions</h2>
              <p className="mt-3 whitespace-pre-wrap text-[13px] text-muted-foreground">
                {assessmentEntry.assessment.studentInstructions}
              </p>
            </Card>
          )}

          {assessmentEntry.assessment.description && (
            <Card className="gap-0 p-5">
              <h2 className="text-[16px] font-semibold">About this assessment</h2>
              <p className="mt-3 whitespace-pre-wrap text-[13px] text-muted-foreground">
                {assessmentEntry.assessment.description}
              </p>
            </Card>
          )}

          <Card className="gap-0 p-5">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <FileText className="h-4 w-4 text-[#c24e3f]" />
              Student submission
            </h2>
            {!assessmentEntry.submission ? (
              <p className="mt-3 text-[13px] text-muted-foreground">
                No student submission is visible yet. Families can still track the due date and released result when one is shared.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={assessmentEntry.submissionStatus} showIcon={false} />
                  {assessmentEntry.submission.submittedAt && (
                    <Badge variant="outline" className="text-[10px]">
                      Submitted {formatDate(assessmentEntry.submission.submittedAt)}
                    </Badge>
                  )}
                  {assessmentEntry.submission.isLate && (
                    <Badge variant="outline" className="border-[#c24e3f]/30 text-[10px] text-[#c24e3f]">
                      Submitted after the due date
                    </Badge>
                  )}
                </div>

                <Card className="gap-0 border-border/60 bg-muted/30 p-4">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                    Submission excerpt
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6">
                    {truncateSubmission(assessmentEntry.submission.content)}
                  </p>
                </Card>

                {assessmentEntry.submission.attachments.length > 0 && (
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                      Included attachments
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {assessmentEntry.submission.attachments.map((attachment) => (
                        <Badge key={attachment.id} variant="secondary" className="text-[10px]">
                          {attachment.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {assessmentEntry.grade ? (
            <Card className="gap-0 p-5">
              <h2 className="text-[16px] font-semibold">Released result</h2>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[32px] font-semibold text-[#c24e3f]">
                    {getGradeCellDisplay(assessmentEntry.grade, assessmentEntry.assessment)}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {percent !== null ? `${percent}% equivalent` : "Shared in family-safe format"}
                  </p>
                </div>
                <StatusBadge status="released" />
              </div>

              {assessmentEntry.grade.feedback && (
                <Card className="mt-5 gap-0 border-[#c24e3f]/15 bg-[#fff2f0]/60 p-4">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                    Teacher feedback
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px]">
                    {assessmentEntry.grade.feedback}
                  </p>
                </Card>
              )}
            </Card>
          ) : (
            <Card className="gap-0 p-5">
              <h2 className="text-[16px] font-semibold">Result</h2>
              <p className="mt-3 text-[13px] text-muted-foreground">
                Results will appear here only after they are released for family view.
              </p>
            </Card>
          )}

          <Card className="gap-0 p-5">
            <h2 className="text-[16px] font-semibold">Related learning evidence</h2>
            {relatedEvidence.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted-foreground">
                No related evidence has been shared for this class yet.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {relatedEvidence.slice(0, 4).map((artifact) => (
                  <Link
                    key={artifact.id}
                    href={`/family/learning?tab=portfolio&artifact=${artifact.id}&child=${assessmentEntry.studentId}`}
                    className="rounded-[14px] border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <p className="text-[13px] font-medium">{artifact.title}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{artifact.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="gap-0 p-5">
            <h2 className="text-[14px] font-semibold">Details</h2>
            <div className="mt-4 space-y-3 text-[13px]">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Child</p>
                <p className="mt-1">{child?.firstName} {child?.lastName}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Due date</p>
                <p className="mt-1">{formatDate(assessmentEntry.assessment.dueDate)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Submission status</p>
                <div className="mt-1">
                  <StatusBadge status={assessmentEntry.submissionStatus} showIcon={false} />
                </div>
              </div>
              {assessmentEntry.submission?.submittedAt && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Submitted</p>
                  <p className="mt-1">{formatDate(assessmentEntry.submission.submittedAt)}</p>
                </div>
              )}
              {assessmentEntry.submission && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Submission</p>
                  <p className="mt-1">
                    {assessmentEntry.submission.attachments.length > 0
                      ? `${assessmentEntry.submission.attachments.length} attachment${assessmentEntry.submission.attachments.length === 1 ? "" : "s"}`
                      : "Text response"}
                  </p>
                </div>
              )}
              {assessmentEntry.unit && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Unit context</p>
                  <p className="mt-1">{assessmentEntry.unit.title}</p>
                </div>
              )}
            </div>
            {assessmentEntry.unit && (
              <div className="mt-4">
                <Link href={`/family/learning?tab=units&unit=${assessmentEntry.unit.id}&child=${assessmentEntry.studentId}`}>
                  <Button variant="outline" className="w-full justify-between">
                    Open unit context
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="gap-0 p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <Target className="h-4 w-4 text-[#c24e3f]" />
              Learning goals
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {assessmentEntry.assessment.learningGoalIds.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No family-facing goal tags were shared for this assessment.
                </p>
              ) : (
                assessmentEntry.assessment.learningGoalIds.map((goalId) => {
                  const goal = state.learningGoals.find((entry) => entry.id === goalId);
                  return goal ? (
                    <Badge key={goal.id} variant="secondary" className="text-[10px]">
                      {goal.code}
                    </Badge>
                  ) : null;
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
