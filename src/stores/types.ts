import { Class, TimetableSlot } from "@/types/class";
import { Student } from "@/types/student";
import { Assessment, LearningGoal } from "@/types/assessment";
import { GradeRecord } from "@/types/gradebook";
import { PortfolioArtifact } from "@/types/portfolio";
import { AttendanceSession } from "@/types/attendance";
import { Incident, SupportPlan, IncidentTaxonomy } from "@/types/incident";
import { ReportCycle, Report, ReportTemplate, TranscriptYear } from "@/types/report";
import { Channel, Announcement, NotificationSettings } from "@/types/communication";
import { CalendarEvent } from "@/types/calendar";

export interface UIState {
  sidebarCollapsed: boolean;
  activeClassId: string | null;
  activeTerm: string;
  drawerOpen: boolean;
  drawerContent: string | null;
  simulateLatency: boolean;
  simulateErrors: boolean;
  hasHydrated: boolean;
}

export interface AppState {
  // Data
  classes: Class[];
  students: Student[];
  assessments: Assessment[];
  learningGoals: LearningGoal[];
  grades: GradeRecord[];
  artifacts: PortfolioArtifact[];
  attendanceSessions: AttendanceSession[];
  incidents: Incident[];
  supportPlans: SupportPlan[];
  taxonomy: IncidentTaxonomy;
  reportCycles: ReportCycle[];
  reports: Report[];
  reportTemplates: ReportTemplate[];
  transcripts: Record<string, TranscriptYear[]>;
  channels: Channel[];
  announcements: Announcement[];
  notificationSettings: NotificationSettings;
  calendarEvents: CalendarEvent[];

  // UI State
  ui: UIState;
}

export interface AppActions {
  // UI
  toggleSidebar: () => void;
  setActiveClass: (classId: string | null) => void;
  setActiveTerm: (term: string) => void;
  openDrawer: (content: string) => void;
  closeDrawer: () => void;
  setSimulateLatency: (v: boolean) => void;
  setSimulateErrors: (v: boolean) => void;
  setHasHydrated: (v: boolean) => void;

  // Classes
  getClassById: (id: string) => Class | undefined;

  // Students
  getStudentById: (id: string) => Student | undefined;
  getStudentsByClassId: (classId: string) => Student[];
  updateStudent: (id: string, updates: Partial<Student>) => void;

  // Assessments
  addAssessment: (assessment: Assessment) => void;
  updateAssessment: (id: string, updates: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;
  getAssessmentsByClassId: (classId: string) => Assessment[];

  // Grades
  addGrade: (grade: GradeRecord) => void;
  updateGrade: (id: string, updates: Partial<GradeRecord>) => void;
  getGradesByAssessment: (assessmentId: string) => GradeRecord[];
  getGradesByStudent: (studentId: string) => GradeRecord[];

  // Portfolio
  addArtifact: (artifact: PortfolioArtifact) => void;
  updateArtifact: (id: string, updates: Partial<PortfolioArtifact>) => void;
  getArtifactsByStudent: (studentId: string) => PortfolioArtifact[];
  getArtifactsByClass: (classId: string) => PortfolioArtifact[];
  getPendingArtifacts: () => PortfolioArtifact[];

  // Attendance
  addAttendanceSession: (session: AttendanceSession) => void;
  updateAttendanceSession: (id: string, updates: Partial<AttendanceSession>) => void;
  getSessionsByClass: (classId: string) => AttendanceSession[];
  getSessionsByStudent: (studentId: string) => AttendanceSession[];

  // Incidents
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncidentsByStudent: (studentId: string) => Incident[];

  // Support Plans
  addSupportPlan: (plan: SupportPlan) => void;
  updateSupportPlan: (id: string, updates: Partial<SupportPlan>) => void;
  getSupportPlansByStudent: (studentId: string) => SupportPlan[];

  // Taxonomy
  updateTaxonomy: (taxonomy: IncidentTaxonomy) => void;

  // Reports
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  getReportsByStudent: (studentId: string) => Report[];
  getReportsByCycle: (cycleId: string) => Report[];
  updateReportCycle: (id: string, updates: Partial<ReportCycle>) => void;

  // Communication
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  getAnnouncementsByChannel: (channelId: string) => Announcement[];
  getAnnouncementsByClass: (classId: string) => Announcement[];
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Calendar
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Reset
  resetAllData: (data: Omit<AppState, 'ui'>) => void;
}

export type AppStore = AppState & AppActions;
