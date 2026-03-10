/**
 * notification-events.ts
 *
 * Event factories that create StudentNotification objects.
 * These are called from store actions when teacher performs
 * grade release, submission return, etc.
 *
 * Deduplication: each factory generates a deterministic dedupeKey
 * so the store's addStudentNotification can skip duplicates.
 */

import type { StudentNotification, NotificationType } from "@/types/notification";
import { generateId } from "@/services/mock-service";

interface GradeReleasedParams {
  studentId: string;
  assessmentId: string;
  assessmentTitle: string;
  className: string;
  classId: string;
}

export function createGradeReleasedNotification(params: GradeReleasedParams): StudentNotification {
  return {
    id: generateId("notif"),
    studentId: params.studentId,
    type: "grade_released",
    title: "Grade released",
    body: `Your grade for "${params.assessmentTitle}" in ${params.className} has been released.`,
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: `/student/classes/${params.classId}/assessments/${params.assessmentId}`,
    dedupeKey: `${params.studentId}:${params.assessmentId}:grade_released`,
  };
}

interface GradeAmendedParams {
  studentId: string;
  assessmentId: string;
  assessmentTitle: string;
  className: string;
  classId: string;
}

export function createGradeAmendedNotification(params: GradeAmendedParams): StudentNotification {
  return {
    id: generateId("notif"),
    studentId: params.studentId,
    type: "grade_amended",
    title: "Grade updated",
    body: `Your grade for "${params.assessmentTitle}" in ${params.className} has been updated.`,
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: `/student/classes/${params.classId}/assessments/${params.assessmentId}`,
    dedupeKey: `${params.studentId}:${params.assessmentId}:grade_amended:${Date.now()}`,
  };
}

interface StudentExcusedParams {
  studentId: string;
  assessmentId: string;
  assessmentTitle: string;
  className: string;
  classId: string;
}

export function createStudentExcusedNotification(params: StudentExcusedParams): StudentNotification {
  return {
    id: generateId("notif"),
    studentId: params.studentId,
    type: "student_excused",
    title: "Assessment excused",
    body: `You have been excused from "${params.assessmentTitle}" in ${params.className}.`,
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: `/student/classes/${params.classId}/assessments/${params.assessmentId}`,
    dedupeKey: `${params.studentId}:${params.assessmentId}:student_excused`,
  };
}

interface AssessmentDueParams {
  studentId: string;
  assessmentId: string;
  assessmentTitle: string;
  className: string;
  classId: string;
  dueDate: string;
}

export function createAssessmentDueNotification(params: AssessmentDueParams): StudentNotification {
  return {
    id: generateId("notif"),
    studentId: params.studentId,
    type: "assessment_due",
    title: "Assessment due soon",
    body: `"${params.assessmentTitle}" in ${params.className} is due ${params.dueDate}.`,
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: `/student/classes/${params.classId}/assessments/${params.assessmentId}`,
    dedupeKey: `${params.studentId}:${params.assessmentId}:assessment_due`,
  };
}

interface PortfolioApprovedParams {
  studentId: string;
  artifactId: string;
  artifactTitle: string;
}

export function createPortfolioApprovedNotification(params: PortfolioApprovedParams): StudentNotification {
  return {
    id: generateId("notif"),
    studentId: params.studentId,
    type: "portfolio_approved",
    title: "Portfolio approved",
    body: `Your portfolio artifact "${params.artifactTitle}" has been approved.`,
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: `/student/portfolio`,
    dedupeKey: `${params.studentId}:${params.artifactId}:portfolio_approved`,
  };
}

interface PortfolioRevisionParams {
  studentId: string;
  artifactId: string;
  artifactTitle: string;
  revisionNote?: string;
}

export function createPortfolioRevisionNotification(params: PortfolioRevisionParams): StudentNotification {
  const noteSnippet = params.revisionNote
    ? ` Teacher's note: "${params.revisionNote}"`
    : "";
  return {
    id: generateId("notif"),
    studentId: params.studentId,
    type: "portfolio_revision",
    title: "Revision requested",
    body: `Your portfolio artifact "${params.artifactTitle}" needs revision.${noteSnippet}`,
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: `/student/portfolio?artifact=${params.artifactId}`,
    dedupeKey: `${params.studentId}:${params.artifactId}:portfolio_revision:${Date.now()}`,
  };
}

interface ReportDistributedParams {
  studentId: string;
  reportId: string;
  cycleName: string;
}

export function createReportDistributedNotification(params: ReportDistributedParams): StudentNotification {
  return {
    id: generateId("notif"),
    studentId: params.studentId,
    type: "report_distributed",
    title: "Report card available",
    body: `Your ${params.cycleName} report card is now available.`,
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: `/student/progress`,
    dedupeKey: `${params.studentId}:${params.reportId}:report_distributed`,
  };
}
