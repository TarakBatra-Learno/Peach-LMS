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
import { UnitPlan, LessonPlan, LessonSlotAssignment } from "@/types/unit-planning";
import { CurrentUser } from "@/types/auth";
import { Submission } from "@/types/submission";
import { StudentGoal } from "@/types/student-goal";
import { GoalEvidenceLink } from "@/types/goal-evidence";
import { StudentNotification } from "@/types/notification";
import {
  ParentProfile,
  FamilyNotification,
  ClassroomUpdate,
  SchoolPolicy,
  StudentSignInCode,
  FamilyAnnouncement,
  FamilyThread,
  FamilyMessage,
  FamilyCalendarEvent,
} from "@/types/family";

export interface UIState {
  sidebarCollapsed: boolean;
  activeClassId: string | null;
  studentActiveClassId: string | null;
  parentActiveStudentId: string | null;
  activeAcademicYear: string;
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
  unitPlans: UnitPlan[];
  lessonPlans: LessonPlan[];
  lessonSlotAssignments: LessonSlotAssignment[];

  // Student Portal Data
  currentUser: CurrentUser | null;
  submissions: Submission[];
  studentGoals: StudentGoal[];
  goalEvidenceLinks: GoalEvidenceLink[];
  studentNotifications: StudentNotification[];
  parentProfiles: ParentProfile[];
  familyNotifications: FamilyNotification[];
  classroomUpdates: ClassroomUpdate[];
  schoolPolicies: SchoolPolicy[];
  studentSignInCodes: StudentSignInCode[];
  familyAnnouncements: FamilyAnnouncement[];
  familyThreads: FamilyThread[];
  familyMessages: FamilyMessage[];
  familyCalendarEvents: FamilyCalendarEvent[];

  // UI State
  ui: UIState;
}

export interface AppActions {
  // UI
  toggleSidebar: () => void;
  setActiveClass: (classId: string | null) => void;
  setStudentActiveClass: (classId: string | null) => void;
  setParentActiveStudent: (studentId: string | null) => void;
  setActiveAcademicYear: (year: string) => void;
  openDrawer: (content: string) => void;
  closeDrawer: () => void;
  setSimulateLatency: (v: boolean) => void;
  setSimulateErrors: (v: boolean) => void;
  setHasHydrated: (v: boolean) => void;

  // Persona
  setCurrentUser: (user: CurrentUser | null) => void;
  switchPersona: (user: CurrentUser) => void;

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
  addChannel: (channel: Channel) => void;
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  getAnnouncementsByChannel: (channelId: string) => Announcement[];
  getAnnouncementsByClass: (classId: string) => Announcement[];
  addThreadReply: (announcementId: string, reply: { id: string; authorName: string; authorId?: string; authorRole?: "teacher" | "student"; body: string; createdAt: string }) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Calendar
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Unit Plans
  addUnitPlan: (unit: UnitPlan) => void;
  updateUnitPlan: (id: string, updates: Partial<UnitPlan>) => void;
  deleteUnitPlan: (id: string) => void;
  getUnitPlansByClassId: (classId: string) => UnitPlan[];

  // Lesson Plans
  addLessonPlan: (lesson: LessonPlan) => void;
  updateLessonPlan: (id: string, updates: Partial<LessonPlan>) => void;
  deleteLessonPlan: (id: string) => void;
  getLessonPlansByUnitId: (unitId: string) => LessonPlan[];

  // Lesson Slot Assignments
  assignLessonToSlot: (assignment: LessonSlotAssignment) => void;
  unassignLessonFromSlot: (lessonPlanId: string) => void;
  getAssignmentsByUnitId: (unitId: string) => LessonSlotAssignment[];
  getAssignmentBySlot: (classId: string, date: string, slotStartTime: string) => LessonSlotAssignment | undefined;
  autoFillLessonSequence: (unitId: string) => number;

  // Assessment ↔ Unit linking
  linkAssessmentToUnit: (assessmentId: string, unitId: string) => void;
  unlinkAssessmentFromUnit: (assessmentId: string) => void;

  // Submissions
  addSubmission: (submission: Submission) => void;
  updateSubmission: (id: string, updates: Partial<Submission>) => void;
  getSubmissionsByAssessment: (assessmentId: string) => Submission[];
  getSubmissionsByStudent: (studentId: string) => Submission[];

  // Student Goals
  addStudentGoal: (goal: StudentGoal) => void;
  updateStudentGoal: (id: string, updates: Partial<StudentGoal>) => void;
  deleteStudentGoal: (id: string) => void;
  getStudentGoalsByStudent: (studentId: string) => StudentGoal[];

  // Goal Evidence Links
  addGoalEvidenceLink: (link: GoalEvidenceLink) => void;
  updateGoalEvidenceLink: (id: string, updates: Partial<GoalEvidenceLink>) => void;
  deleteGoalEvidenceLink: (id: string) => void;
  getGoalEvidenceLinksByGoal: (goalId: string) => GoalEvidenceLink[];
  getGoalEvidenceLinksBySource: (sourceType: GoalEvidenceLink["sourceType"], sourceId: string) => GoalEvidenceLink[];

  // Student Notifications
  addStudentNotification: (notification: StudentNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (studentId: string) => void;
  getNotificationsByStudent: (studentId: string) => StudentNotification[];

  // Parent / Family Portal
  updateParentProfile: (id: string, updates: Partial<ParentProfile>) => void;
  addFamilyMessage: (message: FamilyMessage) => void;
  markFamilyThreadRead: (threadId: string, parentId: string) => void;
  toggleFamilyThreadMute: (threadId: string, parentId: string) => void;
  markFamilyAnnouncementRead: (id: string, parentId: string) => void;
  markAllFamilyAnnouncementsRead: (parentId: string) => void;
  markFamilyNotificationRead: (id: string) => void;
  markAllFamilyNotificationsRead: (parentId: string) => void;

  // Assessment Lifecycle
  publishAssessment: (id: string) => void;
  closeAssessment: (id: string, force?: boolean) => void;
  reopenAssessment: (id: string) => void;

  // Grade Amendments
  amendGrade: (gradeId: string, updates: Partial<GradeRecord>) => void;

  // Reset
  resetAllData: (data: Omit<AppState, 'ui'>) => void;
}

export type AppStore = AppState & AppActions;
