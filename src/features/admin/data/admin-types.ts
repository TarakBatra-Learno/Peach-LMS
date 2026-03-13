export type AdminTone = "neutral" | "success" | "warning" | "danger" | "info" | "peach";

export type AdminProgramme = "All" | "PYP" | "MYP" | "DP";

export interface AdminSchoolProfile {
  name: string;
  campus: string;
  academicYear: string;
  termLabel: string;
  dataFreshness: string;
  leadershipPersona: string;
  customDomain: string;
}

export interface AdminKpi {
  id: string;
  label: string;
  value: string;
  detail: string;
  delta: string;
  tone: AdminTone;
}

export interface AdminProgrammeSummary {
  programme: Exclude<AdminProgramme, "All">;
  students: number;
  classes: number;
  staff: number;
  attendance: string;
  curriculumCompletion: string;
  headline: string;
  focus: string;
  tone: AdminTone;
}

export interface AdminHeroCard {
  id: string;
  title: string;
  eyebrow: string;
  takeaway: string;
  details: string[];
  tone: AdminTone;
}

export interface AdminAlert {
  id: string;
  title: string;
  category: string;
  owner: string;
  dueLabel: string;
  body: string;
  tone: AdminTone;
  module: string;
}

export interface AdminActivityItem {
  id: string;
  title: string;
  actor: string;
  module: string;
  time: string;
  detail: string;
}

export interface AdminException {
  id: string;
  title: string;
  module: string;
  owner: string;
  status: string;
  nextStep: string;
  tone: AdminTone;
}

export interface AdminCurriculumTeam {
  id: string;
  programme: Exclude<AdminProgramme, "All">;
  gradeBand: string;
  subject: string;
  lead: string;
  planningCompletion: number;
  unitCoverage: number;
  assessmentAlignment: number;
  atlCoverage: number;
  criteriaCoverage: number;
  recentUpdate: string;
  status: string;
  tone: AdminTone;
  classes: string[];
  priority: string;
  teacherPreview: {
    className: string;
    unitTitle: string;
    nextReview: string;
    note: string;
  };
}

export interface AdminCurriculumGap {
  id: string;
  framework: string;
  programme: Exclude<AdminProgramme, "All">;
  coverage: number;
  target: number;
  note: string;
  tone: AdminTone;
}

export interface AdminCrossClassRecord {
  id: string;
  programme: Exclude<AdminProgramme, "All">;
  subject: string;
  className: string;
  mappedUnits: number;
  sharedAssessments: number;
  pacing: string;
  atlCoverage: number;
  criteriaCoverage: number;
  risk: string;
  tone: AdminTone;
}

export interface AdminTemplateRecord {
  id: string;
  name: string;
  programme: Exclude<AdminProgramme, "All">;
  scope: string;
  owner: string;
  adoptionRate: number;
  status: string;
  lastUpdated: string;
  description: string;
  sections: string[];
  usedBy: string[];
  tone: AdminTone;
}

export interface AdminStudentAnalyticsRecord {
  id: string;
  name: string;
  programme: Exclude<AdminProgramme, "All">;
  gradeBand: string;
  homeroom: string;
  attendance: number;
  mastery: number;
  latestAssessment: string;
  latestReportStatus: string;
  gradingVisibility: string;
  communicationFlag: string;
  risk: string;
  tone: AdminTone;
  summary: string;
  parentPreview: string;
  studentPreview: string;
  supportNote: string;
}

export interface AdminMasteryRow {
  id: string;
  programme: Exclude<AdminProgramme, "All">;
  framework: string;
  strand: string;
  mastery: number;
  onTrack: number;
  watch: number;
  intervention: number;
  tone: AdminTone;
}

export interface AdminReportOversightRecord {
  id: string;
  cycle: string;
  programme: Exclude<AdminProgramme, "All">;
  dueDate: string;
  readyPercent: number;
  distributedPercent: number;
  atRisk: string;
  owner: string;
  status: string;
  tone: AdminTone;
}

export interface AdminGradebookOversightRecord {
  id: string;
  className: string;
  programme: Exclude<AdminProgramme, "All">;
  teacher: string;
  completion: number;
  unreleased: number;
  missing: number;
  turnaround: string;
  nextMilestone: string;
  status: string;
  tone: AdminTone;
}

export interface AdminCommunicationMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: AdminTone;
}

export interface AdminLanguageEngagement {
  id: string;
  language: string;
  families: number;
  openRate: number;
  responseRate: number;
  tone: AdminTone;
}

export interface AdminModerationItem {
  id: string;
  subject: string;
  channel: string;
  family: string;
  programme: Exclude<AdminProgramme, "All">;
  flagReason: string;
  confidentiality: string;
  owner: string;
  status: string;
  timestamp: string;
  preview: string;
  tone: AdminTone;
}

export interface AdminAnnouncementRecord {
  id: string;
  title: string;
  audience: string;
  programme: Exclude<AdminProgramme, "All"> | "Whole School";
  status: string;
  scheduledFor: string;
  sentBy: string;
  engagement: string;
  summary: string;
  previewTitle: string;
  previewBody: string;
  tone: AdminTone;
}

export interface AdminPrivacyControl {
  id: string;
  name: string;
  scope: string;
  retention: string;
  access: string;
  status: string;
  note: string;
  tone: AdminTone;
}

export interface AdminAuditLogRecord {
  id: string;
  action: string;
  actor: string;
  module: string;
  timestamp: string;
  note: string;
}

export interface AdminAttendanceRecord {
  id: string;
  gradeBand: string;
  programme: Exclude<AdminProgramme, "All">;
  completion: number;
  unresolved: number;
  chronicAbsence: number;
  latePattern: number;
  owner: string;
  status: string;
  tone: AdminTone;
}

export interface AdminTimetableIssue {
  id: string;
  type: string;
  className: string;
  programme: Exclude<AdminProgramme, "All">;
  severity: string;
  owner: string;
  dueLabel: string;
  summary: string;
  tone: AdminTone;
}

export interface AdminCalendarMoment {
  id: string;
  title: string;
  category: string;
  date: string;
  audience: string;
  status: string;
  note: string;
  tone: AdminTone;
}

export interface AdminDomainRecord {
  id: string;
  domain: string;
  status: string;
  ssl: string;
  dns: string;
  lastChecked: string;
  tone: AdminTone;
}

export interface AdminBrandPreview {
  id: string;
  persona: string;
  heading: string;
  subheading: string;
  accentLabel: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  role: string;
  programmeAccess: string;
  group: string;
  status: string;
  lastActive: string;
  email: string;
  tone: AdminTone;
  linkedClassIds?: string[];
}

export interface AdminPermissionGroup {
  id: string;
  name: string;
  summary: string;
  members: number;
  surfaces: string[];
  tone: AdminTone;
}

export interface AdminSsoProvider {
  id: string;
  provider: string;
  domains: string;
  status: string;
  loginPolicy: string;
  lastSync: string;
  tone: AdminTone;
}

export interface AdminRosterSync {
  id: string;
  source: string;
  scope: string;
  status: string;
  exceptions: number;
  lastRun: string;
  nextRun: string;
  tone: AdminTone;
}

export interface AdminIntegrationRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  owner: string;
  dataFlow: string;
  note: string;
  tone: AdminTone;
}

export interface AdminMigrationJob {
  id: string;
  name: string;
  source: string;
  status: string;
  records: string;
  lastRun: string;
  nextStep: string;
  tone: AdminTone;
}

export interface AdminExportJob {
  id: string;
  name: string;
  format: string;
  status: string;
  requestedBy: string;
  generatedAt: string;
  tone: AdminTone;
}

export interface AdminApiKeyRecord {
  id: string;
  label: string;
  scopes: string[];
  status: string;
  lastUsed: string;
  maskedKey: string;
  tone: AdminTone;
}

export interface AdminWebhookRecord {
  id: string;
  label: string;
  event: string;
  destination: string;
  status: string;
  lastDelivery: string;
  tone: AdminTone;
}

export interface AdminPlanEntitlement {
  id: string;
  module: string;
  status: string;
  seatsUsed: number;
  seatsTotal?: number;
  note: string;
  tone: AdminTone;
}

export interface AdminDemoData {
  school: AdminSchoolProfile;
  overview: {
    kpis: AdminKpi[];
    programmes: AdminProgrammeSummary[];
    heroCards: AdminHeroCard[];
    alerts: AdminAlert[];
    activity: AdminActivityItem[];
    exceptions: AdminException[];
  };
  curriculum: {
    teams: AdminCurriculumTeam[];
    gaps: AdminCurriculumGap[];
    crossClass: AdminCrossClassRecord[];
    templates: AdminTemplateRecord[];
  };
  performance: {
    schoolMetrics: AdminKpi[];
    comparisonTrend: Array<{ term: string; PYP: number; MYP: number; DP: number }>;
    students: AdminStudentAnalyticsRecord[];
    mastery: AdminMasteryRow[];
    reports: AdminReportOversightRecord[];
    gradebooks: AdminGradebookOversightRecord[];
  };
  communications: {
    metrics: AdminCommunicationMetric[];
    languageEngagement: AdminLanguageEngagement[];
    moderationQueue: AdminModerationItem[];
    announcements: AdminAnnouncementRecord[];
    privacyControls: AdminPrivacyControl[];
    auditLog: AdminAuditLogRecord[];
  };
  operations: {
    attendance: AdminAttendanceRecord[];
    timetableIssues: AdminTimetableIssue[];
    calendarMoments: AdminCalendarMoment[];
    domains: AdminDomainRecord[];
    brandingPreviews: AdminBrandPreview[];
  };
  platform: {
    users: AdminUserRecord[];
    permissionGroups: AdminPermissionGroup[];
    ssoProviders: AdminSsoProvider[];
    rosteringSyncs: AdminRosterSync[];
    integrations: AdminIntegrationRecord[];
    migrationJobs: AdminMigrationJob[];
    exports: AdminExportJob[];
    apiKeys: AdminApiKeyRecord[];
    webhooks: AdminWebhookRecord[];
    entitlements: AdminPlanEntitlement[];
  };
}
