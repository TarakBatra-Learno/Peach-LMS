"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmissionWorkbook } from "@/components/student/submission-workbook";
import { GradeFeedbackViewer } from "@/components/student/grade-feedback-viewer";
import {
  getStudentAssessments,
  getStudentSubmission,
  getStudentSubmissionStatus,
  getStudentReleasedGrades,
} from "@/lib/student-selectors";
import { isAssessmentOpenForSubmission, isAssessmentPastDue } from "@/lib/student-permissions";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddToGoalDialog } from "@/components/student/add-to-goal-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Calendar,
  BookOpen,
  ExternalLink,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Assessment } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import { isSubmissionSubmitted } from "@/lib/submission-state";

/** Wrapper that marks grade as seen on first view */
function GradeFeedbackViewerWithTracking({ grade, assessment }: { grade: GradeRecord; assessment: Assessment }) {
  const updateGrade = useStore((s) => s.updateGrade);

  useEffect(() => {
    if (grade.reportStatus === "unseen") {
      updateGrade(grade.id, { reportStatus: "seen" });
    }
    // Only run on initial mount / when grade id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade.id]);

  return <GradeFeedbackViewer grade={grade} assessment={assessment} />;
}

/** Read-only criteria panel showing grading structure */
function GradingCriteriaPanel({ assessment }: { assessment: Assessment }) {
  // Only render if there are criteria to show
  const hasCriteria =
    (assessment.gradingMode === "rubric" && assessment.rubric?.length) ||
    (assessment.gradingMode === "checklist" && assessment.checklist?.length) ||
    (assessment.gradingMode === "myp_criteria" && assessment.mypCriteria?.length) ||
    (assessment.gradingMode === "score" && assessment.totalPoints) ||
    assessment.gradingMode === "dp_scale";

  if (!hasCriteria) return null;

  return (
    <Card className="p-5 gap-0">
      <h3 className="text-[16px] font-semibold mb-3">Grading criteria</h3>

      {/* Score mode */}
      {assessment.gradingMode === "score" && assessment.totalPoints && (
        <p className="text-[13px] text-muted-foreground">
          Scored out of {assessment.totalPoints} points
        </p>
      )}

      {/* DP Scale */}
      {assessment.gradingMode === "dp_scale" && (
        <p className="text-[13px] text-muted-foreground">
          IB Diploma scale (1-7)
        </p>
      )}

      {/* Rubric */}
      {assessment.gradingMode === "rubric" && assessment.rubric && (
        <div className="space-y-3">
          {assessment.rubric.map((criterion) => (
            <div key={criterion.id}>
              <p className="text-[13px] font-medium">{criterion.title}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {criterion.levels.map((level) => (
                  <Badge key={level.id} variant="outline" className="text-[11px] font-normal">
                    {level.label} ({level.points} pts)
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checklist */}
      {assessment.gradingMode === "checklist" && assessment.checklist && (
        <div className="space-y-1.5">
          {assessment.checklist.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <div className="h-4 w-4 rounded border border-border mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px]">{item.label}</p>
                {item.helpText && (
                  <p className="text-[11px] text-muted-foreground">{item.helpText}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MYP Criteria */}
      {assessment.gradingMode === "myp_criteria" && assessment.mypCriteria && (
        <div className="space-y-3">
          {assessment.mypCriteria.map((c) => (
            <div key={c.id}>
              <p className="text-[13px] font-medium">
                Criterion {c.criterion}: {c.title}
              </p>
              <p className="text-[12px] text-muted-foreground">
                Levels 0-{c.maxLevel}
              </p>
              {c.strandDescriptors.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {c.strandDescriptors.map((desc, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-muted-foreground/50 mt-px">-</span>
                      {desc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function StudentAssessmentDetailPage() {
  const params = useParams();
  const classId = params.classId as string;
  const assessmentId = params.assessmentId as string;
  const studentId = useStudentId();
  const loading = useMockLoading([assessmentId]);

  const state = useStore((s) => s);
  const rawAssessments = useStore((s) => s.assessments);
  const learningGoals = useStore((s) => s.learningGoals);

  // Get student-projected assessment
  const projectedAssessments = useMemo(
    () => (studentId ? getStudentAssessments(state, studentId, classId) : []),
    [state, studentId, classId]
  );
  const projectedAssessment = projectedAssessments.find((a) => a.id === assessmentId);

  // Raw assessment for grade calc + open-for-submission check
  const rawAssessment = rawAssessments.find((a) => a.id === assessmentId);

  // Submission
  const submission = useMemo(
    () => (studentId ? getStudentSubmission(state, studentId, assessmentId) : undefined),
    [state, studentId, assessmentId]
  );

  // Released grade (if any)
  const releasedGrades = useMemo(
    () => (studentId ? getStudentReleasedGrades(state, studentId, classId) : []),
    [state, studentId, classId]
  );
  const grade = releasedGrades.find((g) => g.assessmentId === assessmentId);

  // Linked unit plan
  const unitPlan = projectedAssessment?.unitId
    ? state.unitPlans.find((u) => u.id === projectedAssessment.unitId) ?? null
    : null;

  // Resolve learning goals
  const assessmentGoals = projectedAssessment?.learningGoalIds?.length
    ? projectedAssessment.learningGoalIds
        .map((id) => learningGoals.find((g) => g.id === id))
        .filter(Boolean)
    : [];

  const [addToGoalOpen, setAddToGoalOpen] = useState(false);

  const isOpen = rawAssessment ? isAssessmentOpenForSubmission(rawAssessment) : false;
  const isPastDue = rawAssessment ? isAssessmentPastDue(rawAssessment) : false;

  // Canonical submission status
  const submissionStatusValue = rawAssessment
    ? getStudentSubmissionStatus(
        state.grades.find((g) => g.studentId === studentId && g.assessmentId === assessmentId),
        submission,
        rawAssessment
      )
    : "due";

  if (loading) return <DetailSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Not signed in"
        description="Please sign in as a student to view this assessment."
      />
    );
  }

  if (!projectedAssessment || !rawAssessment) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Assessment not found"
        description="This assessment doesn't exist, isn't published, or you're not enrolled in the class."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={projectedAssessment.title}
        description={`Due ${format(new Date(projectedAssessment.dueDate), "EEEE, MMMM d, yyyy")}`}
      >
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-[11px]">
            {projectedAssessment.gradingMode.replace(/_/g, " ")}
          </Badge>
          {projectedAssessment.totalPoints != null && projectedAssessment.gradingMode === "score" && (
            <Badge variant="secondary" className="text-[11px]">
              {projectedAssessment.totalPoints} points
            </Badge>
          )}
          <StatusBadge status={submissionStatusValue} showIcon={false} />
          {grade && (
            <StatusBadge status="graded" showIcon={false} />
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Instructions */}
          {projectedAssessment.studentInstructions && (
            <Card className="p-5 gap-0">
              <h3 className="text-[16px] font-semibold mb-3">Instructions</h3>
              <p className="text-[13px] whitespace-pre-wrap">
                {projectedAssessment.studentInstructions}
              </p>
            </Card>
          )}

          {/* Description */}
          {projectedAssessment.description && (
            <Card className="p-5 gap-0">
              <h3 className="text-[16px] font-semibold mb-3">Description</h3>
              <p className="text-[13px] text-muted-foreground whitespace-pre-wrap">
                {projectedAssessment.description}
              </p>
            </Card>
          )}

          {/* Grading criteria (read-only) */}
          {rawAssessment && (
            <GradingCriteriaPanel assessment={rawAssessment} />
          )}

          {/* Grade & feedback (if released) */}
          {grade && rawAssessment && (
            <GradeFeedbackViewerWithTracking grade={grade} assessment={rawAssessment} />
          )}

          {/* Submission workbook */}
          <SubmissionWorkbook
            submission={submission}
            assessmentId={assessmentId}
            studentId={studentId}
            classId={classId}
            isOpen={isOpen}
            isPastDue={isPastDue}
          />

          {/* Add to Goal button */}
          {isSubmissionSubmitted(submission) && (
            <Button
              variant="outline"
              size="sm"
              className="text-[12px]"
              onClick={() => setAddToGoalOpen(true)}
            >
              <Target className="h-3.5 w-3.5 mr-1.5" />
              Add to a goal
            </Button>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details card */}
          <Card className="p-5 gap-0">
            <h3 className="text-[14px] font-semibold mb-3">Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[13px]">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[12px] text-muted-foreground">Due date</p>
                  <p className="font-medium">
                    {format(new Date(projectedAssessment.dueDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[12px] text-muted-foreground">Grading mode</p>
                  <p className="font-medium">{projectedAssessment.gradingMode.replace(/_/g, " ")}</p>
                </div>
              </div>
              {projectedAssessment.totalPoints && projectedAssessment.gradingMode === "score" && (
                <div className="flex items-center gap-2 text-[13px]">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[12px] text-muted-foreground">Total points</p>
                    <p className="font-medium">{projectedAssessment.totalPoints}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Unit plan link */}
          {unitPlan && (
            <Card className="p-5 gap-0">
              <h3 className="text-[14px] font-semibold mb-2">Unit</h3>
              <p className="text-[13px] font-medium">{unitPlan.title}</p>
              {unitPlan.code && (
                <Badge variant="secondary" className="text-[10px] mt-1">
                  {unitPlan.code}
                </Badge>
              )}
            </Card>
          )}

          {/* Student resources */}
          {projectedAssessment.studentResources && projectedAssessment.studentResources.length > 0 && (
            <Card className="p-5 gap-0">
              <h3 className="text-[14px] font-semibold mb-3">Resources</h3>
              <div className="space-y-2">
                {projectedAssessment.studentResources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] text-[#c24e3f] hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {res.label}
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Learning goals */}
          {assessmentGoals.length > 0 && (
            <Card className="p-5 gap-0">
              <h3 className="text-[14px] font-semibold mb-3">Learning goals</h3>
              <div className="space-y-2">
                {assessmentGoals.map((goal) =>
                  goal ? (
                    <div key={goal.id} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#c24e3f] mt-2 shrink-0" />
                      <div>
                        <p className="text-[13px] font-medium">{goal.title}</p>
                        {goal.code && (
                          <p className="text-[11px] text-muted-foreground">{goal.code}</p>
                        )}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </Card>
          )}

          {/* Back to class */}
          <Link
            href={`/student/classes/${classId}?tab=assessments`}
            className="text-[13px] text-[#c24e3f] hover:underline flex items-center gap-1"
          >
            &larr; Back to assessments
          </Link>
        </div>
      </div>

      {submission && addToGoalOpen && studentId && (
        <AddToGoalDialog
          open={addToGoalOpen}
          onClose={() => setAddToGoalOpen(false)}
          sourceType="submission"
          sourceId={submission.id}
          sourceTitle={projectedAssessment.title}
          studentId={studentId}
          surface="submission"
        />
      )}
    </div>
  );
}
