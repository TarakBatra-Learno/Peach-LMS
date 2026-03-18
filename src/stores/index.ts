import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppStore, AppState } from "./types";
import { materializeTimetableOccurrences } from "@/lib/unit-planning-utils";
import type { LessonSlotAssignment } from "@/types/unit-planning";
import type { GradeRecord } from "@/types/gradebook";
import { generateId } from "@/services/mock-service";

const STORAGE_KEY = "peach-lms-store";

const defaultUIState = {
  sidebarCollapsed: false,
  activeClassId: null as string | null,
  studentActiveClassId: null as string | null,
  parentActiveStudentId: null as string | null,
  activeAcademicYear: "2025/26",
  drawerOpen: false,
  drawerContent: null as string | null,
  simulateLatency: true,
  simulateErrors: false,
  hasHydrated: false,
};

const emptyState: Omit<AppState, 'ui'> = {
  classes: [],
  students: [],
  assessments: [],
  learningGoals: [],
  grades: [],
  artifacts: [],
  attendanceSessions: [],
  incidents: [],
  supportPlans: [],
  taxonomy: { categories: [], tags: [] },
  reportCycles: [],
  reports: [],
  reportTemplates: [],
  transcripts: {},
  channels: [],
  announcements: [],
  notificationSettings: { announcements: true, assignments: true, grades: true, attendance: true, incidents: true },
  calendarEvents: [],
  unitPlans: [],
  lessonPlans: [],
  lessonSlotAssignments: [],
  // Student Portal
  currentUser: null,
  submissions: [],
  assessmentReports: [],
  assessmentInsightSummaries: [],
  studentGoals: [],
  goalEvidenceLinks: [],
  studentNotifications: [],
  parentProfiles: [],
  familyNotifications: [],
  classroomUpdates: [],
  schoolPolicies: [],
  studentSignInCodes: [],
  familyAnnouncements: [],
  familyThreads: [],
  familyMessages: [],
  familyCalendarEvents: [],
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...emptyState,
      ui: { ...defaultUIState },

      // UI Actions
      toggleSidebar: () => set((s) => ({ ui: { ...s.ui, sidebarCollapsed: !s.ui.sidebarCollapsed } })),
      setActiveClass: (classId) => set((s) => ({ ui: { ...s.ui, activeClassId: classId } })),
      setStudentActiveClass: (classId) => set((s) => ({ ui: { ...s.ui, studentActiveClassId: classId } })),
      setParentActiveStudent: (studentId) => set((s) => ({ ui: { ...s.ui, parentActiveStudentId: studentId } })),
      setActiveAcademicYear: (year) => set((s) => ({ ui: { ...s.ui, activeAcademicYear: year } })),
      openDrawer: (content) => set((s) => ({ ui: { ...s.ui, drawerOpen: true, drawerContent: content } })),
      closeDrawer: () => set((s) => ({ ui: { ...s.ui, drawerOpen: false, drawerContent: null } })),
      setSimulateLatency: (v) => set((s) => ({ ui: { ...s.ui, simulateLatency: v } })),
      setSimulateErrors: (v) => set((s) => ({ ui: { ...s.ui, simulateErrors: v } })),
      setHasHydrated: (v) => set((s) => ({ ui: { ...s.ui, hasHydrated: v } })),

      // Persona
      setCurrentUser: (user) => set({ currentUser: user }),
      switchPersona: (user) => set((s) => ({
        currentUser: user,
        ui: {
          ...s.ui,
          sidebarCollapsed: false,
          activeClassId: null,
          studentActiveClassId: null,
          parentActiveStudentId: null,
          drawerOpen: false,
          drawerContent: null,
        },
      })),

      // Classes
      getClassById: (id) => get().classes.find((c) => c.id === id),

      // Students
      getStudentById: (id) => get().students.find((s) => s.id === id),
      getStudentsByClassId: (classId) => {
        const cls = get().classes.find((c) => c.id === classId);
        if (!cls) return [];
        return get().students.filter((s) => cls.studentIds.includes(s.id));
      },
      updateStudent: (id, updates) => set((s) => ({
        students: s.students.map((st) => st.id === id ? { ...st, ...updates } : st),
      })),

      // Assessments
      addAssessment: (assessment) => set((s) => ({ assessments: [...s.assessments, assessment] })),
      updateAssessment: (id, updates) => set((s) => ({
        assessments: s.assessments.map((a) => a.id === id ? { ...a, ...updates } : a),
      })),
      deleteAssessment: (id) => set((s) => ({
        assessments: s.assessments.filter((a) => a.id !== id),
      })),
      getAssessmentsByClassId: (classId) => get().assessments.filter((a) => a.classId === classId),

      // Grades
      addGrade: (grade) => set((s) => ({ grades: [...s.grades, grade] })),
      updateGrade: (id, updates) => set((s) => ({
        grades: s.grades.map((g) => g.id === id ? { ...g, ...updates } : g),
      })),
      getGradesByAssessment: (assessmentId) => get().grades.filter((g) => g.assessmentId === assessmentId),
      getGradesByStudent: (studentId) => get().grades.filter((g) => g.studentId === studentId),

      // Portfolio
      addArtifact: (artifact) => set((s) => ({ artifacts: [...s.artifacts, artifact] })),
      updateArtifact: (id, updates) => set((s) => ({
        artifacts: s.artifacts.map((a) => a.id === id ? { ...a, ...updates } : a),
      })),
      getArtifactsByStudent: (studentId) => get().artifacts.filter((a) => a.studentId === studentId),
      getArtifactsByClass: (classId) => get().artifacts.filter((a) => a.classId === classId),
      getPendingArtifacts: () => get().artifacts.filter((a) => a.approvalStatus === "pending"),

      // Attendance
      addAttendanceSession: (session) => set((s) => ({ attendanceSessions: [...s.attendanceSessions, session] })),
      updateAttendanceSession: (id, updates) => set((s) => ({
        attendanceSessions: s.attendanceSessions.map((sess) => sess.id === id ? { ...sess, ...updates } : sess),
      })),
      getSessionsByClass: (classId) => get().attendanceSessions.filter((s) => s.classId === classId),
      getSessionsByStudent: (studentId) => get().attendanceSessions.filter((s) => s.records.some((r) => r.studentId === studentId)),

      // Incidents
      addIncident: (incident) => set((s) => ({ incidents: [...s.incidents, incident] })),
      updateIncident: (id, updates) => set((s) => ({
        incidents: s.incidents.map((i) => i.id === id ? { ...i, ...updates } : i),
      })),
      getIncidentsByStudent: (studentId) => get().incidents.filter((i) => i.studentId === studentId),

      // Support Plans
      addSupportPlan: (plan) => set((s) => ({ supportPlans: [...s.supportPlans, plan] })),
      updateSupportPlan: (id, updates) => set((s) => ({
        supportPlans: s.supportPlans.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),
      getSupportPlansByStudent: (studentId) => get().supportPlans.filter((p) => p.studentId === studentId),

      // Taxonomy
      updateTaxonomy: (taxonomy) => set({ taxonomy }),

      // Reports
      addReport: (report) => set((s) => ({ reports: [...s.reports, report] })),
      updateReport: (id, updates) => set((s) => ({
        reports: s.reports.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),
      getReportsByStudent: (studentId) => get().reports.filter((r) => r.studentId === studentId),
      getReportsByCycle: (cycleId) => get().reports.filter((r) => r.cycleId === cycleId),
      updateReportCycle: (id, updates) => set((s) => ({
        reportCycles: s.reportCycles.map((c) => c.id === id ? { ...c, ...updates } : c),
      })),

      // Communication
      addChannel: (channel) => set((s) => ({ channels: [...s.channels, channel] })),
      addAnnouncement: (announcement) => set((s) => ({ announcements: [...s.announcements, announcement] })),
      updateAnnouncement: (id, updates) => set((s) => ({
        announcements: s.announcements.map((a) => a.id === id ? { ...a, ...updates } : a),
      })),
      getAnnouncementsByChannel: (channelId) => get().announcements.filter((a) => a.channelId === channelId),
      getAnnouncementsByClass: (classId) => get().announcements.filter((a) => a.classId === classId),
      addThreadReply: (announcementId, reply) => set((s) => ({
        announcements: s.announcements.map((a) =>
          a.id === announcementId
            ? { ...a, threadReplies: [...a.threadReplies, reply] }
            : a
        ),
      })),
      updateNotificationSettings: (settings) => set((s) => ({
        notificationSettings: { ...s.notificationSettings, ...settings },
      })),

      // Calendar
      addCalendarEvent: (event) => set((s) => ({ calendarEvents: [...s.calendarEvents, event] })),
      updateCalendarEvent: (id, updates) => set((s) => ({
        calendarEvents: s.calendarEvents.map((e) => e.id === id ? { ...e, ...updates } : e),
      })),
      deleteCalendarEvent: (id) => set((s) => ({
        calendarEvents: s.calendarEvents.filter((e) => e.id !== id),
      })),

      // Unit Plans
      addUnitPlan: (unit) => set((s) => ({ unitPlans: [...s.unitPlans, unit] })),
      updateUnitPlan: (id, updates) => set((s) => ({
        unitPlans: s.unitPlans.map((u) => u.id === id ? { ...u, ...updates } : u),
      })),
      deleteUnitPlan: (id) => set((s) => {
        const unit = s.unitPlans.find((u) => u.id === id);
        if (!unit) return {};
        const lessonPlanIds = new Set(unit.lessonPlanIds);
        return {
          unitPlans: s.unitPlans.filter((u) => u.id !== id),
          lessonPlans: s.lessonPlans.filter((lp) => !lessonPlanIds.has(lp.id)),
          lessonSlotAssignments: s.lessonSlotAssignments.filter((a) => a.unitId !== id),
          assessments: s.assessments.map((a) => a.unitId === id ? { ...a, unitId: undefined } : a),
        };
      }),
      getUnitPlansByClassId: (classId) => get().unitPlans.filter((u) => u.classId === classId),

      // Lesson Plans
      addLessonPlan: (lesson) => set((s) => ({
        lessonPlans: [...s.lessonPlans, lesson],
        unitPlans: s.unitPlans.map((u) =>
          u.id === lesson.unitId ? { ...u, lessonPlanIds: [...u.lessonPlanIds, lesson.id] } : u
        ),
      })),
      updateLessonPlan: (id, updates) => set((s) => ({
        lessonPlans: s.lessonPlans.map((lp) => lp.id === id ? { ...lp, ...updates } : lp),
      })),
      deleteLessonPlan: (id) => set((s) => {
        const lp = s.lessonPlans.find((l) => l.id === id);
        if (!lp) return {};
        return {
          lessonPlans: s.lessonPlans.filter((l) => l.id !== id),
          lessonSlotAssignments: s.lessonSlotAssignments.filter((a) => a.lessonPlanId !== id),
          unitPlans: s.unitPlans.map((u) =>
            u.id === lp.unitId ? { ...u, lessonPlanIds: u.lessonPlanIds.filter((lpId) => lpId !== id) } : u
          ),
        };
      }),
      getLessonPlansByUnitId: (unitId) => get().lessonPlans.filter((lp) => lp.unitId === unitId),

      // Lesson Slot Assignments
      assignLessonToSlot: (assignment) => set((s) => ({
        lessonSlotAssignments: [...s.lessonSlotAssignments, assignment],
        lessonPlans: s.lessonPlans.map((lp) =>
          lp.id === assignment.lessonPlanId ? { ...lp, status: "assigned" as const } : lp
        ),
      })),
      unassignLessonFromSlot: (lessonPlanId) => set((s) => ({
        lessonSlotAssignments: s.lessonSlotAssignments.filter((a) => a.lessonPlanId !== lessonPlanId),
        lessonPlans: s.lessonPlans.map((lp) =>
          lp.id === lessonPlanId ? { ...lp, status: "ready" as const } : lp
        ),
      })),
      getAssignmentsByUnitId: (unitId) => get().lessonSlotAssignments.filter((a) => a.unitId === unitId),
      getAssignmentBySlot: (classId, date, slotStartTime) =>
        get().lessonSlotAssignments.find(
          (a) => a.classId === classId && a.date === date && a.slotStartTime === slotStartTime
        ),
      autoFillLessonSequence: (unitId) => {
        const state = get();
        const unit = state.unitPlans.find((u) => u.id === unitId);
        if (!unit) return 0;
        const cls = state.classes.find((c) => c.id === unit.classId);
        if (!cls) return 0;

        const occurrences = materializeTimetableOccurrences(cls.schedule, unit.startDate, unit.endDate);
        const existingAssignments = state.lessonSlotAssignments.filter((a) => a.classId === unit.classId);
        const assignedSlotKeys = new Set(existingAssignments.map((a) => `${a.date}_${a.slotStartTime}`));
        const availableOccurrences = occurrences.filter(
          (o) => !assignedSlotKeys.has(`${o.date}_${o.slotStartTime}`)
        );

        const readyLessons = state.lessonPlans
          .filter((lp) => lp.unitId === unitId && lp.status === "ready")
          .sort((a, b) => a.sequence - b.sequence);

        const count = Math.min(readyLessons.length, availableOccurrences.length);
        if (count === 0) return 0;

        const newAssignments: LessonSlotAssignment[] = [];
        const updatedLessonIds = new Set<string>();
        for (let i = 0; i < count; i++) {
          const lp = readyLessons[i];
          const occ = availableOccurrences[i];
          newAssignments.push({
            id: `lsa_auto_${Date.now()}_${i}`,
            lessonPlanId: lp.id,
            unitId,
            classId: unit.classId,
            date: occ.date,
            slotDay: occ.slotDay,
            slotStartTime: occ.slotStartTime,
            createdAt: new Date().toISOString(),
          });
          updatedLessonIds.add(lp.id);
        }

        set((s) => ({
          lessonSlotAssignments: [...s.lessonSlotAssignments, ...newAssignments],
          lessonPlans: s.lessonPlans.map((lp) =>
            updatedLessonIds.has(lp.id) ? { ...lp, status: "assigned" as const } : lp
          ),
        }));
        return count;
      },

      // Assessment ↔ Unit linking
      linkAssessmentToUnit: (assessmentId, unitId) => set((s) => ({
        assessments: s.assessments.map((a) =>
          a.id === assessmentId ? { ...a, unitId } : a
        ),
      })),
      unlinkAssessmentFromUnit: (assessmentId) => set((s) => ({
        assessments: s.assessments.map((a) =>
          a.id === assessmentId ? { ...a, unitId: undefined } : a
        ),
      })),

      // Submissions

      // ── Private helper: sync Submission.status → GradeRecord.submissionStatus ──
      // Called by addSubmission and by updateSubmission when a draft becomes submitted.
      // Sets GradeRecord.submissionStatus to "submitted" (teacher-facing = "To mark").
      // Guardrails:
      //   - Never touch excused GradeRecords (terminal state)
      //   - Never clear grade data fields (score, rubric, feedback, etc.)
      //   - Teacher manual overrides still win after sync
      // Note: not exposed on the store interface — internal helper only.

      addSubmission: (submission) => {
        set((s) => ({ submissions: [...s.submissions, submission] }));

        // Sync: if status is "submitted", create/update GradeRecord
        if (submission.status === "submitted") {
          const currentState = get();
          const assessment = currentState.assessments.find(
            (a) => a.id === submission.assessmentId
          );
          if (!assessment) return;

          const existingGrade = currentState.grades.find(
            (g) =>
              g.assessmentId === submission.assessmentId &&
              g.studentId === submission.studentId
          );

          if (!existingGrade) {
            set((s) => ({
              grades: [
                ...s.grades,
                {
                  id: generateId("grade"),
                  assessmentId: submission.assessmentId,
                  studentId: submission.studentId,
                  classId: submission.classId,
                  gradingMode: assessment.gradingMode,
                  submissionStatus: "submitted" as const,
                  gradingStatus: "none" as const,
                  submittedAt: new Date().toISOString(),
                },
              ],
            }));
          } else if (
            existingGrade.submissionStatus === "none" ||
            existingGrade.submissionStatus === "submitted"
          ) {
            set((s) => ({
              grades: s.grades.map((g) =>
                g.id === existingGrade.id
                  ? { ...g, submissionStatus: "submitted" as const, submittedAt: new Date().toISOString() }
                  : g
              ),
            }));
          }
          // If excused → do nothing (terminal state, never overridden)
        }
      },
      updateSubmission: (id, updates) => {
        // Apply the submission update
        set((s) => ({
          submissions: s.submissions.map((sub) => sub.id === id ? { ...sub, ...updates } : sub),
        }));

        // ── Sync side-effect: Submission.status → GradeRecord.submissionStatus ──
        // Fires when a submission transitions from draft to submitted.
        if (updates.status === "submitted") {
          const currentState = get();
          const updatedSub = currentState.submissions.find((sub) => sub.id === id);
          if (!updatedSub) return;

          const assessment = currentState.assessments.find(
            (a) => a.id === updatedSub.assessmentId
          );
          if (!assessment) return;

          const existingGrade = currentState.grades.find(
            (g) =>
              g.assessmentId === updatedSub.assessmentId &&
              g.studentId === updatedSub.studentId
          );

          if (!existingGrade) {
            set((s) => ({
              grades: [
                ...s.grades,
                {
                  id: generateId("grade"),
                  assessmentId: updatedSub.assessmentId,
                  studentId: updatedSub.studentId,
                  classId: updatedSub.classId,
                  gradingMode: assessment.gradingMode,
                  submissionStatus: "submitted" as const,
                  gradingStatus: "none" as const,
                  submittedAt: new Date().toISOString(),
                },
              ],
            }));
          } else if (
            existingGrade.submissionStatus === "none" ||
            existingGrade.submissionStatus === "submitted"
          ) {
            set((s) => ({
              grades: s.grades.map((g) =>
                g.id === existingGrade.id
                  ? { ...g, submissionStatus: "submitted" as const, submittedAt: new Date().toISOString() }
                  : g
              ),
            }));
          }
          // If excused → do nothing (terminal state, never overridden)
        }
      },
      getSubmissionsByAssessment: (assessmentId) => get().submissions.filter((s) => s.assessmentId === assessmentId),
      getSubmissionsByStudent: (studentId) => get().submissions.filter((s) => s.studentId === studentId),

      // Assessment Reports
      addAssessmentReport: (report) => set((s) => ({ assessmentReports: [...s.assessmentReports, report] })),
      updateAssessmentReport: (id, updates) => set((s) => ({
        assessmentReports: s.assessmentReports.map((report) =>
          report.id === id ? { ...report, ...updates } : report
        ),
      })),
      getAssessmentReport: (assessmentId, studentId) =>
        get().assessmentReports.find(
          (report) => report.assessmentId === assessmentId && report.studentId === studentId
        ),
      getAssessmentReportsByAssessment: (assessmentId) =>
        get().assessmentReports.filter((report) => report.assessmentId === assessmentId),
      upsertAssessmentInsightSummary: (summary) => set((s) => {
        const existing = s.assessmentInsightSummaries.find((item) => item.assessmentId === summary.assessmentId);
        if (!existing) {
          return { assessmentInsightSummaries: [...s.assessmentInsightSummaries, summary] };
        }
        return {
          assessmentInsightSummaries: s.assessmentInsightSummaries.map((item) =>
            item.assessmentId === summary.assessmentId ? { ...item, ...summary } : item
          ),
        };
      }),
      getAssessmentInsightSummary: (assessmentId) =>
        get().assessmentInsightSummaries.find((summary) => summary.assessmentId === assessmentId),

      // Student Goals
      addStudentGoal: (goal) => set((s) => ({ studentGoals: [...s.studentGoals, goal] })),
      updateStudentGoal: (id, updates) => set((s) => ({
        studentGoals: s.studentGoals.map((g) =>
          g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
        ),
      })),
      deleteStudentGoal: (id) => set((s) => ({
        studentGoals: s.studentGoals.filter((g) => g.id !== id),
        goalEvidenceLinks: s.goalEvidenceLinks.filter((l) => l.goalId !== id),
      })),
      getStudentGoalsByStudent: (studentId) => get().studentGoals.filter((g) => g.studentId === studentId),

      // Goal Evidence Links
      addGoalEvidenceLink: (link) => set((s) => ({
        goalEvidenceLinks: [...s.goalEvidenceLinks, link],
        studentGoals: s.studentGoals.map((g) =>
          g.id === link.goalId ? { ...g, updatedAt: new Date().toISOString() } : g
        ),
      })),
      updateGoalEvidenceLink: (id, updates) => set((s) => ({
        goalEvidenceLinks: s.goalEvidenceLinks.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      })),
      deleteGoalEvidenceLink: (id) => set((s) => {
        const link = s.goalEvidenceLinks.find((l) => l.id === id);
        return {
          goalEvidenceLinks: s.goalEvidenceLinks.filter((l) => l.id !== id),
          studentGoals: link
            ? s.studentGoals.map((g) =>
                g.id === link.goalId ? { ...g, updatedAt: new Date().toISOString() } : g
              )
            : s.studentGoals,
        };
      }),
      getGoalEvidenceLinksByGoal: (goalId) => get().goalEvidenceLinks.filter((l) => l.goalId === goalId),
      getGoalEvidenceLinksBySource: (sourceType, sourceId) =>
        get().goalEvidenceLinks.filter((l) => l.sourceType === sourceType && l.sourceId === sourceId),

      // Student Notifications
      addStudentNotification: (notification) => set((s) => {
        // Deduplication: check if notification with same dedupeKey already exists
        if (notification.dedupeKey) {
          const exists = s.studentNotifications.some(
            (n) => n.dedupeKey === notification.dedupeKey
          );
          if (exists) return {};
        }
        return { studentNotifications: [...s.studentNotifications, notification] };
      }),
      markNotificationRead: (id) => set((s) => ({
        studentNotifications: s.studentNotifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
      markAllNotificationsRead: (studentId) => set((s) => ({
        studentNotifications: s.studentNotifications.map((n) =>
          n.studentId === studentId ? { ...n, read: true } : n
        ),
      })),
      getNotificationsByStudent: (studentId) =>
        get().studentNotifications.filter((n) => n.studentId === studentId),

      // Parent / Family Portal
      updateParentProfile: (id, updates) => set((s) => ({
        parentProfiles: s.parentProfiles.map((profile) =>
          profile.id === id ? { ...profile, ...updates } : profile
        ),
      })),
      addFamilyMessage: (message) => set((s) => ({
        familyMessages: [...s.familyMessages, message],
        familyThreads: s.familyThreads.map((thread) =>
          thread.id === message.threadId
            ? { ...thread, lastMessageAt: message.createdAt }
            : thread
        ),
      })),
      markFamilyThreadRead: (threadId, parentId) => set((s) => ({
        familyMessages: s.familyMessages.map((message) =>
          message.threadId === threadId && !message.readByParentIds.includes(parentId)
            ? { ...message, readByParentIds: [...message.readByParentIds, parentId] }
            : message
        ),
      })),
      toggleFamilyThreadMute: (threadId, parentId) => set((s) => ({
        familyThreads: s.familyThreads.map((thread) => {
          if (thread.id !== threadId) return thread;
          const isMuted = thread.mutedByParentIds.includes(parentId);
          return {
            ...thread,
            mutedByParentIds: isMuted
              ? thread.mutedByParentIds.filter((id) => id !== parentId)
              : [...thread.mutedByParentIds, parentId],
          };
        }),
      })),
      markFamilyAnnouncementRead: (id, parentId) => set((s) => ({
        familyAnnouncements: s.familyAnnouncements.map((announcement) =>
          announcement.id === id && !announcement.readByParentIds.includes(parentId)
            ? { ...announcement, readByParentIds: [...announcement.readByParentIds, parentId] }
            : announcement
        ),
      })),
      markAllFamilyAnnouncementsRead: (parentId) => set((s) => ({
        familyAnnouncements: s.familyAnnouncements.map((announcement) =>
          announcement.readByParentIds.includes(parentId)
            ? announcement
            : { ...announcement, readByParentIds: [...announcement.readByParentIds, parentId] }
        ),
      })),
      markFamilyNotificationRead: (id) => set((s) => ({
        familyNotifications: s.familyNotifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        ),
      })),
      markAllFamilyNotificationsRead: (parentId) => set((s) => ({
        familyNotifications: s.familyNotifications.map((notification) =>
          notification.parentId === parentId ? { ...notification, read: true } : notification
        ),
      })),

      // Assessment Lifecycle
      publishAssessment: (id) => set((s) => ({
        assessments: s.assessments.map((a) =>
          a.id === id
            ? { ...a, status: "live" as const, distributedAt: new Date().toISOString() }
            : a
        ),
      })),

      closeAssessment: (id, force = false) => {
        const now = new Date().toISOString();

        if (force) {
          // Force-close: mutate all non-terminal grades to excused
          set((s) => {
            const assessment = s.assessments.find((a) => a.id === id);
            if (!assessment) return {};

            return {
              assessments: s.assessments.map((a) =>
                a.id === id
                  ? { ...a, status: "closed" as const, closedAt: now, forceClosed: true }
                  : a
              ),
              grades: s.grades.map((g) => {
                if (g.assessmentId !== id) return g;
                // Only mutate if not already excused and not released
                if (g.submissionStatus === "excused") return g;
                if (g.releasedAt) return g;
                // Force excused: clear all grade data
                return {
                  ...g,
                  submissionStatus: "excused" as const,
                  score: undefined,
                  dpGrade: undefined,
                  mypCriteriaScores: undefined,
                  rubricScores: undefined,
                  standardsMastery: undefined,
                  checklistGradeResults: undefined,
                  checklistResults: undefined,
                  feedback: undefined,
                  feedbackAttachments: undefined,
                  gradingStatus: undefined,
                  amendedAt: undefined,
                  reportStatus: undefined,
                  gradedAt: undefined,
                  submittedAt: undefined,
                  releasedAt: undefined,
                  updatedAt: now,
                };
              }),
            };
          });
        } else {
          // Normal close: just update assessment status
          set((s) => ({
            assessments: s.assessments.map((a) =>
              a.id === id
                ? { ...a, status: "closed" as const, closedAt: now, forceClosed: false }
                : a
            ),
          }));
        }
      },

      reopenAssessment: (id) => set((s) => ({
        assessments: s.assessments.map((a) =>
          a.id === id
            ? { ...a, status: "live" as const, closedAt: undefined, forceClosed: undefined }
            : a
        ),
      })),

      // Grade Amendments
      amendGrade: (gradeId, updates) => {
        const now = new Date().toISOString();
        set((s) => ({
          grades: s.grades.map((g) => {
            if (g.id !== gradeId) return g;
            const amended: Partial<GradeRecord> = {
              ...updates,
              amendedAt: now,
            };
            // If reportStatus was "seen", reset to "unseen" since grade changed
            if (g.reportStatus === "seen") {
              amended.reportStatus = "unseen";
            }
            return { ...g, ...amended };
          }),
        }));
      },

      // Reset
      resetAllData: (data) => set((s) => ({
        ...data,
        currentUser: s.currentUser ?? data.currentUser,
      })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Don't persist UI transient state
        const rest = Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== "ui")
        ) as Record<string, unknown>;
        // Remove functions from what we persist
        const dataOnly: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (typeof value !== 'function') {
            dataOnly[key] = value;
          }
        }
        return dataOnly;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
