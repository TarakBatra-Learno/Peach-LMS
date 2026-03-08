import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppStore, AppState } from "./types";
import { materializeTimetableOccurrences } from "@/lib/unit-planning-utils";
import type { LessonSlotAssignment } from "@/types/unit-planning";

const STORAGE_KEY = "peach-lms-store";

const defaultUIState = {
  sidebarCollapsed: false,
  activeClassId: null as string | null,
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
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...emptyState,
      ui: { ...defaultUIState },

      // UI Actions
      toggleSidebar: () => set((s) => ({ ui: { ...s.ui, sidebarCollapsed: !s.ui.sidebarCollapsed } })),
      setActiveClass: (classId) => set((s) => ({ ui: { ...s.ui, activeClassId: classId } })),
      setActiveAcademicYear: (year) => set((s) => ({ ui: { ...s.ui, activeAcademicYear: year } })),
      openDrawer: (content) => set((s) => ({ ui: { ...s.ui, drawerOpen: true, drawerContent: content } })),
      closeDrawer: () => set((s) => ({ ui: { ...s.ui, drawerOpen: false, drawerContent: null } })),
      setSimulateLatency: (v) => set((s) => ({ ui: { ...s.ui, simulateLatency: v } })),
      setSimulateErrors: (v) => set((s) => ({ ui: { ...s.ui, simulateErrors: v } })),
      setHasHydrated: (v) => set((s) => ({ ui: { ...s.ui, hasHydrated: v } })),

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
      addAnnouncement: (announcement) => set((s) => ({ announcements: [...s.announcements, announcement] })),
      updateAnnouncement: (id, updates) => set((s) => ({
        announcements: s.announcements.map((a) => a.id === id ? { ...a, ...updates } : a),
      })),
      getAnnouncementsByChannel: (channelId) => get().announcements.filter((a) => a.channelId === channelId),
      getAnnouncementsByClass: (classId) => get().announcements.filter((a) => a.classId === classId),
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

      // Reset
      resetAllData: (data) => set({ ...data }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Don't persist UI transient state
        const { ui, ...rest } = state;
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
