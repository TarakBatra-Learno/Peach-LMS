import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppStore, AppState } from "./types";

const STORAGE_KEY = "peach-lms-store";

const defaultUIState = {
  sidebarCollapsed: false,
  activeClassId: null as string | null,
  activeTerm: "Term 1",
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
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...emptyState,
      ui: { ...defaultUIState },

      // UI Actions
      toggleSidebar: () => set((s) => ({ ui: { ...s.ui, sidebarCollapsed: !s.ui.sidebarCollapsed } })),
      setActiveClass: (classId) => set((s) => ({ ui: { ...s.ui, activeClassId: classId } })),
      setActiveTerm: (term) => set((s) => ({ ui: { ...s.ui, activeTerm: term } })),
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
