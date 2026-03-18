"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AssessmentAIReportPanel } from "@/components/assessments/assessment-ai-report-panel";
import { GradingBody, type GradingSheetState } from "@/components/shared/grading-sheet";
import { StatusBadge } from "@/components/shared/status-badge";
import { buildGradePayload } from "@/lib/grade-save";
import {
  GRADING_MODE_LABELS,
  getTeacherReviewStatus,
  isGradingComplete,
} from "@/lib/grade-helpers";
import { getAssessmentIntentLabel, getAssessmentTypeLabel } from "@/lib/assessment-labels";
import { getCanonicalSubmissionStatus } from "@/lib/submission-state";
import type { AssessmentReport } from "@/types/assessment-report";
import type { Assessment } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { Student } from "@/types/student";
import type { Submission } from "@/types/submission";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Paperclip } from "lucide-react";

interface StudentMarkingWorkspaceProps {
  assessment: Assessment;
  student: Student;
  submission: Submission | null;
  grade?: GradeRecord;
  report: AssessmentReport | null;
  state: GradingSheetState;
  onReportChange: (updates: Partial<AssessmentReport>) => void;
  onSaveDraft: () => void;
  onMarkReady: () => void;
  onRelease: () => void;
  backHref: string;
  previousHref?: string | null;
  nextHref?: string | null;
}

function renderSubmissionDetails(submission: Submission | null) {
  if (!submission) {
    return (
      <Card className="p-4">
        <p className="text-[14px] font-medium">No digital submission</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          This learner has no submitted digital artifact yet. Off-platform and teacher-recorded
          evidence can still be reviewed on the right.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {submission.content ? (
        <Card className="p-4">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Written response
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6">{submission.content}</p>
        </Card>
      ) : null}

      {submission.typedPayload?.quiz ? (
        <Card className="p-4">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Quiz response
          </p>
          <p className="mt-2 text-[14px]">
            {submission.typedPayload.quiz.responses.length} of{" "}
            {submission.typedPayload.quiz.questionCount} questions answered
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Auto-score preview: {submission.typedPayload.quiz.autoScore ?? "Pending"}.
          </p>
        </Card>
      ) : null}

      {submission.typedPayload?.chat ? (
        <Card className="p-4">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Conversation transcript
          </p>
          <div className="mt-3 space-y-2">
            {submission.typedPayload.chat.transcript.map((turn) => (
              <div key={turn.id} className="rounded-xl border border-border/70 bg-background px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {turn.role}
                </p>
                <p className="mt-1 text-[13px]">{turn.content}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {submission.typedPayload?.essay ? (
        <Card className="p-4">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Essay response
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6">
            {submission.typedPayload.essay.body}
          </p>
          {submission.typedPayload.essay.wordCount ? (
            <p className="mt-2 text-[12px] text-muted-foreground">
              {submission.typedPayload.essay.wordCount} words
            </p>
          ) : null}
        </Card>
      ) : null}

      {submission.typedPayload?.offPlatform ? (
        <Card className="p-4">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Off-platform evidence
          </p>
          <p className="mt-2 text-[14px]">
            Mode:{" "}
            <span className="font-medium">
              {submission.typedPayload.offPlatform.mode === "offline_mode"
                ? "Offline mode"
                : "Digital submission"}
            </span>
          </p>
          {submission.typedPayload.offPlatform.evidenceSummary ? (
            <p className="mt-1 text-[13px] text-muted-foreground">
              {submission.typedPayload.offPlatform.evidenceSummary}
            </p>
          ) : null}
        </Card>
      ) : null}

      {submission.attachments.length > 0 ? (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
              Attachments
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {submission.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-xl border border-border/70 bg-background px-3 py-2 text-[13px]"
              >
                {attachment.name}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {submission.reflection ? (
        <Card className="p-4">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Student reflection
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6">{submission.reflection}</p>
        </Card>
      ) : null}
    </div>
  );
}

export function StudentMarkingWorkspace({
  assessment,
  student,
  submission,
  grade,
  report,
  state,
  onReportChange,
  onSaveDraft,
  onMarkReady,
  onRelease,
  backHref,
  previousHref,
  nextHref,
}: StudentMarkingWorkspaceProps) {
  const reviewStatus = getTeacherReviewStatus(grade, assessment);
  const submissionStatus = getCanonicalSubmissionStatus(submission?.status);
  const isExcused = state.gradingSubmissionStatus === "excused";
  const completionPayload = buildGradePayload(assessment, student.id, {
    score: state.gradingScore,
    dpGrade: state.gradingDpGrade,
    mypScores: state.gradingMypScores,
    checklistResults: state.gradingChecklistResults,
    rubricScores: state.gradingRubricScores,
    standardsMastery: state.gradingStandardsMastery,
    feedback: state.gradingFeedback,
    submissionStatus: state.gradingSubmissionStatus,
  });
  const isComplete = !isExcused
    ? isGradingComplete(
        {
          id: grade?.id ?? "",
          assessmentId: assessment.id,
          studentId: student.id,
          classId: assessment.classId,
          gradingMode: assessment.gradingMode,
          submissionStatus: state.gradingSubmissionStatus,
          ...completionPayload,
        } as GradeRecord,
        assessment
      )
    : false;
  const typeLabel = getAssessmentTypeLabel(assessment.assessmentType);
  const intentLabel = getAssessmentIntentLabel(assessment.assessmentIntent);
  const statusVariant: "neutral" | "success" | "warning" | "info" =
    reviewStatus === "released"
      ? "success"
      : reviewStatus === "ready"
        ? "warning"
        : reviewStatus === "excused"
          ? "info"
          : "neutral";

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border/70 bg-card px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                <Link href={backHref}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to submissions
                </Link>
              </Button>
              <Badge variant="outline" className="text-[11px]">
                Marking workspace
              </Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Marking workspace</h1>
              <p className="mt-1 text-[15px] font-medium text-foreground">
                {student.firstName} {student.lastName}
              </p>
              <p className="mt-1 text-[14px] text-muted-foreground">
                {assessment.title} · {GRADING_MODE_LABELS[assessment.gradingMode]}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={reviewStatus} variant={statusVariant} />
              <Badge variant="outline" className="text-[11px]">
                {typeLabel}
              </Badge>
              {intentLabel ? (
                <Badge variant="secondary" className="text-[11px]">
                  {intentLabel}
                </Badge>
              ) : null}
              {submissionStatus ? (
                <Badge variant="outline" className="text-[11px]">
                  Submission: {submissionStatus}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <Button variant="outline" size="sm" asChild disabled={!previousHref}>
              {previousHref ? (
                <Link href={previousHref}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" asChild disabled={!nextHref}>
              {nextHref ? (
                <Link href={nextHref}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              ) : (
                <span>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold">Submission evidence</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Review the learner artifact, transcript, or off-platform evidence before
                  finalizing grading and report comments.
                </p>
              </div>
              {submission?.submittedAt ? (
                <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </div>
              ) : null}
            </div>
            <Separator className="my-4" />
            {renderSubmissionDetails(submission)}
          </Card>
        </div>

        <div className="space-y-4">
          <div className="sticky top-4 z-10 rounded-3xl border border-border/80 bg-background/95 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={onSaveDraft}>
                Save draft
              </Button>
              <Button variant="outline" size="sm" onClick={onMarkReady} disabled={!isComplete}>
                Mark ready
              </Button>
              <Button size="sm" onClick={onRelease} disabled={!isComplete}>
                Release outcome
              </Button>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Grading and report edits stay together here so release is a final teacher decision,
              not a second workspace.
            </p>
          </div>

          <Card className="p-5">
            <div>
              <p className="text-[15px] font-semibold">Grade and feedback</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Finalize the academic outcome before you mark the assessment report ready for the
                learner.
              </p>
            </div>
            <Separator className="my-4" />
            <div className="space-y-5">
              <GradingBody assessment={assessment} state={state} isExcused={isExcused} />
            </div>
          </Card>

          <AssessmentAIReportPanel report={report} editable onChange={onReportChange} />
        </div>
      </div>
    </div>
  );
}
