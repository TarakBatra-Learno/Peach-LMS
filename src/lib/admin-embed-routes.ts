"use client";

function withQuery(
  path: string,
  params: Record<string, string | null | undefined>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function getAdminClassWorkspaceHref(
  classId: string,
  options?: { tab?: string | null }
) {
  return withQuery(`/admin/classes/${classId}`, { tab: options?.tab });
}

export function getAdminStudentWorkspaceHref(
  studentId: string,
  options?: { classId?: string | null; tab?: string | null }
) {
  return withQuery(`/admin/students/${studentId}`, {
    classId: options?.classId,
    tab: options?.tab,
  });
}

export function getAdminClassAssessmentHref(
  classId: string,
  assessmentId: string,
  options?: { studentId?: string | null }
) {
  return withQuery(`/admin/classes/${classId}/assessments/${assessmentId}`, {
    studentId: options?.studentId,
  });
}

export function getAdminStudentAssessmentHref(
  studentId: string,
  assessmentId: string,
  options?: { classId?: string | null }
) {
  return withQuery(`/admin/students/${studentId}/assessments/${assessmentId}`, {
    classId: options?.classId,
  });
}

export function getAdminClassReportHref(
  classId: string,
  reportId: string,
  options?: { studentId?: string | null }
) {
  return withQuery(`/admin/classes/${classId}/reports/${reportId}`, {
    studentId: options?.studentId,
  });
}

export function getAdminStudentReportHref(
  studentId: string,
  reportId: string,
  options?: { classId?: string | null }
) {
  return withQuery(`/admin/students/${studentId}/reports/${reportId}`, {
    classId: options?.classId,
  });
}

export function getAdminCommunicationsHref(options?: {
  classId?: string | null;
  studentId?: string | null;
}) {
  return withQuery("/admin/communications", {
    classId: options?.classId,
    studentId: options?.studentId,
  });
}
