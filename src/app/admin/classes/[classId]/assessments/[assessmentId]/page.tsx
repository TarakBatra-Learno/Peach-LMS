"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardCheck } from "lucide-react";
import { useStore } from "@/stores";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminEmbeddedSurfacePage } from "@/features/admin/components/admin-embedded-surface-page";
import { getAdminClassWorkspaceHref } from "@/lib/admin-embed-routes";
import { GRADING_MODE_LABELS } from "@/lib/grade-helpers";

export default function AdminClassAssessmentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params.classId as string;
  const assessmentId = params.assessmentId as string;
  const studentId = searchParams.get("studentId");

  const classes = useStore((store) => store.classes);
  const students = useStore((store) => store.students);
  const assessments = useStore((store) => store.assessments);

  const cls = classes.find((entry) => entry.id === classId);
  const assessment = assessments.find((entry) => entry.id === assessmentId);
  const student = studentId
    ? students.find((entry) => entry.id === studentId)
    : null;

  if (!cls || !assessment) {
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
      description={`${cls.name} · Embedded live assessment detail`}
      backHref={getAdminClassWorkspaceHref(classId, { tab: "assessments" })}
      backLabel={`Back to ${cls.name}`}
      badges={
        <>
          <StatusBadge status={assessment.status} />
          <Badge variant="outline">{GRADING_MODE_LABELS[assessment.gradingMode]}</Badge>
          {student ? (
            <Badge variant="outline">Student focus: {student.firstName} {student.lastName}</Badge>
          ) : null}
        </>
      }
      panelTitle="Embedded live assessment view"
      panelDescription="This reuses the existing assessment detail surface inside the admin shell so class-scoped marking and release context stay available without leaving leadership navigation."
      embedTitle="Live assessment detail"
      embedSrc={`/assessments/${assessmentId}?embed=1${studentId ? `&studentId=${studentId}` : ""}`}
      minHeight={1600}
    />
  );
}
