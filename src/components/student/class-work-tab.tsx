"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StudentAssessmentCard } from "@/components/student/student-assessment-card";
import {
  getStudentAssessments,
  getStudentUnitPlans,
} from "@/lib/student-selectors";
import type { StudentAssessmentView, StudentUnitPlanView } from "@/lib/student-permissions";
import { ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useReleasedAssessmentClick } from "@/lib/hooks/use-released-assessment-click";
import { GradeResultSheet } from "@/components/student/grade-result-sheet";

interface ClassWorkTabProps {
  classId: string;
  studentId: string;
}

export function ClassWorkTab({ classId, studentId }: ClassWorkTabProps) {
  const state = useStore((s) => s);
  const { handleClick: handleGradeClick, sheetProps } = useReleasedAssessmentClick(studentId);

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
      <>
        <div className="space-y-2">
          {assessments
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .map((a) => (
              <StudentAssessmentCard
                key={a.id}
                assessment={a}
                classId={classId}
                studentId={studentId}
                showClassName={false}
                onGradeClick={(assessmentId) => handleGradeClick(assessmentId, classId)}
              />
            ))}
        </div>
        <GradeResultSheet {...sheetProps} studentId={studentId} />
      </>
    );
  }

  // Grouped by unit
  return (
    <>
      <div className="space-y-6">
        {groupedByUnit.map((group, i) => (
          <UnitGroup
            key={group.unit?.id ?? "no-unit"}
            unit={group.unit}
            assessments={group.assessments}
            classId={classId}
            studentId={studentId}
            defaultExpanded={i === 0}
            onGradeClick={(assessmentId) => handleGradeClick(assessmentId, classId)}
          />
        ))}
      </div>
      <GradeResultSheet {...sheetProps} studentId={studentId} />
    </>
  );
}

function UnitGroup({
  unit,
  assessments,
  classId,
  studentId,
  defaultExpanded,
  onGradeClick,
}: {
  unit: StudentUnitPlanView | null;
  assessments: StudentAssessmentView[];
  classId: string;
  studentId: string;
  defaultExpanded: boolean;
  onGradeClick?: (assessmentId: string) => void;
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
              <StudentAssessmentCard
                key={a.id}
                assessment={a}
                classId={classId}
                studentId={studentId}
                showClassName={false}
                onGradeClick={onGradeClick}
              />
            ))}
        </div>
      )}
    </div>
  );
}
