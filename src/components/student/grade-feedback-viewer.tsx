"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Minus } from "lucide-react";
import type { GradeRecord } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";
import { getGradePercentage } from "@/lib/grade-helpers";

interface GradeFeedbackViewerProps {
  grade: GradeRecord;
  assessment: Assessment;
}

export function GradeFeedbackViewer({ grade, assessment }: GradeFeedbackViewerProps) {
  const percentage = getGradePercentage(grade, assessment);
  const percentColor =
    percentage !== null
      ? percentage >= 70
        ? "text-[#16a34a]"
        : percentage >= 50
        ? "text-[#b45309]"
        : "text-[#dc2626]"
      : "";

  if (grade.submissionStatus === "excused") {
    return (
      <Card className="p-5 gap-0">
        <h3 className="text-[16px] font-semibold mb-3">Grade</h3>
        <StatusBadge status="excused" />
        <p className="text-[13px] text-muted-foreground mt-2">
          You are excused from this assessment.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 gap-0">
      <h3 className="text-[16px] font-semibold mb-3">Your grade</h3>

      {/* Score mode */}
      {assessment.gradingMode === "score" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[28px] font-bold">
              {grade.score != null ? grade.score : "-"}
              {grade.totalPoints != null && (
                <span className="text-[16px] font-normal text-muted-foreground">
                  /{grade.totalPoints}
                </span>
              )}
            </span>
            {percentage !== null && (
              <Badge className={`text-[14px] ${percentColor} bg-transparent border-current`}>
                {percentage}%
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* DP Scale mode */}
      {assessment.gradingMode === "dp_scale" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[28px] font-bold">
              {grade.dpGrade ?? "-"}
              <span className="text-[16px] font-normal text-muted-foreground">/7</span>
            </span>
            <span className="text-[13px] text-muted-foreground">
              {["", "Very poor", "Poor", "Mediocre", "Satisfactory", "Good", "Very good", "Excellent"][grade.dpGrade ?? 0] ?? ""}
            </span>
          </div>
        </div>
      )}

      {/* MYP Criteria mode */}
      {assessment.gradingMode === "myp_criteria" && grade.mypCriteriaScores && (
        <div className="space-y-3">
          {grade.mypCriteriaScores.map((cs) => (
            <div key={cs.criterion} className="flex items-center justify-between">
              <span className="text-[13px] font-medium">Criterion {cs.criterion}</span>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold">{cs.level}</span>
                <span className="text-[12px] text-muted-foreground">/8</span>
              </div>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">Total</span>
            <span className="text-[14px] font-semibold">
              {grade.mypCriteriaScores.reduce((s, c) => s + c.level, 0)}/
              {grade.mypCriteriaScores.length * 8}
            </span>
          </div>
        </div>
      )}

      {/* Rubric mode */}
      {assessment.gradingMode === "rubric" && grade.rubricScores && (
        <div className="space-y-3">
          {grade.rubricScores.map((rs) => {
            const criterion = assessment.rubric?.find((c) => c.id === rs.criterionId);
            const level = criterion?.levels.find((l) => l.id === rs.levelId);
            return (
              <div key={rs.criterionId} className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-medium">
                    {criterion?.title ?? "Criterion"}
                  </span>
                  {level && (
                    <p className="text-[12px] text-muted-foreground">{level.label}</p>
                  )}
                </div>
                <span className="text-[14px] font-semibold">{rs.points} pts</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Standards mode */}
      {assessment.gradingMode === "standards" && grade.standardsMastery && (
        <div className="space-y-2">
          {grade.standardsMastery.map((sm) => (
            <div key={sm.standardId} className="flex items-center justify-between">
              <span className="text-[13px] font-medium">{sm.standardId}</span>
              <StatusBadge status={sm.level} />
            </div>
          ))}
        </div>
      )}

      {/* Checklist mode */}
      {assessment.gradingMode === "checklist" && grade.checklistGradeResults && (
        <div className="space-y-2">
          {grade.checklistGradeResults.map((cr) => {
            const item = assessment.checklist?.find((i) => i.id === cr.itemId);
            const icon =
              cr.status === "met" || cr.status === "yes" ? (
                <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
              ) : cr.status === "not_yet" || cr.status === "no" ? (
                <XCircle className="h-4 w-4 text-[#dc2626]" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              );

            return (
              <div key={cr.itemId} className="flex items-center gap-2">
                {icon}
                <span className="text-[13px]">{item?.label ?? cr.itemId}</span>
              </div>
            );
          })}
          <Separator />
          <p className="text-[13px] text-muted-foreground">
            {grade.checklistGradeResults.filter((r) => r.status === "met" || r.status === "yes").length} of{" "}
            {grade.checklistGradeResults.length} items met
          </p>
        </div>
      )}

      {/* Feedback */}
      {grade.feedback && (
        <>
          <Separator className="my-4" />
          <div>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Teacher feedback
            </p>
            <p className="text-[13px] whitespace-pre-wrap">{grade.feedback}</p>
          </div>
        </>
      )}
    </Card>
  );
}
