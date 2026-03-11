import type { AppState } from "@/stores/types";
import type { Assessment } from "@/types/assessment";
import type { AttendanceRecord, AttendanceSession } from "@/types/attendance";
import type {
  ClassroomUpdate,
  FamilyAnnouncement,
  FamilyCalendarEvent,
  FamilyMessage,
  FamilyNotification,
  FamilyThread,
  ParentProfile,
  SchoolPolicy,
} from "@/types/family";
import type { GradeRecord } from "@/types/gradebook";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Report } from "@/types/report";
import type { Student } from "@/types/student";
import type { Submission } from "@/types/submission";
import type { UnitPlan } from "@/types/unit-planning";
import {
  getStudentAssessments,
  getStudentReleasedGrades,
  getStudentSubmission,
  getStudentSubmissionStatus,
  getStudentTimetable,
} from "./student-selectors";

export interface FamilyAssessmentEntry {
  studentId: string;
  assessment: Assessment;
  submission?: Submission;
  grade?: GradeRecord;
  submissionStatus: ReturnType<typeof getStudentSubmissionStatus>;
  className: string;
  studentName: string;
  unit?: UnitPlan;
}

export interface FamilyAttendanceEntry {
  id: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  date: string;
  record: AttendanceRecord;
  session: AttendanceSession;
}

export interface FamilyTimelineEntry {
  id: string;
  type: "portfolio" | "update" | "result" | "report" | "attendance" | "deadline";
  sourceId?: string;
  studentId: string;
  title: string;
  summary: string;
  date: string;
  classId?: string;
  className?: string;
  linkTo?: string;
}

export function getParentProfile(
  state: AppState,
  parentId: string | null | undefined
): ParentProfile | undefined {
  if (!parentId) return undefined;
  return state.parentProfiles.find((profile) => profile.id === parentId);
}

export function getParentChildren(state: AppState, parentId: string): Student[] {
  const parent = getParentProfile(state, parentId);
  if (!parent) return [];
  return state.students.filter((student) => parent.linkedStudentIds.includes(student.id));
}

export function getEffectiveParentStudentId(state: AppState, parentId: string): string | null {
  const parent = getParentProfile(state, parentId);
  if (!parent) return null;
  if (state.ui.parentActiveStudentId && parent.linkedStudentIds.includes(state.ui.parentActiveStudentId)) {
    return state.ui.parentActiveStudentId;
  }
  if (parent.linkedStudentIds.length === 1) {
    return parent.linkedStudentIds[0];
  }
  return null;
}

export function getScopedChildIds(
  state: AppState,
  parentId: string,
  studentId?: string | null
): string[] {
  const parent = getParentProfile(state, parentId);
  if (!parent) return [];
  const effectiveStudentId = studentId ?? getEffectiveParentStudentId(state, parentId);
  if (effectiveStudentId && parent.linkedStudentIds.includes(effectiveStudentId)) {
    return [effectiveStudentId];
  }
  return parent.linkedStudentIds;
}

export function getFamilyVisibleArtifacts(
  state: AppState,
  parentId: string,
  studentId?: string | null
): PortfolioArtifact[] {
  const scopedIds = getScopedChildIds(state, parentId, studentId);
  return state.artifacts
    .filter((artifact) =>
      scopedIds.includes(artifact.studentId) &&
      artifact.approvalStatus === "approved" &&
      artifact.familyShareStatus !== "not_shared"
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getFamilyVisibleClassroomUpdates(
  state: AppState,
  parentId: string,
  studentId?: string | null
): ClassroomUpdate[] {
  const scopedIds = getScopedChildIds(state, parentId, studentId);
  return state.classroomUpdates
    .filter((update) => update.studentIds.some((id) => scopedIds.includes(id)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getFamilyVisibleUnits(
  state: AppState,
  parentId: string,
  studentId: string
): UnitPlan[] {
  const child = state.students.find((student) => student.id === studentId);
  if (!child) return [];
  return state.unitPlans
    .filter((unit) => child.classIds.includes(unit.classId) && unit.status !== "draft" && unit.status !== "archived")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function getFamilyAssessmentEntries(
  state: AppState,
  parentId: string,
  studentId: string
): FamilyAssessmentEntry[] {
  const parent = getParentProfile(state, parentId);
  if (!parent || !parent.linkedStudentIds.includes(studentId)) return [];

  const visibleAssessments = getStudentAssessments(state, studentId);
  const releasedGrades = getStudentReleasedGrades(state, studentId);
  const student = state.students.find((entry) => entry.id === studentId);

  return visibleAssessments
    .map<FamilyAssessmentEntry | null>((view) => {
      const assessment = state.assessments.find((entry) => entry.id === view.id);
      if (!assessment) return null;
      const submission = getStudentSubmission(state, studentId, assessment.id);
      const rawGrade = state.grades.find(
        (grade) => grade.studentId === studentId && grade.assessmentId === assessment.id
      );
      const releasedGrade = releasedGrades.find((grade) => grade.assessmentId === assessment.id);
      const unit = assessment.unitId
        ? state.unitPlans.find((entry) => entry.id === assessment.unitId && entry.status !== "draft")
        : undefined;

      const entry: FamilyAssessmentEntry = {
        studentId,
        assessment,
        submissionStatus: getStudentSubmissionStatus(rawGrade, submission, assessment),
        className: state.classes.find((entry) => entry.id === assessment.classId)?.name ?? "Class",
        studentName: student ? `${student.firstName} ${student.lastName}` : "Student",
      };
      if (submission) entry.submission = submission;
      if (releasedGrade) entry.grade = releasedGrade;
      if (unit) entry.unit = unit;
      return entry;
    })
    .filter((entry): entry is FamilyAssessmentEntry => entry !== null)
    .sort((a, b) => a.assessment.dueDate.localeCompare(b.assessment.dueDate));
}

export function getFamilyVisibleReports(
  state: AppState,
  parentId: string,
  studentId: string
): Report[] {
  const parent = getParentProfile(state, parentId);
  if (!parent || !parent.linkedStudentIds.includes(studentId)) return [];
  return state.reports
    .filter((report) => report.studentId === studentId && report.distributionStatus === "completed")
    .sort((a, b) => (b.distributedAt ?? "").localeCompare(a.distributedAt ?? ""));
}

export function getFamilyAttendanceEntries(
  state: AppState,
  parentId: string,
  studentId: string
): FamilyAttendanceEntry[] {
  const parent = getParentProfile(state, parentId);
  if (!parent || !parent.linkedStudentIds.includes(studentId)) return [];
  const student = state.students.find((entry) => entry.id === studentId);

  return state.attendanceSessions
    .flatMap((session) => {
      const record = session.records.find((entry) => entry.studentId === studentId);
      if (!record) return [];
      const className = state.classes.find((entry) => entry.id === session.classId)?.name ?? "Class";
      return [
        {
          id: `${session.id}_${studentId}`,
          classId: session.classId,
          className,
          studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Student",
          date: session.date,
          record,
          session,
        },
      ];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getFamilyAnnouncements(
  state: AppState,
  parentId: string,
  studentId?: string | null
): FamilyAnnouncement[] {
  const scopedIds = getScopedChildIds(state, parentId, studentId);
  return state.familyAnnouncements
    .filter((announcement) => announcement.studentIds.some((id) => scopedIds.includes(id)))
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export function getFamilyThreads(
  state: AppState,
  parentId: string,
  kind: FamilyThread["kind"],
  studentId?: string | null
): FamilyThread[] {
  const scopedIds = getScopedChildIds(state, parentId, studentId);
  return state.familyThreads
    .filter((thread) =>
      thread.kind === kind &&
      thread.participantIds.includes(parentId) &&
      (!thread.studentId || scopedIds.includes(thread.studentId))
    )
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function getFamilyMessagesForThread(
  state: AppState,
  threadId: string
): FamilyMessage[] {
  return state.familyMessages
    .filter((message) => message.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getFamilyNotifications(
  state: AppState,
  parentId: string,
  studentId?: string | null
): FamilyNotification[] {
  const scopedIds = getScopedChildIds(state, parentId, studentId);
  return state.familyNotifications
    .filter((notification) =>
      notification.parentId === parentId &&
      (!notification.studentId || scopedIds.includes(notification.studentId))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getFamilyCalendarItems(
  state: AppState,
  parentId: string,
  studentId?: string | null
): FamilyCalendarEvent[] {
  const scopedIds = getScopedChildIds(state, parentId, studentId);
  return state.familyCalendarEvents
    .filter((event) => event.studentIds.some((id) => scopedIds.includes(id)))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getFamilyPolicies(state: AppState): SchoolPolicy[] {
  return [...state.schoolPolicies].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getFamilyDeadlineEntries(
  state: AppState,
  parentId: string,
  studentId?: string | null
): FamilyAssessmentEntry[] {
  return getScopedChildIds(state, parentId, studentId)
    .flatMap((childId) => getFamilyAssessmentEntries(state, parentId, childId))
    .filter((entry) => entry.submissionStatus !== "excused")
    .sort((a, b) => a.assessment.dueDate.localeCompare(b.assessment.dueDate));
}

export function getFamilyTimetable(
  state: AppState,
  parentId: string,
  studentId: string,
  startDate: string,
  endDate: string
) {
  const parent = getParentProfile(state, parentId);
  if (!parent || !parent.linkedStudentIds.includes(studentId)) return [];
  return getStudentTimetable(state, studentId, startDate, endDate);
}

export function getFamilyTimelineEntries(
  state: AppState,
  parentId: string,
  studentId: string
): FamilyTimelineEntry[] {
  const artifacts = getFamilyVisibleArtifacts(state, parentId, studentId).map((artifact) => ({
    id: `timeline_artifact_${artifact.id}`,
    type: "portfolio" as const,
    sourceId: artifact.id,
    studentId: artifact.studentId,
    title: artifact.title,
    summary: artifact.description || "New learning evidence was shared with your family.",
    date: artifact.updatedAt,
    classId: artifact.classId,
    className: state.classes.find((entry) => entry.id === artifact.classId)?.name,
    linkTo: `/family/learning?tab=portfolio&artifact=${artifact.id}&child=${studentId}`,
  }));

  const updates = getFamilyVisibleClassroomUpdates(state, parentId, studentId).map((update) => ({
    id: `timeline_update_${update.id}`,
    type: "update" as const,
    sourceId: update.id,
    studentId,
    title: update.title,
    summary: update.body,
    date: update.createdAt,
    classId: update.classId,
    className: state.classes.find((entry) => entry.id === update.classId)?.name,
    linkTo: `/family/learning?tab=updates&update=${update.id}&child=${studentId}`,
  }));

  const results = getFamilyAssessmentEntries(state, parentId, studentId)
    .filter((entry) => entry.grade)
    .map((entry) => ({
      id: `timeline_result_${entry.assessment.id}`,
      type: "result" as const,
      sourceId: entry.assessment.id,
      studentId,
      title: `${entry.assessment.title} result released`,
      summary: entry.className,
      date: entry.grade?.releasedAt ?? entry.assessment.dueDate,
      classId: entry.assessment.classId,
      className: entry.className,
      linkTo: `/family/assessments/${entry.assessment.id}?child=${studentId}`,
    }));

  const reports = getFamilyVisibleReports(state, parentId, studentId).map((report) => ({
    id: `timeline_report_${report.id}`,
    type: "report" as const,
    sourceId: report.id,
    studentId,
    title: "Progress report published",
    summary: state.reportCycles.find((cycle) => cycle.id === report.cycleId)?.name ?? "Reporting cycle",
    date: report.distributedAt ?? report.publishedAt ?? report.id,
    classId: report.classId,
    className: state.classes.find((entry) => entry.id === report.classId)?.name,
    linkTo: `/family/reports/${report.id}?child=${studentId}`,
  }));

  const attendance = getFamilyAttendanceEntries(state, parentId, studentId)
    .filter((entry) => entry.record.status !== "present")
    .map((entry) => ({
      id: `timeline_attendance_${entry.id}`,
      type: "attendance" as const,
      sourceId: entry.id,
      studentId,
      title: `${entry.record.status[0].toUpperCase()}${entry.record.status.slice(1)} recorded`,
      summary: entry.className,
      date: entry.date,
      classId: entry.classId,
      className: entry.className,
      linkTo: `/family/attendance?child=${studentId}`,
    }));

  const deadlines = getFamilyAssessmentEntries(state, parentId, studentId)
    .filter((entry) => entry.submissionStatus === "due" || entry.submissionStatus === "overdue")
    .map((entry) => ({
      id: `timeline_deadline_${entry.assessment.id}`,
      type: "deadline" as const,
      sourceId: entry.assessment.id,
      studentId,
      title: `${entry.assessment.title} due`,
      summary: entry.className,
      date: entry.assessment.dueDate,
      classId: entry.assessment.classId,
      className: entry.className,
      linkTo: `/family/assessments/${entry.assessment.id}?child=${studentId}`,
    }));

  return [...artifacts, ...updates, ...results, ...reports, ...attendance, ...deadlines].sort(
    (a, b) => b.date.localeCompare(a.date)
  );
}
