import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  FolderOpen,
  FileText,
  MessageSquare,
  CalendarDays,
  Shield,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Planning", href: "/planning", icon: BookOpen },
  { label: "Classes", href: "/classes", icon: Users },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Portfolio", href: "/portfolio", icon: FolderOpen },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Communication", href: "/communication", icon: MessageSquare },
  { label: "Operations", href: "/operations/timetable", icon: CalendarDays },
  { label: "Student Support", href: "/support", icon: Shield },
] as const;

export const OPERATIONS_TABS = [
  { label: "Timetable", href: "/operations/timetable" },
  { label: "Calendar", href: "/operations/calendar" },
  { label: "Attendance", href: "/operations/attendance" },
  { label: "Compliance", href: "/operations/compliance" },
] as const;

export const ACADEMIC_YEARS = [
  { value: "2025/26", label: "2025/26" },
] as const;

export const TEACHER = {
  name: "Ms. Sarah Mitchell",
  email: "s.mitchell@peachschool.edu",
  role: "Teacher",
  avatarInitials: "SM",
} as const;

export const MASTERY_LEVELS = [
  { value: "exceeding", label: "Exceeding", color: "text-success" },
  { value: "meeting", label: "Meeting", color: "text-info" },
  { value: "approaching", label: "Approaching", color: "text-warning" },
  { value: "beginning", label: "Beginning", color: "text-danger" },
  { value: "not_assessed", label: "Not assessed", color: "text-text-subtle" },
] as const;

export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present", color: "bg-success-soft text-success" },
  { value: "absent", label: "Absent", color: "bg-danger-soft text-danger" },
  { value: "late", label: "Late", color: "bg-warning-soft text-warning" },
  { value: "excused", label: "Excused", color: "bg-info-soft text-info" },
] as const;

export const INCIDENT_SEVERITIES = [
  { value: "low", label: "Low", color: "bg-info-soft text-info" },
  { value: "medium", label: "Medium", color: "bg-warning-soft text-warning" },
  { value: "high", label: "High", color: "bg-danger-soft text-danger" },
] as const;

export const REPORT_STATES = [
  { value: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { value: "ready", label: "Ready", color: "bg-info-soft text-info" },
  { value: "published", label: "Published", color: "bg-success-soft text-success" },
  { value: "distributed", label: "Distributed", color: "bg-peach-50 text-peach-700" },
] as const;

export const MYP_CRITERIA = ["A", "B", "C", "D"] as const;
export const MYP_MAX_LEVEL = 8;
export const DP_MAX_GRADE = 7;

// Rubric templates for assessment creation
import type { SimpleCriterion, RubricCriterion } from "@/types/assessment";

export interface RubricTemplate {
  id: string;
  label: string;
  description: string;
  rubricCriteria: SimpleCriterion[];
  rubric: RubricCriterion[];
}

export const RUBRIC_TEMPLATES: RubricTemplate[] = [
  {
    id: "presentation",
    label: "Presentation Rubric",
    description: "Presentation quality and content depth",
    rubricCriteria: [
      { id: "rc_pres_1", name: "Presentation Quality", description: "Clarity, organization, and delivery", maxScore: 4 },
      { id: "rc_pres_2", name: "Content Depth", description: "Analysis, insight, and understanding", maxScore: 4 },
    ],
    rubric: [
      {
        id: "rub_pres_1", title: "Presentation Quality", weight: 50,
        levels: [
          { id: "rub_pres_1_l1", label: "Emerging", points: 1, description: "Presentation lacks structure" },
          { id: "rub_pres_1_l2", label: "Developing", points: 2, description: "Some structure present" },
          { id: "rub_pres_1_l3", label: "Proficient", points: 3, description: "Clear and organized" },
          { id: "rub_pres_1_l4", label: "Exemplary", points: 4, description: "Exceptionally polished" },
        ],
      },
      {
        id: "rub_pres_2", title: "Content Depth", weight: 50,
        levels: [
          { id: "rub_pres_2_l1", label: "Emerging", points: 1, description: "Surface-level understanding" },
          { id: "rub_pres_2_l2", label: "Developing", points: 2, description: "Some depth shown" },
          { id: "rub_pres_2_l3", label: "Proficient", points: 3, description: "Good analysis" },
          { id: "rub_pres_2_l4", label: "Exemplary", points: 4, description: "Outstanding insight" },
        ],
      },
    ],
  },
  {
    id: "written_work",
    label: "Written Work Rubric",
    description: "Thesis, evidence, and writing quality",
    rubricCriteria: [
      { id: "rc_writ_1", name: "Thesis & Argument", description: "Clarity and strength of central argument", maxScore: 4 },
      { id: "rc_writ_2", name: "Evidence & Support", description: "Use of relevant evidence and examples", maxScore: 4 },
      { id: "rc_writ_3", name: "Writing Quality", description: "Grammar, style, and structure", maxScore: 4 },
    ],
    rubric: [
      {
        id: "rub_writ_1", title: "Thesis & Argument", weight: 40,
        levels: [
          { id: "rub_writ_1_l1", label: "Emerging", points: 1, description: "No clear thesis" },
          { id: "rub_writ_1_l2", label: "Developing", points: 2, description: "Thesis present but weak" },
          { id: "rub_writ_1_l3", label: "Proficient", points: 3, description: "Clear and supported thesis" },
          { id: "rub_writ_1_l4", label: "Exemplary", points: 4, description: "Compelling, nuanced argument" },
        ],
      },
      {
        id: "rub_writ_2", title: "Evidence & Support", weight: 35,
        levels: [
          { id: "rub_writ_2_l1", label: "Emerging", points: 1, description: "Little or no evidence" },
          { id: "rub_writ_2_l2", label: "Developing", points: 2, description: "Some relevant evidence" },
          { id: "rub_writ_2_l3", label: "Proficient", points: 3, description: "Strong evidence throughout" },
          { id: "rub_writ_2_l4", label: "Exemplary", points: 4, description: "Exceptional use of evidence" },
        ],
      },
      {
        id: "rub_writ_3", title: "Writing Quality", weight: 25,
        levels: [
          { id: "rub_writ_3_l1", label: "Emerging", points: 1, description: "Frequent errors, unclear" },
          { id: "rub_writ_3_l2", label: "Developing", points: 2, description: "Some errors, mostly clear" },
          { id: "rub_writ_3_l3", label: "Proficient", points: 3, description: "Well-written, few errors" },
          { id: "rub_writ_3_l4", label: "Exemplary", points: 4, description: "Polished and eloquent" },
        ],
      },
    ],
  },
  {
    id: "research",
    label: "Research Project Rubric",
    description: "Research, analysis, presentation, and reflection",
    rubricCriteria: [
      { id: "rc_res_1", name: "Research Process", description: "Source quality and breadth of research", maxScore: 4 },
      { id: "rc_res_2", name: "Analysis", description: "Critical thinking and synthesis", maxScore: 4 },
      { id: "rc_res_3", name: "Presentation", description: "Format, clarity, and organization", maxScore: 4 },
      { id: "rc_res_4", name: "Reflection", description: "Self-assessment and metacognition", maxScore: 4 },
    ],
    rubric: [
      {
        id: "rub_res_1", title: "Research Process", weight: 30,
        levels: [
          { id: "rub_res_1_l1", label: "Emerging", points: 1, description: "Limited sources, poor quality" },
          { id: "rub_res_1_l2", label: "Developing", points: 2, description: "Some credible sources" },
          { id: "rub_res_1_l3", label: "Proficient", points: 3, description: "Varied, credible sources" },
          { id: "rub_res_1_l4", label: "Exemplary", points: 4, description: "Extensive, authoritative sources" },
        ],
      },
      {
        id: "rub_res_2", title: "Analysis", weight: 30,
        levels: [
          { id: "rub_res_2_l1", label: "Emerging", points: 1, description: "Descriptive only" },
          { id: "rub_res_2_l2", label: "Developing", points: 2, description: "Some analysis present" },
          { id: "rub_res_2_l3", label: "Proficient", points: 3, description: "Strong critical analysis" },
          { id: "rub_res_2_l4", label: "Exemplary", points: 4, description: "Insightful synthesis" },
        ],
      },
      {
        id: "rub_res_3", title: "Presentation", weight: 25,
        levels: [
          { id: "rub_res_3_l1", label: "Emerging", points: 1, description: "Disorganized and unclear" },
          { id: "rub_res_3_l2", label: "Developing", points: 2, description: "Basic organization" },
          { id: "rub_res_3_l3", label: "Proficient", points: 3, description: "Well-organized and clear" },
          { id: "rub_res_3_l4", label: "Exemplary", points: 4, description: "Professional presentation" },
        ],
      },
      {
        id: "rub_res_4", title: "Reflection", weight: 15,
        levels: [
          { id: "rub_res_4_l1", label: "Emerging", points: 1, description: "Minimal self-reflection" },
          { id: "rub_res_4_l2", label: "Developing", points: 2, description: "Some self-awareness" },
          { id: "rub_res_4_l3", label: "Proficient", points: 3, description: "Thoughtful reflection" },
          { id: "rub_res_4_l4", label: "Exemplary", points: 4, description: "Deep metacognitive insight" },
        ],
      },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    description: "Configure rubric criteria after creation",
    rubricCriteria: [],
    rubric: [],
  },
];
