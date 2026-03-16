"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import {
  AdminDetailDrawer,
  AdminMiniStat,
  AdminPanel,
  AdminPortalPreview,
  AdminRowLink,
  AdminToneBadge,
  AdminUtilityBar,
} from "@/features/admin/components/admin-ui";

const ATTENDANCE_SUMMARY = [
  { label: "Marked", value: "98%", helper: "Registration completion across active programmes", tone: "success" as const },
  { label: "Present", value: "687", helper: "Students recorded present in the current school day", tone: "info" as const },
  { label: "Excused", value: "14", helper: "Absences already classified and family-notified", tone: "neutral" as const },
  { label: "Absent", value: "23", helper: "Students absent and still visible in daily ops review", tone: "warning" as const },
  { label: "Tardy", value: "17", helper: "Repeat late arrivals that may trigger compliance checks", tone: "danger" as const },
] as const;

const ATTENDANCE_DAILY_ROWS = [
  { id: "daily-1", className: "MYP 5 Sciences", programme: "MYP", teacher: "Ms. Sarah Mitchell", present: 21, absent: 2, tardy: 1, markedAt: "08:26", status: "Marked", tone: "success" as const },
  { id: "daily-2", className: "MYP 5 Homeroom 10A", programme: "MYP", teacher: "Mr. Daniel Ross", present: 22, absent: 1, tardy: 2, markedAt: "08:31", status: "Follow-up needed", tone: "warning" as const },
  { id: "daily-3", className: "DP Advisory 12A", programme: "DP", teacher: "Ms. Priya Iyer", present: 17, absent: 2, tardy: 1, markedAt: "08:18", status: "Marked", tone: "success" as const },
  { id: "daily-4", className: "PYP 4 Indigo", programme: "PYP", teacher: "Ms. Hannah Brooks", present: 18, absent: 0, tardy: 0, markedAt: "08:12", status: "Marked", tone: "success" as const },
  { id: "daily-5", className: "DP Biology HL", programme: "DP", teacher: "Mr. Omar Haddad", present: 11, absent: 1, tardy: 0, markedAt: "09:07", status: "Late entry", tone: "info" as const },
] as const;

const COMPLIANCE_ROWS = [
  { id: "compliance-1", student: "Aarav Patel", programme: "MYP", className: "MYP 5 Homeroom 10A", attendance: 91, streak: "3 absences in 10 days", absences: 7, risk: "Review", threshold: "Below 92%", owner: "Student support lead", tone: "warning" as const, note: "Watch attendance alongside unreleased science grading." },
  { id: "compliance-2", student: "Yusuf Rahman", programme: "DP", className: "DP Advisory 12A", attendance: 88, streak: "2 late arrivals this week", absences: 9, risk: "Escalate", threshold: "Below 90%", owner: "Dean of students", tone: "danger" as const, note: "Requires adviser call and attendance plan review." },
  { id: "compliance-3", student: "Liam Chen", programme: "PYP", className: "PYP 4 Indigo", attendance: 94, streak: "Monitoring only", absences: 4, risk: "Watch", threshold: "Near 95%", owner: "Primary office", tone: "info" as const, note: "No immediate action, but continue family check-ins." },
  { id: "compliance-4", student: "Mila Thompson", programme: "MYP", className: "MYP 4 Homeroom 9B", attendance: 84, streak: "5 absences in 15 days", absences: 11, risk: "Escalate", threshold: "Below 85%", owner: "Attendance officer", tone: "danger" as const, note: "Automatic compliance review scheduled tomorrow morning." },
] as const;

const ATTENDANCE_SETUP = [
  { id: "setup-1", label: "Attendance codes", status: "Healthy", note: "Present, absent, excused, medical, and late codes are aligned across programmes.", tone: "success" as const },
  { id: "setup-2", label: "Family escalation windows", status: "Needs review", note: "DP advisory follow-up threshold is using last term's reminder wording.", tone: "warning" as const },
  { id: "setup-3", label: "Daily register prompts", status: "Published", note: "Teacher shell shows registration prompts on the current demo day.", tone: "info" as const },
] as const;

const TIMETABLE_SECTIONS = [
  { id: "setup", label: "Setup checklist" },
  { id: "periods", label: "Periods" },
  { id: "bells", label: "Bell schedules" },
  { id: "routines", label: "Routines" },
  { id: "schedule", label: "Schedule calendar" },
  { id: "class", label: "Class view" },
  { id: "student", label: "Student view" },
  { id: "teacher", label: "Teacher view" },
  { id: "history", label: "Import history" },
] as const;

const TIMETABLE_SETUP = [
  { id: "tt-setup-1", label: "Periods configured", status: "Complete", note: "Eight instructional periods plus advisory, break, and lunch are locked for the year.", tone: "success" as const },
  { id: "tt-setup-2", label: "Bell schedules reviewed", status: "Needs review", note: "Friday advisory bell schedule still needs final sign-off from DP and operations.", tone: "warning" as const },
  { id: "tt-setup-3", label: "Routine cycle published", status: "Complete", note: "A/B cycle visible in teacher, student, and family portals.", tone: "success" as const },
  { id: "tt-setup-4", label: "Import exceptions cleared", status: "Pilot", note: "Latest timetable import left two room mismatches for lab blocks.", tone: "info" as const },
] as const;

const PERIOD_ROWS = [
  { id: "period-1", label: "Advisory", type: "Pastoral", time: "08:00 - 08:20", days: "Mon - Fri" },
  { id: "period-2", label: "Period 1", type: "Instructional", time: "08:25 - 09:15", days: "Mon - Fri" },
  { id: "period-3", label: "Period 2", type: "Instructional", time: "09:20 - 10:10", days: "Mon - Fri" },
  { id: "period-4", label: "Break", type: "Break", time: "10:10 - 10:30", days: "Mon - Fri" },
  { id: "period-5", label: "Period 3", type: "Instructional", time: "10:30 - 11:20", days: "Mon - Fri" },
  { id: "period-6", label: "Period 4", type: "Instructional", time: "11:25 - 12:15", days: "Mon - Fri" },
  { id: "period-7", label: "Lunch", type: "Break", time: "12:15 - 13:00", days: "Mon - Fri" },
] as const;

const BELL_SCHEDULES = [
  { id: "bell-1", name: "Standard day", scope: "Whole school", periods: 8, status: "Active", tone: "success" as const },
  { id: "bell-2", name: "Friday advisory", scope: "MYP and DP", periods: 7, status: "Draft", tone: "warning" as const },
  { id: "bell-3", name: "PYP showcase half-day", scope: "PYP", periods: 5, status: "Ready", tone: "info" as const },
] as const;

const ROUTINES = [
  { id: "routine-1", label: "A/B academic rotation", appliesTo: "MYP and DP", pattern: "A, B, A, B, Homeroom", status: "Published", tone: "success" as const },
  { id: "routine-2", label: "PYP specialist cycle", appliesTo: "PYP", pattern: "Homeroom, specialist, inquiry block", status: "Healthy", tone: "info" as const },
  { id: "routine-3", label: "Assessment week routine", appliesTo: "MYP 5 and DP 2", pattern: "Reduced advisory, extended assessment blocks", status: "Ready", tone: "warning" as const },
] as const;

const TIMETABLE_IMPORTS = [
  { id: "import-1", source: "Master timetable CSV", actor: "Jordan Lee", timestamp: "Today, 06:10", status: "Imported with 2 warnings", tone: "warning" as const },
  { id: "import-2", source: "Friday bell schedule", actor: "Mina Patel", timestamp: "Yesterday, 15:42", status: "Validated", tone: "success" as const },
  { id: "import-3", source: "DP advisory room changes", actor: "Operations assistant", timestamp: "Yesterday, 08:05", status: "Published", tone: "info" as const },
] as const;

const TIMETABLE_VIEWS = {
  class: {
    options: ["MYP 5 Sciences", "DP Biology HL", "PYP 4 Indigo"],
    rows: [
      { period: "Advisory", mon: "Homeroom", tue: "Homeroom", wed: "Assembly", thu: "Homeroom", fri: "Service briefing" },
      { period: "Period 1", mon: "Lab 3 · Forces", tue: "Lab 3 · Practical", wed: "Lab 3 · Theory", thu: "Lab 2 · Group work", fri: "Lab 3 · Quiz" },
      { period: "Period 2", mon: "Humanities", tue: "Math", wed: "Language A", thu: "Math", fri: "PE" },
      { period: "Period 3", mon: "English A", tue: "Design", wed: "Sciences", thu: "Individuals & societies", fri: "Sciences" },
    ],
  },
  student: {
    options: ["Aarav Patel", "Mei Chen", "Yusuf Rahman"],
    rows: [
      { period: "Advisory", mon: "Advisory", tue: "Advisory", wed: "Assembly", thu: "Advisory", fri: "Advisory" },
      { period: "Period 1", mon: "Sciences", tue: "Sciences", wed: "Math", thu: "Math", fri: "Sciences" },
      { period: "Period 2", mon: "Individuals & societies", tue: "Math", wed: "English A", thu: "Design", fri: "PE" },
      { period: "Period 3", mon: "Language acquisition", tue: "Arts", wed: "Sciences", thu: "Individuals & societies", fri: "Sciences" },
    ],
  },
  teacher: {
    options: ["Ms. Sarah Mitchell", "Ms. Priya Iyer", "Mr. Daniel Ross"],
    rows: [
      { period: "Advisory", mon: "MYP 5 Homeroom", tue: "MYP 5 Homeroom", wed: "Pastoral check-in", thu: "MYP 5 Homeroom", fri: "MYP 5 Homeroom" },
      { period: "Period 1", mon: "MYP 5 Sciences", tue: "MYP 4 Sciences", wed: "MYP 5 Sciences", thu: "Planning block", fri: "MYP 5 Sciences" },
      { period: "Period 2", mon: "Lab prep", tue: "Assessment moderation", wed: "MYP 4 Sciences", thu: "MYP 5 Sciences", fri: "Office hour" },
      { period: "Period 3", mon: "Shared planning", tue: "MYP 5 Sciences", wed: "Parent conference", thu: "MYP 4 Sciences", fri: "MYP 5 Sciences" },
    ],
  },
} as const;

const SCHEDULE_CALENDAR = [
  [
    { day: "", label: "", items: [] },
    { day: "", label: "", items: [] },
    { day: "1", label: "Mon", items: ["A cycle", "Staff briefing"] },
    { day: "2", label: "Tue", items: ["B cycle"] },
    { day: "3", label: "Wed", items: ["PYP showcase prep"] },
    { day: "4", label: "Thu", items: ["Report moderation"] },
    { day: "5", label: "Fri", items: ["Friday advisory"] },
  ],
  [
    { day: "8", label: "Mon", items: ["A cycle"] },
    { day: "9", label: "Tue", items: ["B cycle", "Room swap DP Bio"] },
    { day: "10", label: "Wed", items: ["Assessment week prep"] },
    { day: "11", label: "Thu", items: ["Parent conference blocks"] },
    { day: "12", label: "Fri", items: ["PYP half day"] },
    { day: "13", label: "Sat", items: [] },
    { day: "14", label: "Sun", items: [] },
  ],
] as const;

const CALENDAR_EVENT_TYPES = ["Academic", "School event", "Family event", "Operations"] as const;

const CALENDAR_EVENTS = [
  { id: "event-1", title: "MYP report moderation", type: "Academic", className: "MYP 5 Sciences", audience: "Teachers", participants: 8, view: "agenda", date: "Wed 18 Mar · 15:15", tone: "warning" as const },
  { id: "event-2", title: "PYP exhibition showcase", type: "School event", className: "PYP", audience: "Families", participants: 220, view: "agenda", date: "Thu 19 Mar · 13:30", tone: "success" as const },
  { id: "event-3", title: "DP family university evening", type: "Family event", className: "DP", audience: "Families", participants: 140, view: "week", date: "Thu 19 Mar · 18:00", tone: "info" as const },
  { id: "event-4", title: "Attendance compliance review", type: "Operations", className: "Whole school", audience: "Leadership", participants: 6, view: "month", date: "Fri 20 Mar · 08:15", tone: "danger" as const },
  { id: "event-5", title: "DP internal assessment clinic", type: "Academic", className: "DP Biology HL", audience: "Students", participants: 24, view: "week", date: "Fri 20 Mar · 12:45", tone: "peach" as const },
] as const;

type DetailState =
  | { kind: "attendance"; id: string }
  | { kind: "compliance"; id: string }
  | { kind: "domain"; id: string }
  | { kind: "issue"; id: string }
  | { kind: "event"; id: string }
  | null;

type TimetableSection = (typeof TIMETABLE_SECTIONS)[number]["id"];
type CalendarView = "agenda" | "week" | "month";

function WeeklyTimetableGrid({
  rows,
}: {
  rows: ReadonlyArray<{ period: string; mon: string; tue: string; wed: string; thu: string; fri: string }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead>Mon</TableHead>
          <TableHead>Tue</TableHead>
          <TableHead>Wed</TableHead>
          <TableHead>Thu</TableHead>
          <TableHead>Fri</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.period}>
            <TableCell className="font-medium text-foreground">{row.period}</TableCell>
            <TableCell>{row.mon}</TableCell>
            <TableCell>{row.tue}</TableCell>
            <TableCell>{row.wed}</TableCell>
            <TableCell>{row.thu}</TableCell>
            <TableCell>{row.fri}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminOperationsPage() {
  const [attendanceView, setAttendanceView] = useState<"daily" | "students">("daily");
  const [attendanceProgramme, setAttendanceProgramme] = useState("all");
  const [attendanceClass, setAttendanceClass] = useState("all");
  const [complianceProgramme, setComplianceProgramme] = useState("all");
  const [complianceQuery, setComplianceQuery] = useState("");
  const [timetableSection, setTimetableSection] = useState<TimetableSection>("setup");
  const [selectedTimetableOption, setSelectedTimetableOption] = useState({
    class: TIMETABLE_VIEWS.class.options[0],
    student: TIMETABLE_VIEWS.student.options[0],
    teacher: TIMETABLE_VIEWS.teacher.options[0],
  });
  const [calendarView, setCalendarView] = useState<CalendarView>("agenda");
  const [calendarQuery, setCalendarQuery] = useState("");
  const [calendarClass, setCalendarClass] = useState("all");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([...CALENDAR_EVENT_TYPES]);
  const [brandingDraft, setBrandingDraft] = useState({
    schoolName: adminDemoData.school.name,
    reportDisplayName: "Peach International School Reports",
    schoolCode: "PIS-IB-001",
    address: "125 Orchard Grove, Singapore 258903",
    phone: "+65 6123 4870",
    email: "hello@peachschool.edu",
  });
  const [detailState, setDetailState] = useState<DetailState>(null);

  const visibleDailyRows = useMemo(() => {
    return ATTENDANCE_DAILY_ROWS.filter((row) => {
      if (attendanceProgramme !== "all" && row.programme !== attendanceProgramme) return false;
      if (attendanceClass !== "all" && row.className !== attendanceClass) return false;
      return true;
    });
  }, [attendanceClass, attendanceProgramme]);

  const visibleStudentRows = useMemo(() => {
    return COMPLIANCE_ROWS.filter((row) => {
      if (attendanceProgramme !== "all" && row.programme !== attendanceProgramme) return false;
      if (attendanceClass !== "all" && row.className !== attendanceClass) return false;
      return true;
    });
  }, [attendanceClass, attendanceProgramme]);

  const visibleComplianceRows = useMemo(() => {
    const normalized = complianceQuery.trim().toLowerCase();
    return COMPLIANCE_ROWS.filter((row) => {
      if (complianceProgramme !== "all" && row.programme !== complianceProgramme) return false;
      if (!normalized) return true;
      return [row.student, row.className, row.owner, row.risk, row.streak]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [complianceProgramme, complianceQuery]);

  const filteredEvents = useMemo(() => {
    const normalized = calendarQuery.trim().toLowerCase();
    return CALENDAR_EVENTS.filter((event) => {
      if (calendarClass !== "all" && event.className !== calendarClass) return false;
      if (!selectedEventTypes.includes(event.type)) return false;
      if (event.view !== calendarView) return false;
      if (!normalized) return true;
      return [event.title, event.className, event.audience, event.date].join(" ").toLowerCase().includes(normalized);
    });
  }, [calendarClass, calendarQuery, calendarView, selectedEventTypes]);

  const selectedAttendance =
    detailState?.kind === "attendance"
      ? adminDemoData.operations.attendance.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedCompliance =
    detailState?.kind === "compliance"
      ? COMPLIANCE_ROWS.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedDomain =
    detailState?.kind === "domain"
      ? adminDemoData.operations.domains.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedIssue =
    detailState?.kind === "issue"
      ? adminDemoData.operations.timetableIssues.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedEvent =
    detailState?.kind === "event"
      ? CALENDAR_EVENTS.find((item) => item.id === detailState.id) ?? null
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations management"
        description="Attendance, compliance, timetable, calendar, and branding structured as a calm school operations console."
        primaryAction={{
          label: "Send ops digest",
          onClick: () => toast.success("Operations digest prepared for the demo"),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">Operational console</AdminToneBadge>
          <AdminToneBadge tone="info">Setup + oversight patterns</AdminToneBadge>
          <AdminToneBadge tone="warning">Read-only but credible</AdminToneBadge>
        </div>
      </PageHeader>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-[18px] border border-border/80 bg-[#fcfcfd] p-1">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
            {ATTENDANCE_SUMMARY.map((item) => (
              <AdminMiniStat
                key={item.label}
                label={item.label}
                value={item.value}
                helper={item.helper}
                tone={item.tone}
              />
            ))}
          </div>

          <AdminUtilityBar
            actions={
              <Button variant="outline" size="sm" onClick={() => toast.success("Attendance configuration opened in the demo")}>
                Open config
              </Button>
            }
          >
            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-white p-1">
              <Button variant="ghost" size="sm" className="h-8 px-3">Tue 17 Mar</Button>
              <Button variant="secondary" size="sm" className="h-8 px-3">Wed 18 Mar</Button>
              <Button variant="ghost" size="sm" className="h-8 px-3">Thu 19 Mar</Button>
            </div>
            <Select value={attendanceProgramme} onValueChange={setAttendanceProgramme}>
              <SelectTrigger className="h-9 w-[150px] bg-white text-[13px]">
                <SelectValue placeholder="Programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programmes</SelectItem>
                <SelectItem value="PYP">PYP</SelectItem>
                <SelectItem value="MYP">MYP</SelectItem>
                <SelectItem value="DP">DP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={attendanceClass} onValueChange={setAttendanceClass}>
              <SelectTrigger className="h-9 w-[220px] bg-white text-[13px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {Array.from(new Set(ATTENDANCE_DAILY_ROWS.map((row) => row.className))).map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={attendanceView} onValueChange={(value) => setAttendanceView(value as "daily" | "students")}>
              <TabsList className="bg-white">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>
            </Tabs>
          </AdminUtilityBar>

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <AdminPanel
              title="Attendance management"
              description="Daily operational view with a clear path into student follow-up and setup."
            >
              {attendanceView === "daily" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Tardy</TableHead>
                      <TableHead>Marked</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleDailyRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-medium text-foreground">{row.className}</p>
                            <p className="text-[12px] text-muted-foreground">{row.teacher}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.programme}</TableCell>
                        <TableCell>{row.present}</TableCell>
                        <TableCell>{row.absent}</TableCell>
                        <TableCell>{row.tardy}</TableCell>
                        <TableCell>{row.markedAt}</TableCell>
                        <TableCell>
                          <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleStudentRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-medium text-foreground">{row.student}</p>
                            <p className="text-[12px] text-muted-foreground">{row.className}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.programme}</TableCell>
                        <TableCell>{row.attendance}%</TableCell>
                        <TableCell>{row.streak}</TableCell>
                        <TableCell>
                          <AdminToneBadge tone={row.tone}>{row.risk}</AdminToneBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AdminRowLink label="Review" onClick={() => setDetailState({ kind: "compliance", id: row.id })} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AdminPanel>

            <div className="space-y-4">
              <AdminPanel title="Attendance setup" description="Checklist and setup signals rather than a full settings engine.">
                <div className="space-y-3">
                  {ATTENDANCE_SETUP.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-medium text-foreground">{item.label}</p>
                        <AdminToneBadge tone={item.tone}>{item.status}</AdminToneBadge>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.note}</p>
                    </div>
                  ))}
                </div>
              </AdminPanel>

              <AdminPanel title="Programme completion" description="Attendance completion at the office layer.">
                <div className="space-y-3">
                  {adminDemoData.operations.attendance.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setDetailState({ kind: "attendance", id: record.id })}
                      className="w-full rounded-2xl border border-border/80 bg-white px-4 py-3 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{record.programme}</p>
                          <p className="text-[12px] text-muted-foreground">{record.gradeBand} · {record.owner}</p>
                        </div>
                        <AdminToneBadge tone={record.tone}>{record.completion}% complete</AdminToneBadge>
                      </div>
                    </button>
                  ))}
                </div>
              </AdminPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            <AdminMiniStat label="Threshold" value="< 90%" helper="Default attendance review threshold for urgent follow-up" tone="danger" />
            <AdminMiniStat label="Flagged students" value={String(COMPLIANCE_ROWS.length)} helper="Visible in the current compliance review queue" tone="warning" />
            <AdminMiniStat label="Escalations" value="2" helper="Students requiring dean or support intervention" tone="danger" />
            <AdminMiniStat label="Watchlist" value="5" helper="Monitoring only, no immediate compliance action" tone="info" />
          </div>

          <AdminUtilityBar>
            <Select value={complianceProgramme} onValueChange={setComplianceProgramme}>
              <SelectTrigger className="h-9 w-[150px] bg-white text-[13px]">
                <SelectValue placeholder="Programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programmes</SelectItem>
                <SelectItem value="PYP">PYP</SelectItem>
                <SelectItem value="MYP">MYP</SelectItem>
                <SelectItem value="DP">DP</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={complianceQuery}
              onChange={(event) => setComplianceQuery(event.target.value)}
              placeholder="Search student, class, owner, or pattern"
              className="h-9 max-w-[320px] bg-white text-[13px]"
            />
          </AdminUtilityBar>

          <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
            <AdminPanel title="Attendance compliance" description="Threshold logic and flagged students presented as an operational review table.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Absences</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleComplianceRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-normal">
                        <div>
                          <p className="font-medium text-foreground">{row.student}</p>
                          <p className="text-[12px] text-muted-foreground">{row.className}</p>
                        </div>
                      </TableCell>
                      <TableCell>{row.programme}</TableCell>
                      <TableCell>{row.attendance}%</TableCell>
                      <TableCell>{row.absences}</TableCell>
                      <TableCell>{row.streak}</TableCell>
                      <TableCell>{row.threshold}</TableCell>
                      <TableCell>
                        <AdminToneBadge tone={row.tone}>{row.risk}</AdminToneBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Review" onClick={() => setDetailState({ kind: "compliance", id: row.id })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Threshold logic" description="Visible rules make the compliance view feel operational rather than decorative.">
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Urgent</p>
                  <p className="mt-2 text-[14px] font-medium text-foreground">Below 90% attendance or 5 absences in 15 days</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Review</p>
                  <p className="mt-2 text-[14px] font-medium text-foreground">Below 92% attendance or repeated late patterns</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Watch</p>
                  <p className="mt-2 text-[14px] font-medium text-foreground">Near threshold with a recent improvement trend</p>
                </div>
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[240px,1fr,320px]">
            <AdminPanel title="Timetable module" description="A deeper sub-portal shape, closer to Toddle's setup and config flow.">
              <div className="space-y-2">
                {TIMETABLE_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setTimetableSection(section.id)}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-left text-[13px] font-medium transition ${
                      timetableSection === section.id
                        ? "border-[#ffc1b7] bg-[#fff2f0] text-[#b9483a]"
                        : "border-border/80 bg-white text-muted-foreground hover:bg-[#fffaf9] hover:text-foreground"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel
              title={
                TIMETABLE_SECTIONS.find((section) => section.id === timetableSection)?.label ?? "Timetable"
              }
              description="Configuration, views, and history are separated so the module reads like a serious operations tool."
            >
              {timetableSection === "setup" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {TIMETABLE_SETUP.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-medium text-foreground">{item.label}</p>
                        <AdminToneBadge tone={item.tone}>{item.status}</AdminToneBadge>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.note}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {timetableSection === "periods" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERIOD_ROWS.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-foreground">{row.label}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.time}</TableCell>
                        <TableCell>{row.days}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}

              {timetableSection === "bells" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Periods</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BELL_SCHEDULES.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                        <TableCell>{row.scope}</TableCell>
                        <TableCell>{row.periods}</TableCell>
                        <TableCell>
                          <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}

              {timetableSection === "routines" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Routine</TableHead>
                      <TableHead>Applies to</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ROUTINES.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-foreground">{row.label}</TableCell>
                        <TableCell>{row.appliesTo}</TableCell>
                        <TableCell>{row.pattern}</TableCell>
                        <TableCell>
                          <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}

              {timetableSection === "schedule" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div key={day} className="rounded-xl border border-border/70 bg-[#fcfcfd] px-3 py-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {day}
                      </div>
                    ))}
                    {SCHEDULE_CALENDAR.flat().map((cell, index) => (
                      <div key={`${cell.day}-${index}`} className="min-h-[96px] rounded-2xl border border-border/80 bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-medium text-foreground">{cell.day || " "}</p>
                          {cell.items.length > 0 ? <AdminToneBadge tone="neutral">{cell.items.length} items</AdminToneBadge> : null}
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {cell.items.map((item) => (
                            <p key={item} className="rounded-xl bg-[#fff7f5] px-2 py-1 text-[11px] leading-5 text-[#b9483a]">
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {adminDemoData.operations.calendarMoments.map((moment) => (
                      <button
                        key={moment.id}
                        type="button"
                        onClick={() => setDetailState({ kind: "event", id: moment.id.replace("moment", "event") })}
                        className="rounded-2xl border border-border/80 bg-white p-4 text-left"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-medium text-foreground">{moment.title}</p>
                            <p className="text-[12px] text-muted-foreground">{moment.date} · {moment.audience}</p>
                          </div>
                          <AdminToneBadge tone={moment.tone}>{moment.status}</AdminToneBadge>
                        </div>
                        <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{moment.note}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {timetableSection === "class" || timetableSection === "student" || timetableSection === "teacher" ? (
                <div className="space-y-4">
                  <AdminUtilityBar>
                    <Select
                      value={selectedTimetableOption[timetableSection]}
                      onValueChange={(value) =>
                        setSelectedTimetableOption((current) => ({
                          ...current,
                          [timetableSection]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-9 w-[220px] bg-white text-[13px]">
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMETABLE_VIEWS[timetableSection].options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AdminToneBadge tone="info">
                      Weekly timetable preview
                    </AdminToneBadge>
                  </AdminUtilityBar>
                  <WeeklyTimetableGrid rows={TIMETABLE_VIEWS[timetableSection].rows} />
                </div>
              ) : null}

              {timetableSection === "history" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TIMETABLE_IMPORTS.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-foreground">{row.source}</TableCell>
                        <TableCell>{row.actor}</TableCell>
                        <TableCell>{row.timestamp}</TableCell>
                        <TableCell>
                          <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </AdminPanel>

            <div className="space-y-4">
              <AdminPanel title="Current timetable exceptions" description="A small operational watchlist keeps the module grounded in real school issues.">
                <div className="space-y-3">
                  {adminDemoData.operations.timetableIssues.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => setDetailState({ kind: "issue", id: issue.id })}
                      className="w-full rounded-2xl border border-border/80 bg-white px-4 py-3 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{issue.type}</p>
                          <p className="text-[12px] text-muted-foreground">{issue.className} · {issue.owner}</p>
                        </div>
                        <AdminToneBadge tone={issue.tone}>{issue.severity}</AdminToneBadge>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{issue.summary}</p>
                    </button>
                  ))}
                </div>
              </AdminPanel>

              <AdminPanel title="Publish guardrails" description="Visible reminders instead of irreversible actions.">
                <div className="space-y-3 text-[13px] leading-6 text-muted-foreground">
                  <p className="rounded-2xl border border-border/80 bg-white p-4">
                    Class, student, and teacher timetable perspectives are read-only previews in this prototype.
                  </p>
                  <p className="rounded-2xl border border-border/80 bg-white p-4">
                    Import history exists to make setup feel real without needing schedule math or conflict resolution logic.
                  </p>
                </div>
              </AdminPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <AdminUtilityBar
            actions={
              <Button onClick={() => toast.success("Create event flow opened in the demo")}>
                Create event
              </Button>
            }
          >
            <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as CalendarView)}>
              <TabsList className="bg-white">
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={calendarClass} onValueChange={setCalendarClass}>
              <SelectTrigger className="h-9 w-[200px] bg-white text-[13px]">
                <SelectValue placeholder="Class or audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {Array.from(new Set(CALENDAR_EVENTS.map((event) => event.className))).map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={calendarQuery}
              onChange={(event) => setCalendarQuery(event.target.value)}
              placeholder="Search events, audience, or date"
              className="h-9 max-w-[280px] bg-white text-[13px]"
            />
          </AdminUtilityBar>

          <div className="grid gap-4 xl:grid-cols-[280px,1fr]">
            <AdminPanel title="Filters" description="Agenda-first filtering with event type and class context.">
              <div className="space-y-4">
                <div>
                  <p className="mb-3 text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Event types</p>
                  <div className="space-y-3">
                    {CALENDAR_EVENT_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-3 text-[13px] text-foreground">
                        <Checkbox
                          checked={selectedEventTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            setSelectedEventTypes((current) =>
                              checked ? Array.from(new Set([...current, type])) : current.filter((item) => item !== type),
                            );
                          }}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Calendar notes</p>
                  <div className="space-y-3">
                    {adminDemoData.operations.calendarMoments.map((moment) => (
                      <button
                        key={moment.id}
                        type="button"
                        onClick={() => toast.message(`${moment.title} is pinned in the demo calendar sidebar`)}
                        className="w-full rounded-2xl border border-border/80 bg-white px-4 py-3 text-left"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-medium text-foreground">{moment.title}</p>
                          <AdminToneBadge tone={moment.tone}>{moment.status}</AdminToneBadge>
                        </div>
                        <p className="mt-1 text-[12px] text-muted-foreground">{moment.date}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AdminPanel>

            <AdminPanel title="Calendar management" description="Agenda, week, and month views with event rows that keep class and audience context visible.">
              <div className="space-y-3">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setDetailState({ kind: "event", id: event.id })}
                      className="w-full rounded-2xl border border-border/80 bg-white px-4 py-4 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-medium text-foreground">{event.title}</p>
                            <AdminToneBadge tone={event.tone}>{event.type}</AdminToneBadge>
                          </div>
                          <p className="mt-1 text-[12px] text-muted-foreground">{event.date}</p>
                        </div>
                        <AdminToneBadge tone="neutral">{event.participants} participants</AdminToneBadge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AdminToneBadge tone="info">{event.className}</AdminToneBadge>
                        <AdminToneBadge tone="neutral">{event.audience}</AdminToneBadge>
                        <AdminToneBadge tone="neutral">{calendarView}</AdminToneBadge>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-[#fcfcfd] p-10 text-center">
                    <p className="text-[14px] font-medium text-foreground">No events match these filters</p>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                      Keep the empty state intentional so operations still feels calm and polished in the demo.
                    </p>
                  </div>
                )}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
            <div className="space-y-4">
              <AdminPanel title="School information" description="Branding and domain settings presented as a real configuration surface.">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-dashed border-border/80 bg-[#fcfcfd] p-6">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Logo upload</p>
                    <div className="mt-4 flex h-[132px] items-center justify-center rounded-2xl border border-[#ffe1dc] bg-[#fff7f5]">
                      <div className="text-center">
                        <p className="text-[18px] font-semibold tracking-tight text-[#b9483a]">Peach</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">Leadership-approved logo lockup</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => toast.success("Logo replacement is mocked in this prototype")}>
                      Replace logo
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">School name</label>
                      <Input value={brandingDraft.schoolName} onChange={(event) => setBrandingDraft((current) => ({ ...current, schoolName: event.target.value }))} className="mt-2 bg-white" />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Report display name</label>
                      <Input value={brandingDraft.reportDisplayName} onChange={(event) => setBrandingDraft((current) => ({ ...current, reportDisplayName: event.target.value }))} className="mt-2 bg-white" />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">School code</label>
                      <Input value={brandingDraft.schoolCode} onChange={(event) => setBrandingDraft((current) => ({ ...current, schoolCode: event.target.value }))} className="mt-2 bg-white" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Address</label>
                    <Textarea value={brandingDraft.address} onChange={(event) => setBrandingDraft((current) => ({ ...current, address: event.target.value }))} className="mt-2 min-h-[110px] bg-white" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Contact email</label>
                      <Input value={brandingDraft.email} onChange={(event) => setBrandingDraft((current) => ({ ...current, email: event.target.value }))} className="mt-2 bg-white" />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Phone</label>
                      <Input value={brandingDraft.phone} onChange={(event) => setBrandingDraft((current) => ({ ...current, phone: event.target.value }))} className="mt-2 bg-white" />
                    </div>
                    <Button onClick={() => toast.success("Branding settings saved locally for the demo")}>
                      Save branding preview
                    </Button>
                  </div>
                </div>
              </AdminPanel>

              <AdminPanel title="Custom domains" description="Domain health cards make school identity feel operational rather than decorative.">
                <div className="space-y-3">
                  {adminDemoData.operations.domains.map((domain) => (
                    <div key={domain.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{domain.domain}</p>
                          <p className="text-[12px] text-muted-foreground">{domain.lastChecked}</p>
                        </div>
                        <AdminToneBadge tone={domain.tone}>{domain.status}</AdminToneBadge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AdminToneBadge tone="neutral">SSL: {domain.ssl}</AdminToneBadge>
                        <AdminToneBadge tone="neutral">DNS: {domain.dns}</AdminToneBadge>
                      </div>
                      <div className="mt-3">
                        <AdminRowLink label="Inspect" onClick={() => setDetailState({ kind: "domain", id: domain.id })} />
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>

            <div className="space-y-4">
              <AdminPanel title="Portal previews" description="Brand continuity across personas without inventing a different design system.">
                <div className="grid gap-4 sm:grid-cols-2">
                  {adminDemoData.operations.brandingPreviews.map((preview) => (
                    <AdminPortalPreview
                      key={preview.id}
                      title={preview.heading}
                      subtitle={preview.subheading}
                      accentLabel={preview.accentLabel}
                    />
                  ))}
                </div>
              </AdminPanel>

              <AdminPanel title="Identity notes" description="Small governance notes help explain why branding belongs in Operations.">
                <div className="space-y-3 text-[13px] leading-6 text-muted-foreground">
                  <p className="rounded-2xl border border-border/80 bg-white p-4">
                    Report display name and school code are shown because schools usually care about these details even in a prototype.
                  </p>
                  <p className="rounded-2xl border border-border/80 bg-white p-4">
                    Domain health remains read-only. The goal is credible settings depth, not real DNS or SSL tooling.
                  </p>
                </div>
              </AdminPanel>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AdminDetailDrawer
        open={Boolean(detailState)}
        onOpenChange={(open) => {
          if (!open) setDetailState(null);
        }}
        title={
          selectedAttendance?.programme ??
          selectedCompliance?.student ??
          selectedDomain?.domain ??
          selectedIssue?.type ??
          selectedEvent?.title ??
          "Operations detail"
        }
        description={
          selectedAttendance
            ? `${selectedAttendance.gradeBand} · ${selectedAttendance.owner}`
            : selectedCompliance
              ? `${selectedCompliance.className} · ${selectedCompliance.owner}`
              : selectedDomain
                ? `${selectedDomain.ssl} · ${selectedDomain.dns}`
                : selectedIssue
                  ? `${selectedIssue.className} · ${selectedIssue.owner}`
                  : selectedEvent
                    ? `${selectedEvent.className} · ${selectedEvent.audience}`
                    : undefined
        }
        primaryLabel="Acknowledge"
        onPrimary={() => toast.success("Operations detail acknowledged in the demo")}
      >
        {selectedAttendance ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Completion</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedAttendance.completion}%</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Unresolved</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedAttendance.unresolved}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4 text-[13px] leading-6 text-muted-foreground">
              Chronic absence: {selectedAttendance.chronicAbsence}. Late-pattern flags: {selectedAttendance.latePattern}. This drawer is intentionally summary-only.
            </div>
          </div>
        ) : null}

        {selectedCompliance ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Why flagged</p>
              <p className="mt-2 text-[14px] leading-7 text-foreground">{selectedCompliance.note}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Attendance</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedCompliance.attendance}%</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Absences</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedCompliance.absences}</p>
              </div>
            </div>
          </div>
        ) : null}

        {selectedIssue ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Summary</p>
              <p className="mt-2 text-[14px] leading-7 text-foreground">{selectedIssue.summary}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4 text-[13px] leading-6 text-muted-foreground">
              Due {selectedIssue.dueLabel}. Keep this read-only; the operations portal is demonstrating governance depth, not schedule repair tools.
            </div>
          </div>
        ) : null}

        {selectedDomain ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">SSL</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedDomain.ssl}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">DNS</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedDomain.dns}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fff7f5] p-4 text-[13px] leading-6 text-muted-foreground">
              Domain status is shown here to support branding and school identity conversations without implying real domain administration.
            </div>
          </div>
        ) : null}

        {selectedEvent ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Event window</p>
              <p className="mt-2 text-[14px] font-medium text-foreground">{selectedEvent.date}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4 text-[13px] leading-6 text-muted-foreground">
              {selectedEvent.participants} participants expected. Class context and audience remain visible so the calendar feels school-operational rather than generic.
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
