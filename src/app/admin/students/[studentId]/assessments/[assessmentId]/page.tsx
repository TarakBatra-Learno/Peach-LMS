"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardCheck } from "lucide-react";
import { useStore } from "@/stores";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminEmbeddedSurfacePage } from "@/features/admin/components/admin-embedded-surface-page";
import { getAdminStudentWorkspaceHref } from "@/lib/admin-embed-routes";
import { GRADING_MODE_LABELS } from "@/lib/grade-helpers";

export default function AdminStudentAssessmentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  const assessmentId = params.assessmentId as string;
  const classId = searchParams.get("classId");

  const getStudentById = useStore((store) => store.getStudentById);
  const classes = useStore((store) => store.classes);
  const assessments = useStore((store) => store.assessments);

  const student = getStudentById(studentId);
  const assessment = assessments.find((entry) => entry.id === assessmentId);
  const cls = classId
    ? classes.find((entry) => entry.id === classId)
    : assessment
      ? classes.find((entry) => entry.id === assessment.classId)
      : null;

  if (!student || !assessment) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Assessment not found"
        description="This assessment is not available in the seeded prototype data."
      />
    );
  }

  return (
    <AdminEmbeddedSurfacePage
      title={assessment.title}
      description={`${student.firstName} ${student.lastName} · Embedded live assessment detail`}
      backHref={getAdminStudentWorkspaceHref(studentId, {
        classId,
        tab: "grades",
      })}
      backLabel={`Back to ${student.firstName}`}
      badges={
        <>
          <StatusBadge status={assessment.status} />
          <Badge variant="outline">{GRADING_MODE_LABELS[assessment.gradingMode]}</Badge>
          {cls ? <Badge variant="outline">{cls.name}</Badge> : null}
        </>
      }
      panelTitle="Embedded live assessment view"
      panelDescription="This admin route keeps the broader student workspace intact while reusing the seeded teacher assessment detail for student-specific oversight."
      embedTitle="Live assessment detail"
      embedSrc={`/assessments/${assessmentId}?embed=1&studentId=${studentId}`}
      minHeight={1600}
    />
  );
}
