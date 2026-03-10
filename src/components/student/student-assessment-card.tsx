"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  getStudentSubmission,
  getStudentReleasedGrades,
} from "@/lib/student-selectors";
import { isAssessmentPastDue } from "@/lib/student-permissions";
import type { StudentAssessmentView } from "@/lib/student-permissions";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface StudentAssessmentCardProps {
  assessment: StudentAssessmentView;
  classId: string;
  studentId: string;
  showClassName?: boolean;
  onGradeClick?: (assessmentId: string) => void;
}

export function StudentAssessmentCard({
  assessment,
  classId,
  studentId,
  showClassName = false,
  onGradeClick,
}: StudentAssessmentCardProps) {
  const router = useRouter();
  const state = useStore((s) => s);
  const submission = getStudentSubmission(state, studentId, assessment.id);
  const isPastDue = isAssessmentPastDue(assessment);
  const releasedGrade = getStudentReleasedGrades(state, studentId).find((g) => g.assessmentId === assessment.id);
  const isExcused = releasedGrade?.submissionStatus === "excused";

  const className = showClassName
    ? state.classes.find((c) => c.id === assessment.classId)?.name
    : undefined;

  const submissionStatus = submission?.status ?? (isPastDue ? "overdue" : "not_started");
  const statusLabel =
    submissionStatus === "draft"
      ? "Draft saved"
      : submissionStatus === "submitted"
      ? "Submitted"
      : isPastDue
      ? "Past due"
      : "Not started";

  const statusVariant =
    submissionStatus === "submitted"
      ? "success"
      : submissionStatus === "draft"
      ? "info"
      : isPastDue
      ? "danger"
      : "neutral";

  const handleClick = () => {
    if (!!releasedGrade && onGradeClick) {
      onGradeClick(assessment.id);
    } else {
      router.push(`/student/classes/${classId}/assessments/${assessment.id}`);
    }
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <Card className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium truncate">{assessment.title}</p>
            {showClassName && className && (
              <p className="text-[12px] text-muted-foreground mt-0.5">{className}</p>
            )}
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {format(new Date(assessment.dueDate), "MMM d, yyyy")}
              </span>
              <span>{assessment.gradingMode.replace(/_/g, " ")}</span>
              {assessment.totalPoints && assessment.gradingMode === "score" && (
                <span>{assessment.totalPoints} pts</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!!releasedGrade && (
              <Badge variant="secondary" className={`text-[11px] ${isExcused ? "bg-muted text-muted-foreground" : "bg-[#dcfce7] text-[#16a34a]"}`}>
                {isExcused ? "Excused" : "Graded"}
              </Badge>
            )}
            <StatusBadge
              status={statusLabel.toLowerCase().replace(/ /g, "_")}
              variant={statusVariant}
              label={statusLabel}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
