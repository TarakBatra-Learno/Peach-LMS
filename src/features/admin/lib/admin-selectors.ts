import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import type {
  AdminProgramme,
  AdminAnnouncementRecord,
  AdminCurriculumTeam,
  AdminModerationItem,
  AdminStudentAnalyticsRecord,
  AdminTemplateRecord,
  AdminUserRecord,
} from "@/features/admin/data/admin-types";

function matchesProgramme<T extends { programme: AdminProgramme | "Whole School" }>(
  item: T,
  programme: AdminProgramme
) {
  if (programme === "All") return true;
  return item.programme === programme;
}

function includesQuery(values: Array<string | number>, query: string) {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return values.some((value) => String(value).toLowerCase().includes(normalized));
}

export function getAdminProgrammeOptions(): AdminProgramme[] {
  return ["All", "PYP", "MYP", "DP"];
}

export function filterCurriculumTeams(programme: AdminProgramme, query: string) {
  return adminDemoData.curriculum.teams.filter(
    (team) =>
      matchesProgramme(team, programme) &&
      includesQuery([team.subject, team.gradeBand, team.lead, ...team.classes], query)
  );
}

export function filterTemplateLibrary(programme: AdminProgramme, query: string) {
  return adminDemoData.curriculum.templates.filter(
    (template) =>
      matchesProgramme(template, programme) &&
      includesQuery([template.name, template.scope, template.owner, ...template.usedBy], query)
  );
}

export function filterStudentAnalytics(
  programme: AdminProgramme,
  query: string,
  risk: string
) {
  return adminDemoData.performance.students.filter(
    (student) =>
      matchesProgramme(student, programme) &&
      (risk === "all" || student.risk.toLowerCase() === risk.toLowerCase()) &&
      includesQuery(
        [
          student.name,
          student.gradeBand,
          student.homeroom,
          student.latestAssessment,
          student.communicationFlag,
        ],
        query
      )
  );
}

export function filterModerationQueue(status: string, query: string) {
  return adminDemoData.communications.moderationQueue.filter(
    (item) =>
      (status === "all" || item.status.toLowerCase() === status.toLowerCase()) &&
      includesQuery([item.subject, item.channel, item.family, item.flagReason, item.owner], query)
  );
}

export function filterAnnouncements(programme: AdminProgramme, status: string) {
  return adminDemoData.communications.announcements.filter(
    (announcement) =>
      (programme === "All" ||
        announcement.programme === "Whole School" ||
        announcement.programme === programme) &&
      (status === "all" || announcement.status.toLowerCase() === status.toLowerCase())
  );
}

export function filterPlatformUsers(roleFilter: string, query: string) {
  return adminDemoData.platform.users.filter(
    (user) =>
      (roleFilter === "all" || user.role.toLowerCase().includes(roleFilter.toLowerCase())) &&
      includesQuery([user.name, user.role, user.group, user.email], query)
  );
}

export function getSelectedStudent(studentId: string | null): AdminStudentAnalyticsRecord | null {
  if (!studentId) return null;
  return adminDemoData.performance.students.find((student) => student.id === studentId) ?? null;
}

export function getSelectedCurriculumTeam(teamId: string | null): AdminCurriculumTeam | null {
  if (!teamId) return null;
  return adminDemoData.curriculum.teams.find((team) => team.id === teamId) ?? null;
}

export function getSelectedTemplate(templateId: string | null): AdminTemplateRecord | null {
  if (!templateId) return null;
  return adminDemoData.curriculum.templates.find((template) => template.id === templateId) ?? null;
}

export function getSelectedModerationItem(itemId: string | null): AdminModerationItem | null {
  if (!itemId) return null;
  return adminDemoData.communications.moderationQueue.find((item) => item.id === itemId) ?? null;
}

export function getSelectedAnnouncement(itemId: string | null): AdminAnnouncementRecord | null {
  if (!itemId) return null;
  return adminDemoData.communications.announcements.find((announcement) => announcement.id === itemId) ?? null;
}

export function getSelectedPlatformUser(userId: string | null): AdminUserRecord | null {
  if (!userId) return null;
  return adminDemoData.platform.users.find((user) => user.id === userId) ?? null;
}
