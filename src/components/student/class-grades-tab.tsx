"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  getStudentReleasedGrades,
  getStudentAssessments,
} from "@/lib/student-selectors";
import { getGradePercentage } from "@/lib/grade-helpers";
import type { Assessment } from "@/types/assessment";
import { BarChart3, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { GradeRecord } from "@/types/gradebook";
import type { StudentAssessmentView } from "@/lib/student-permissions";

interface ClassGradesTabProps {
  classId: string;
  studentId: string;
}

function getStudentGradeDisplay(grade: GradeRecord): string {
  if (grade.submissionStatus === "excused") return "Excused";
  if (grade.submissionStatus === "missing" && grade.score == null && grade.dpGrade == null && !grade.mypCriteriaScores?.length) return "Missing";
  if (grade.score != null && grade.totalPoints != null)
    return `${grade.score}/${grade.totalPoints}`;
  if (grade.score != null) return `${grade.score}%`;
  if (grade.dpGrade != null) return `${grade.dpGrade}/7`;
  if (grade.mypCriteriaScores?.length) {
    const assessed = grade.mypCriteriaScores.filter((c) => c.level > 0);
    if (assessed.length === 0) return "N/A";
    return assessed.map((c) => `${c.criterion}:${c.level}`).join(" ");
  }
  if (grade.checklistGradeResults?.length) {
    const metCount = grade.checklistGradeResults.filter(
      (r) => r.status === "met" || r.status === "yes"
    ).length;
    return `${metCount}/${grade.checklistGradeResults.length}`;
  }
  return "-";
}

export function ClassGradesTab({ classId, studentId }: ClassGradesTabProps) {
  const state = useStore((s) => s);

  const releasedGrades = useMemo(
    () => getStudentReleasedGrades(state, studentId, classId),
    [state, studentId, classId]
  );

  const assessments = useMemo(
    () => getStudentAssessments(state, studentId, classId),
    [state, studentId, classId]
  );

  // Build assessment lookup (projected)
  const assessmentMap = useMemo(() => {
    const map = new Map<string, StudentAssessmentView>();
    for (const a of assessments) {
      map.set(a.id, a);
    }
    return map;
  }, [assessments]);

  // Raw assessments for grade percentage calculation
  const rawAssessments = useStore((s) => s.assessments);
  const rawAssessmentMap = useMemo(() => {
    const map = new Map<string, Assessment>();
    for (const a of rawAssessments) {
      map.set(a.id, a);
    }
    return map;
  }, [rawAssessments]);

  // Compute class average from released grades
  const classAverage = useMemo(() => {
    if (releasedGrades.length === 0) return null;
    const percentages = releasedGrades
      .map((g) => {
        const a = rawAssessmentMap.get(g.assessmentId);
        if (!a) return null;
        return getGradePercentage(g, a);
      })
      .filter((p): p is number => p !== null);
    if (percentages.length === 0) return null;
    return Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length);
  }, [releasedGrades, rawAssessmentMap]);

  if (releasedGrades.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No grades released yet"
        description="Your teacher hasn't released any grades for this class yet. Grades will appear here once they're published."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card className="p-4 gap-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">
              {releasedGrades.length} grade{releasedGrades.length !== 1 ? "s" : ""} released
            </p>
            <p className="text-[12px] text-muted-foreground">
              out of {assessments.length} total assessments
            </p>
          </div>
          {classAverage !== null && (
            <div className="text-right">
              <p className="text-[24px] font-semibold">{classAverage}%</p>
              <p className="text-[12px] text-muted-foreground">Average</p>
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-[#c24e3f] transition-all rounded-full"
            style={{
              width: `${assessments.length > 0 ? (releasedGrades.length / assessments.length) * 100 : 0}%`,
            }}
          />
        </div>
      </Card>

      {/* Grades list */}
      <div className="space-y-2">
        {releasedGrades.map((grade) => {
          const assessment = assessmentMap.get(grade.assessmentId);
          if (!assessment) return null;

          const rawAssessment = rawAssessmentMap.get(grade.assessmentId);
          const percentage = rawAssessment ? getGradePercentage(grade, rawAssessment) : null;
          const percentColor =
            percentage !== null
              ? percentage >= 70
                ? "text-[#16a34a]"
                : percentage >= 50
                ? "text-[#b45309]"
                : "text-[#dc2626]"
              : "";

          return (
            <Card key={grade.id} className="p-4 gap-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium truncate">{assessment.title}</p>
                  <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Due {format(new Date(assessment.dueDate), "MMM d")}
                    </span>
                    <span>{assessment.gradingMode.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[16px] font-semibold">
                      {getStudentGradeDisplay(grade)}
                    </p>
                    {percentage !== null && (
                      <p className={`text-[12px] font-medium ${percentColor}`}>
                        {percentage}%
                      </p>
                    )}
                  </div>
                  {grade.submissionStatus === "excused" ? (
                    <StatusBadge status="excused" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                  )}
                </div>
              </div>
              {grade.feedback && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Teacher feedback
                  </p>
                  <p className="text-[13px] text-muted-foreground">{grade.feedback}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
