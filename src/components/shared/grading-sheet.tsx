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
import { GRADING_MODE_LABELS } from "@/lib/grade-helpers";
import type { useGradeEditor } from "@/lib/hooks/use-grade-editor";

const MYP_CRITERIA_LABELS = ["A", "B", "C", "D"] as const;

export function GradingSheet({
  editor,
}: {
  editor: ReturnType<typeof useGradeEditor>;
}) {
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
          {/* Mark as missing */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[13px] font-medium">
                Mark as missing
              </Label>
              <p className="text-[12px] text-muted-foreground">
                Student did not submit this assessment
              </p>
            </div>
            <Switch
              checked={editor.gradingIsMissing}
              onCheckedChange={editor.setGradingIsMissing}
            />
          </div>

          <Separator />

          {/* Score mode */}
          {editor.gradingAssessment?.gradingMode === "score" &&
            !editor.gradingIsMissing && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">
                  Score{" "}
                  {editor.gradingAssessment.totalPoints &&
                    `(out of ${editor.gradingAssessment.totalPoints})`}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editor.gradingScore}
                    onChange={(e) => editor.setGradingScore(e.target.value)}
                    placeholder="0"
                    min={0}
                    max={editor.gradingAssessment.totalPoints}
                    className="h-9 text-[13px] w-24"
                  />
                  {editor.gradingAssessment.totalPoints && (
                    <span className="text-[13px] text-muted-foreground">
                      / {editor.gradingAssessment.totalPoints}
                    </span>
                  )}
                </div>
                {editor.gradingAssessment.totalPoints &&
                  editor.gradingScore &&
                  parseInt(editor.gradingScore) > 0 && (
                    <p className="text-[12px] text-muted-foreground">
                      {Math.round(
                        (parseInt(editor.gradingScore) /
                          editor.gradingAssessment.totalPoints) *
                          100
                      )}
                      %
                    </p>
                  )}
              </div>
            )}

          {/* MYP Criteria mode */}
          {editor.gradingAssessment?.gradingMode === "myp_criteria" &&
            !editor.gradingIsMissing && (
              <div className="space-y-4">
                <Label className="text-[13px] font-medium">
                  MYP Criteria levels (1-8)
                </Label>
                {MYP_CRITERIA_LABELS.map((criterion) => {
                  const mypCrit =
                    editor.gradingAssessment?.mypCriteria?.find(
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
                          Level {editor.gradingMypScores[criterion] ?? 0}
                        </Badge>
                      </div>
                      <Select
                        value={(
                          editor.gradingMypScores[criterion] ?? 0
                        ).toString()}
                        onValueChange={(v) =>
                          editor.setGradingMypScores((prev) => ({
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
                                : `Level ${i}`}
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
          {editor.gradingAssessment?.gradingMode === "dp_scale" &&
            !editor.gradingIsMissing && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">DP Grade (1-7)</Label>
                <Select
                  value={editor.gradingDpGrade}
                  onValueChange={editor.setGradingDpGrade}
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

          <Separator />

          {/* Feedback */}
          <div className="space-y-1.5">
            <Label className="text-[13px]">Feedback</Label>
            <Textarea
              value={editor.gradingFeedback}
              onChange={(e) => editor.setGradingFeedback(e.target.value)}
              placeholder="Add feedback for the student..."
              className="text-[13px] min-h-[100px]"
            />
          </div>

          {/* Save button */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => editor.setGradingOpen(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={editor.handleSaveGrade}>
              Save grade
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
