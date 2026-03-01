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
  { label: "Classes", href: "/classes", icon: Users },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Gradebook", href: "/gradebook", icon: BookOpen },
  { label: "Portfolio", href: "/portfolio", icon: FolderOpen },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Communication", href: "/communication", icon: MessageSquare },
  { label: "Operations", href: "/operations/attendance", icon: CalendarDays },
  { label: "Student Support", href: "/support", icon: Shield },
] as const;

export const OPERATIONS_TABS = [
  { label: "Attendance", href: "/operations/attendance" },
  { label: "Calendar", href: "/operations/calendar" },
  { label: "Timetable", href: "/operations/timetable" },
  { label: "Compliance", href: "/operations/compliance" },
] as const;

export const TERMS = ["Term 1", "Term 2", "Full Year"] as const;

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
