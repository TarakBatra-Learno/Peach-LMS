"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  getStudentAssessments,
  getStudentUnitPlans,
  getStudentSubmission,
  getStudentReleasedGrades,
} from "@/lib/student-selectors";
import { isAssessmentPastDue } from "@/lib/student-permissions";
import type { StudentAssessmentView, StudentUnitPlanView } from "@/lib/student-permissions";
import { Calendar, ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface ClassWorkTabProps {
  classId: string;
  studentId: string;
}

function AssessmentCard({
  assessment,
  classId,
  studentId,
}: {
  assessment: StudentAssessmentView;
  classId: string;
  studentId: string;
}) {
  const state = useStore((s) => s);
  const submission = getStudentSubmission(state, studentId, assessment.id);
  const isPastDue = isAssessmentPastDue(assessment);
  const releasedGrade = assessment.gradesReleased
    ? getStudentReleasedGrades(state, studentId).find((g) => g.assessmentId === assessment.id)
    : undefined;
  const isExcused = releasedGrade?.submissionStatus === "excused";

  const submissionStatus = submission?.status ?? (isPastDue ? "overdue" : "not_started");
  const statusLabel =
    submissionStatus === "draft"
      ? "Draft saved"
      : submissionStatus === "submitted"
      ? "Submitted"
      : submissionStatus === "returned"
      ? "Returned"
      : submissionStatus === "resubmitted"
      ? "Resubmitted"
      : isPastDue
      ? "Past due"
      : "Not started";

  const statusVariant =
    submissionStatus === "submitted" || submissionStatus === "resubmitted"
      ? "success"
      : submissionStatus === "returned"
      ? "warning"
      : submissionStatus === "draft"
      ? "info"
      : isPastDue
      ? "danger"
      : "neutral";

  return (
    <Link href={`/student/classes/${classId}/assessments/${assessment.id}`}>
      <Card className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium truncate">{assessment.title}</p>
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
            {assessment.gradesReleased && (
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
    </Link>
  );
}

export function ClassWorkTab({ classId, studentId }: ClassWorkTabProps) {
  const state = useStore((s) => s);

  const assessments = useMemo(
    () => getStudentAssessments(state, studentId, classId),
    [state, studentId, classId]
  );

  const unitPlans = useMemo(
    () => getStudentUnitPlans(state, classId),
    [state, classId]
  );

  // Group assessments by unit when units exist
  const groupedByUnit = useMemo(() => {
    if (unitPlans.length === 0) return null;

    const groups: { unit: StudentUnitPlanView | null; assessments: StudentAssessmentView[] }[] = [];
    const unitMap = new Map<string, StudentAssessmentView[]>();
    const noUnit: StudentAssessmentView[] = [];

    for (const a of assessments) {
      if (a.unitId) {
        const existing = unitMap.get(a.unitId) ?? [];
        existing.push(a);
        unitMap.set(a.unitId, existing);
      } else {
        noUnit.push(a);
      }
    }

    for (const unit of unitPlans) {
      const unitAssessments = unitMap.get(unit.id) ?? [];
      if (unitAssessments.length > 0) {
        groups.push({ unit, assessments: unitAssessments });
      }
    }

    if (noUnit.length > 0) {
      groups.push({ unit: null, assessments: noUnit });
    }

    return groups;
  }, [assessments, unitPlans]);

  if (assessments.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No assessments yet"
        description="Your teacher hasn't published any assessments for this class yet."
      />
    );
  }

  // Flat list when no units
  if (!groupedByUnit) {
    return (
      <div className="space-y-2">
        {assessments
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((a) => (
            <AssessmentCard
              key={a.id}
              assessment={a}
              classId={classId}
              studentId={studentId}
            />
          ))}
      </div>
    );
  }

  // Grouped by unit
  return (
    <div className="space-y-6">
      {groupedByUnit.map((group, i) => (
        <UnitGroup
          key={group.unit?.id ?? "no-unit"}
          unit={group.unit}
          assessments={group.assessments}
          classId={classId}
          studentId={studentId}
          defaultExpanded={i === 0}
        />
      ))}
    </div>
  );
}

function UnitGroup({
  unit,
  assessments,
  classId,
  studentId,
  defaultExpanded,
}: {
  unit: StudentUnitPlanView | null;
  assessments: StudentAssessmentView[];
  classId: string;
  studentId: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        className="flex items-center gap-2 w-full text-left mb-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-[14px] font-semibold">
            {unit ? unit.title : "Other assessments"}
          </h3>
          {unit?.code && (
            <Badge variant="secondary" className="text-[11px] bg-[#f0f4ff] text-[#3b5998]">
              {unit.code}
            </Badge>
          )}
          {unit && (
            <StatusBadge status={unit.status} className="text-[10px]" />
          )}
        </div>
        <Badge variant="outline" className="text-[11px]">
          {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
        </Badge>
      </button>

      {expanded && (
        <div className="space-y-2 ml-6">
          {assessments
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .map((a) => (
              <AssessmentCard
                key={a.id}
                assessment={a}
                classId={classId}
                studentId={studentId}
              />
            ))}
        </div>
      )}
    </div>
  );
}
