"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { GRADING_MODE_LABELS, isGradingComplete } from "@/lib/grade-helpers";
import { MYP_LEVEL_DESCRIPTORS } from "@/lib/myp-descriptors";
import { ChecklistGrader } from "@/components/shared/checklist-grader";
import { RubricGrader } from "@/components/shared/rubric-grader";
import { StandardsGrader } from "@/components/shared/standards-grader";
import { buildGradePayload } from "@/lib/grade-save";
import type { Assessment } from "@/types/assessment";
import type { Student } from "@/types/student";
import type { SubmissionStatus, ChecklistResultItem, GradeRecord } from "@/types/gradebook";
import type { useGradeEditor } from "@/lib/hooks/use-grade-editor";

const MYP_CRITERIA_LABELS = ["A", "B", "C", "D"] as const;

// ---------------------------------------------------------------------------
// Public interface — new API
// ---------------------------------------------------------------------------

export interface GradingSheetState {
  gradingScore: string;
  setGradingScore: (v: string) => void;
  gradingFeedback: string;
  setGradingFeedback: (v: string) => void;
  gradingSubmissionStatus: SubmissionStatus;
  setGradingSubmissionStatus: (v: SubmissionStatus) => void;
  gradingMypScores: Record<string, number>;
  setGradingMypScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  gradingDpGrade: string;
  setGradingDpGrade: (v: string) => void;
  gradingChecklistResults: Record<string, ChecklistResultItem>;
  setGradingChecklistResults: React.Dispatch<React.SetStateAction<Record<string, ChecklistResultItem>>>;
  gradingRubricScores: Record<string, { criterionId: string; levelId: string; points: number }>;
  setGradingRubricScores: React.Dispatch<React.SetStateAction<Record<string, { criterionId: string; levelId: string; points: number }>>>;
  gradingStandardsMastery: Record<string, string>;
  setGradingStandardsMastery: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

// New props API
interface NewGradingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  assessment: Assessment | undefined;
  state: GradingSheetState;
  amend?: boolean;
  onSave: () => void;
  onRelease: () => void;
  onAmendUpdate?: () => void;
  editor?: never;
  onSaveAndNext?: never;
}

// Legacy props API (backward compat with useGradeEditor)
interface LegacyGradingSheetProps {
  editor: ReturnType<typeof useGradeEditor>;
  onSaveAndNext?: () => void;
  open?: never;
  onOpenChange?: never;
  student?: never;
  assessment?: never;
  state?: never;
  amend?: never;
  onSave?: never;
  onRelease?: never;
  onAmendUpdate?: never;
}

type GradingSheetProps = NewGradingSheetProps | LegacyGradingSheetProps;

// ---------------------------------------------------------------------------
// Grading body — shared rendering logic
// ---------------------------------------------------------------------------

function GradingBody({
  assessment,
  state,
  isExcused,
}: {
  assessment: Assessment | undefined;
  state: GradingSheetState;
  isExcused: boolean;
}) {
  return (
    <>
      {/* Mark as excused */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-[13px] font-medium">Mark as excused</Label>
          <p className="text-[12px] text-muted-foreground">
            Student is excused from this assessment
          </p>
        </div>
        <Switch
          checked={isExcused}
          onCheckedChange={(checked) =>
            state.setGradingSubmissionStatus(checked ? "excused" : "none")
          }
        />
      </div>

      <Separator />

      {/* Score mode */}
      {assessment?.gradingMode === "score" && !isExcused && (
        <div className="space-y-1.5">
          <Label className="text-[13px]">
            Score{" "}
            {assessment.totalPoints && `(out of ${assessment.totalPoints})`}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={state.gradingScore}
              onChange={(e) => state.setGradingScore(e.target.value)}
              placeholder="0"
              min={0}
              max={assessment.totalPoints}
              className="h-9 text-[13px] w-24"
            />
            {assessment.totalPoints && (
              <span className="text-[13px] text-muted-foreground">
                / {assessment.totalPoints}
              </span>
            )}
          </div>
          {assessment.totalPoints &&
            state.gradingScore &&
            parseInt(state.gradingScore) > 0 && (
              <p className="text-[12px] text-muted-foreground">
                {Math.round(
                  (parseInt(state.gradingScore) / assessment.totalPoints) * 100
                )}
                %
              </p>
            )}
        </div>
      )}

      {/* MYP Criteria mode */}
      {assessment?.gradingMode === "myp_criteria" && !isExcused && (
        <div className="space-y-4">
          <Label className="text-[13px] font-medium">
            MYP Criteria levels (1-8)
          </Label>
          {MYP_CRITERIA_LABELS.map((criterion) => {
            const mypCrit = assessment.mypCriteria?.find(
              (c) => c.criterion === criterion
            );
            return (
              <div key={criterion} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px]">
                    Criterion {criterion}
                    {mypCrit ? `: ${mypCrit.title}` : ""}
                  </Label>
                  <Badge variant="outline" className="text-[11px]">
                    Level {state.gradingMypScores[criterion] ?? 0}
                  </Badge>
                </div>
                <Select
                  value={(state.gradingMypScores[criterion] ?? 0).toString()}
                  onValueChange={(v) =>
                    state.setGradingMypScores((prev) => ({
                      ...prev,
                      [criterion]: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i === 0
                          ? "Not assessed (0)"
                          : `Level ${i}${MYP_LEVEL_DESCRIPTORS[criterion]?.[i] ? ` \u2014 ${MYP_LEVEL_DESCRIPTORS[criterion][i]}` : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}

      {/* DP Scale mode */}
      {assessment?.gradingMode === "dp_scale" && !isExcused && (
        <div className="space-y-1.5">
          <Label className="text-[13px]">DP Grade (1-7)</Label>
          <Select
            value={state.gradingDpGrade}
            onValueChange={state.setGradingDpGrade}
          >
            <SelectTrigger className="h-9 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} -{" "}
                  {
                    [
                      "",
                      "Very poor",
                      "Poor",
                      "Mediocre",
                      "Satisfactory",
                      "Good",
                      "Very good",
                      "Excellent",
                    ][n]
                  }
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Checklist mode */}
      {assessment?.gradingMode === "checklist" && !isExcused && (
        <ChecklistGrader
          assessment={assessment}
          results={state.gradingChecklistResults}
          onResultChange={(itemId, update) => {
            state.setGradingChecklistResults(
              (prev: Record<string, ChecklistResultItem>) => ({
                ...prev,
                [itemId]: {
                  ...prev[itemId],
                  itemId,
                  status: prev[itemId]?.status ?? "unmarked",
                  ...update,
                },
              })
            );
          }}
        />
      )}

      {/* Rubric mode */}
      {assessment?.gradingMode === "rubric" && !isExcused && (
        <RubricGrader
          rubric={assessment.rubric ?? []}
          scores={state.gradingRubricScores}
          onScoreChange={(criterionId, levelId, points) => {
            state.setGradingRubricScores((prev) => ({
              ...prev,
              [criterionId]: { criterionId, levelId, points },
            }));
          }}
        />
      )}

      {/* Standards mode */}
      {assessment?.gradingMode === "standards" && !isExcused && (
        <StandardsGrader
          learningGoalIds={assessment.learningGoalIds ?? []}
          mastery={state.gradingStandardsMastery}
          onMasteryChange={(goalId, level) => {
            state.setGradingStandardsMastery((prev) => ({
              ...prev,
              [goalId]: level,
            }));
          }}
        />
      )}

      <Separator />

      {/* Feedback */}
      <div className="space-y-1.5">
        <Label className="text-[13px]">Feedback</Label>
        <Textarea
          value={state.gradingFeedback}
          onChange={(e) => state.setGradingFeedback(e.target.value)}
          placeholder="Add feedback for the student..."
          className="text-[13px] min-h-[100px]"
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GradingSheet(props: GradingSheetProps) {
  // Legacy mode: convert editor props to new interface
  if ("editor" in props && props.editor) {
    const { editor, onSaveAndNext } = props;
    const isExcused = editor.gradingSubmissionStatus === "excused";

    const legacyState: GradingSheetState = {
      gradingScore: editor.gradingScore,
      setGradingScore: editor.setGradingScore,
      gradingFeedback: editor.gradingFeedback,
      setGradingFeedback: editor.setGradingFeedback,
      gradingSubmissionStatus: editor.gradingSubmissionStatus,
      setGradingSubmissionStatus: editor.setGradingSubmissionStatus,
      gradingMypScores: editor.gradingMypScores,
      setGradingMypScores: editor.setGradingMypScores,
      gradingDpGrade: editor.gradingDpGrade,
      setGradingDpGrade: editor.setGradingDpGrade,
      gradingChecklistResults: editor.gradingChecklistResults,
      setGradingChecklistResults: editor.setGradingChecklistResults,
      gradingRubricScores: editor.gradingRubricScores,
      setGradingRubricScores: editor.setGradingRubricScores,
      gradingStandardsMastery: editor.gradingStandardsMastery,
      setGradingStandardsMastery: editor.setGradingStandardsMastery,
    };

    return (
      <Sheet open={editor.gradingOpen} onOpenChange={editor.setGradingOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="text-[16px]">
              Grade: {editor.gradingStudentObj?.firstName}{" "}
              {editor.gradingStudentObj?.lastName}
            </SheetTitle>
            <SheetDescription className="text-[13px]">
              {editor.gradingAssessment?.title} &middot;{" "}
              {editor.gradingAssessment
                ? GRADING_MODE_LABELS[editor.gradingAssessment.gradingMode]
                : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            <GradingBody
              assessment={editor.gradingAssessment}
              state={legacyState}
              isExcused={isExcused}
            />

            {/* Save buttons — legacy mode */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => editor.setGradingOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant={onSaveAndNext ? "outline" : "default"}
                className="flex-1"
                onClick={editor.handleSaveGrade}
              >
                Save grade
              </Button>
              {onSaveAndNext && (
                <Button className="flex-1" onClick={onSaveAndNext}>
                  Save &amp; Next
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // New mode
  const {
    open,
    onOpenChange,
    student,
    assessment,
    state,
    amend = false,
    onSave,
    onRelease,
    onAmendUpdate,
  } = props as NewGradingSheetProps;

  const isExcused = state.gradingSubmissionStatus === "excused";

  // Check if grading is complete (for release button)
  const isComplete = (() => {
    if (!assessment || !student) return false;
    if (isExcused) return false;
    const payload = buildGradePayload(assessment, student.id, {
      score: state.gradingScore,
      dpGrade: state.gradingDpGrade,
      mypScores: state.gradingMypScores,
      checklistResults: state.gradingChecklistResults,
      rubricScores: state.gradingRubricScores,
      standardsMastery: state.gradingStandardsMastery,
      feedback: state.gradingFeedback,
      submissionStatus: state.gradingSubmissionStatus,
    });
    const tempGrade = {
      id: "",
      assessmentId: assessment.id,
      studentId: student.id,
      classId: assessment.classId,
      gradingMode: assessment.gradingMode,
      submissionStatus: state.gradingSubmissionStatus,
      ...payload,
    } as GradeRecord;
    return isGradingComplete(tempGrade, assessment);
  })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className="text-[16px]">
            {amend ? "Amend" : "Grade"}: {student?.firstName}{" "}
            {student?.lastName}
          </SheetTitle>
          <SheetDescription className="text-[13px]">
            {assessment?.title} &middot;{" "}
            {assessment ? GRADING_MODE_LABELS[assessment.gradingMode] : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <GradingBody
            assessment={assessment}
            state={state}
            isExcused={isExcused}
          />

          {/* Action buttons — new mode */}
          <div className="flex gap-2 pt-2">
            {amend ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={onAmendUpdate}>
                  Update
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="outline" className="flex-1" onClick={onSave}>
                  Save
                </Button>
                <Button
                  className="flex-1"
                  onClick={onRelease}
                  disabled={!isComplete}
                >
                  Release
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
