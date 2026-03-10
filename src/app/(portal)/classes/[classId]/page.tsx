"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { IncidentDialog } from "@/components/shared/incident-dialog";
import { GradingSheet } from "@/components/shared/grading-sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { useGradeEditor } from "@/lib/hooks/use-grade-editor";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import {
  Users,
  ClipboardCheck,
  BookOpen,
  Clock,
  MessageSquare,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  CalendarDays,
  ExternalLink,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { generateId } from "@/services/mock-service";
import { format, parseISO, addDays, getDay } from "date-fns";
import { getGradeCellDisplay, getGradePercentage, getToMarkCount, getMissingCount, getExcusedCount, isGradeComplete, GRADING_MODE_LABELS } from "@/lib/grade-helpers";
import { computeClassAveragePercent, computeAttentionStudents, computeWeakestGoals, computeAssessmentChartData } from "@/lib/selectors/grade-selectors";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { AssessmentListItem } from "@/components/shared/assessment-list-item";
import { FilterBar } from "@/components/shared/filter-bar";
import { StandardsTab } from "@/components/class-tabs/standards-tab";
import { PortfolioTab } from "@/components/class-tabs/portfolio-tab";
import { AttendanceTab } from "@/components/class-tabs/attendance-tab";
import { AttendanceDialog } from "@/components/shared/attendance-dialog";
import { UnitPlansTab } from "@/components/class-tabs/unit-plans-tab";
import { LessonPlanDrawer } from "@/components/unit-planning/lesson-plan-drawer";

const VALID_TABS = new Set(["overview", "assessments", "grades", "attendance", "portfolio", "reports", "communication", "schedule", "standards", "units"]);

// Colour palette for unit plan dots (assigned by order within class)
const UNIT_DOT_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#d97706", // amber
  "#7c3aed", // purple
  "#dc2626", // red
  "#0891b2", // cyan
  "#be185d", // pink
  "#65a30d", // lime
];

const DAY_INDEX: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };

function getNextDateForDay(day: string): string {
  const targetDay = DAY_INDEX[day];
  if (targetDay === undefined) return format(new Date(), "yyyy-MM-dd");
  const today = new Date();
  const currentDay = getDay(today);
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  return format(addDays(today, daysUntil), "yyyy-MM-dd");
}

export default function ClassHubPage() {
  const params = useParams();
  const classId = params.classId as string;
  const loading = useMockLoading([classId]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam && VALID_TABS.has(tabParam) ? tabParam : "overview"
  );

  const activeClassId = useStore((s) => s.ui.activeClassId);
  const setActiveClass = useStore((s) => s.setActiveClass);
  const getClassById = useStore((s) => s.getClassById);

  // If the user navigated directly to a class that differs from the macro filter,
  // reset the macro filter to "All classes" so the page stays on the intended class.
  // When the macro filter changes *after* mount, navigate to the newly selected class.
  const [initialClassId] = useState(classId);
  useEffect(() => {
    if (activeClassId && activeClassId !== classId) {
      if (classId === initialClassId) {
        // User landed here directly — clear the macro filter instead of redirecting
        setActiveClass(null);
      } else {
        // The macro filter changed while on this page — follow it
        router.push(`/classes/${activeClassId}`);
      }
    }
  }, [activeClassId, classId, initialClassId, router, setActiveClass]);
  const allStudents = useStore((s) => s.students);
  const allClasses = useStore((s) => s.classes);
  const allAssessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const allArtifacts = useStore((s) => s.artifacts);
  const allSessions = useStore((s) => s.attendanceSessions);
  const allAnnouncements = useStore((s) => s.announcements);
  const learningGoals = useStore((s) => s.learningGoals);
  const allReports = useStore((s) => s.reports);
  const reportCycles = useStore((s) => s.reportCycles);
  const allUnitPlans = useStore((s) => s.unitPlans);
  const allLessonPlans = useStore((s) => s.lessonPlans);
  const allLessonSlotAssignments = useStore((s) => s.lessonSlotAssignments);
  const allChannels = useStore((s) => s.channels);
  const addChannel = useStore((s) => s.addChannel);
  const currentUser = useStore((s) => s.currentUser);

  const cls = getClassById(classId);
  const students = useMemo(() => {
    const c = allClasses.find((c) => c.id === classId);
    if (!c) return [];
    return allStudents.filter((s) => c.studentIds.includes(s.id));
  }, [allStudents, allClasses, classId]);
  const assessments = useMemo(
    () => allAssessments.filter((a) => a.classId === classId),
    [allAssessments, classId]
  );
  const artifacts = useMemo(
    () => allArtifacts.filter((a) => a.classId === classId),
    [allArtifacts, classId]
  );
  const sessions = useMemo(
    () => allSessions.filter((s) => s.classId === classId),
    [allSessions, classId]
  );
  const announcements = useMemo(
    () => allAnnouncements.filter((a) => a.classId === classId),
    [allAnnouncements, classId]
  );
  const classReports = useMemo(
    () => allReports.filter((r) => r.classId === classId),
    [allReports, classId]
  );
  const openCycle = useMemo(
    () => reportCycles.find((c) => c.status === "open" && c.classIds.includes(classId)),
    [reportCycles, classId]
  );
  const unitPlans = useMemo(
    () => allUnitPlans.filter((u) => u.classId === classId),
    [allUnitPlans, classId]
  );
  const unitLessonPlans = useMemo(
    () => allLessonPlans.filter((lp) => lp.classId === classId),
    [allLessonPlans, classId]
  );
  const unitSlotAssignments = useMemo(
    () => allLessonSlotAssignments.filter((a) => a.classId === classId),
    [allLessonSlotAssignments, classId]
  );

  // Map each unit plan to a stable colour from the palette
  const unitColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    unitPlans
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((u, i) => {
        map[u.id] = UNIT_DOT_COLORS[i % UNIT_DOT_COLORS.length];
      });
    return map;
  }, [unitPlans]);

  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const editor = useGradeEditor();

  const handleSaveAndNext = () => {
    if (!editor.gradingStudentId || !editor.gradingAssessmentId) return;
    const sorted = [...students].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    );
    const currentIdx = sorted.findIndex((s) => s.id === editor.gradingStudentId);
    editor.handleSaveGrade();
    if (currentIdx < sorted.length - 1) {
      editor.openGradingSheet(sorted[currentIdx + 1].id, editor.gradingAssessmentId);
    } else {
      toast.success("All students graded!");
    }
  };
  const handleMessageStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Check if DM already exists
    const existingDm = allChannels.find(
      (ch) => ch.type === "dm" && ch.classId === classId && ch.participantIds?.includes(studentId)
    );
    if (existingDm) {
      router.push(`/communication`);
      return;
    }

    // Create DM channel
    const channelId = generateId("ch");
    addChannel({
      id: channelId,
      classId,
      name: `DM: ${currentUser?.name ?? "Ms. Mitchell"} \u2194 ${student.firstName} ${student.lastName}`,
      type: "dm",
      participantIds: [currentUser?.id ?? "tchr_01", studentId],
      createdAt: new Date().toISOString(),
    });
    router.push(`/communication`);
    toast.success(`Conversation started with ${student.firstName}`);
  };

  const [scheduleAttendanceOpen, setScheduleAttendanceOpen] = useState(false);
  const [scheduleAttendanceDate, setScheduleAttendanceDate] = useState<string | undefined>();
  // Schedule tab detail sheet state
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [scheduleSheetSlot, setScheduleSheetSlot] = useState<{
    slot: { day: string; startTime: string; endTime: string; room?: string };
    day: string;
    nextDate: string;
    assignedLesson: (typeof unitLessonPlans)[number] | null;
    assignedUnit: (typeof unitPlans)[number] | null;
    unitColor: string | null;
  } | null>(null);
  // Lesson plan drawer state (opened from inside the schedule sheet)
  const [scheduleLessonDrawerOpen, setScheduleLessonDrawerOpen] = useState(false);
  const [scheduleLessonId, setScheduleLessonId] = useState<string | null>(null);
  // Analytics section state (Grades tab)
  const [showAttention, setShowAttention] = useState(true);
  const [showAllAttention, setShowAllAttention] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [showChart, setShowChart] = useState(true);
  // Assessment filter state (Assessments tab)
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState("all");
  const [assessmentModeFilter, setAssessmentModeFilter] = useState("all");
  const [assessmentDateSort, setAssessmentDateSort] = useState("newest");

  if (loading) return <DetailSkeleton />;
  if (!cls) return <EmptyState icon={AlertCircle} title="Class not found" description="This class doesn't exist." />;

  const publishedAssessments = assessments.filter((a) => a.status === "live");
  const classAvgPct = computeClassAveragePercent(grades, assessments, classId);
  const avgGrade = classAvgPct !== null ? `${classAvgPct}%` : "N/A";

  const totalSessions = sessions.length;
  const attendanceRate = (() => {
    if (totalSessions === 0) return "N/A";
    let present = 0;
    let total = 0;
    sessions.forEach((s) => {
      s.records.forEach((r) => {
        total++;
        if (r.status === "present") present++;
      });
    });
    return total > 0 ? `${Math.round((present / total) * 100)}%` : "N/A";
  })();

  return (
    <div>
      <PageHeader title={cls.name} description={`${cls.subject} · ${cls.gradeLevel}`}>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{cls.programme}</Badge>
          <StatusBadge status={cls.type} showIcon={false} />
          <Badge variant="secondary">{cls.academicYear} · {cls.term}</Badge>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="grades">Gradebook</TabsTrigger>
          <TabsTrigger value="standards">Standards & Skills</TabsTrigger>
          <TabsTrigger value="units">Unit Plans</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Students" value={students.length} icon={Users} />
            <StatCard label="Assessments" value={publishedAssessments.length} icon={ClipboardCheck} />
            <StatCard label="Avg grade" value={avgGrade} icon={BookOpen} />
            <StatCard label="Attendance" value={attendanceRate} icon={Clock} />
          </div>
          <Card className="p-5 gap-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-semibold">Students</h3>
              <Button
                size="sm"
                variant="outline"
                className="text-[13px] h-8"
                onClick={() => setIncidentDialogOpen(true)}
              >
                <ShieldAlert className="h-4 w-4 mr-1.5" />
                Log incident
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <Link
                    href={`/students/${student.id}?classId=${classId}`}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <Avatar className="h-7 w-7">
                      {student.avatarUrl && <AvatarImage src={student.avatarUrl} alt={`${student.firstName} ${student.lastName}`} />}
                      <AvatarFallback className="text-[11px] font-semibold bg-[#c24e3f]/10 text-[#c24e3f]">
                        {student.firstName[0]}{student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] font-medium truncate">
                      {student.firstName} {student.lastName}
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMessageStudent(student.id);
                    }}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          {assessments.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No assessments yet" description="Create your first assessment for this class." />
          ) : (() => {
            const studentIds = students.map((s) => s.id);
            let filtered = [...assessments];
            if (assessmentStatusFilter !== "all") {
              filtered = filtered.filter((a) => a.status === assessmentStatusFilter);
            }
            if (assessmentModeFilter !== "all") {
              filtered = filtered.filter((a) => a.gradingMode === assessmentModeFilter);
            }
            if (assessmentSearch) {
              const q = assessmentSearch.toLowerCase();
              filtered = filtered.filter((a) => a.title.toLowerCase().includes(q));
            }
            // Sort
            if (assessmentDateSort === "newest") {
              filtered.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
            } else if (assessmentDateSort === "oldest") {
              filtered.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
            } else {
              filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            }
            return (
              <div className="space-y-2">
                <FilterBar
                  filters={[
                    {
                      key: "status",
                      label: "Status",
                      options: [
                        { value: "all", label: "All statuses" },
                        { value: "draft", label: "Draft" },
                        { value: "live", label: "Live" },
                        { value: "closed", label: "Closed" },
                      ],
                      value: assessmentStatusFilter,
                      onChange: setAssessmentStatusFilter,
                    },
                    {
                      key: "mode",
                      label: "Mode",
                      options: [
                        { value: "all", label: "All modes" },
                        ...Object.entries(GRADING_MODE_LABELS).map(([k, v]) => ({
                          value: k,
                          label: v,
                        })),
                      ],
                      value: assessmentModeFilter,
                      onChange: setAssessmentModeFilter,
                    },
                    {
                      key: "sort",
                      label: "Sort",
                      options: [
                        { value: "newest", label: "Due date (newest)" },
                        { value: "oldest", label: "Due date (oldest)" },
                        { value: "created", label: "Recently created" },
                      ],
                      value: assessmentDateSort,
                      onChange: setAssessmentDateSort,
                    },
                  ]}
                  onSearch={setAssessmentSearch}
                  searchPlaceholder="Search assessments..."
                />
                {filtered.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground text-center py-8">No assessments match your filters</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((asmt) => {
                      const asmtGrades = grades.filter((g) => g.assessmentId === asmt.id);
                      const gradedCount = studentIds.filter((sid) => {
                        const grade = asmtGrades.find((g) => g.studentId === sid);
                        return grade ? isGradeComplete(grade, asmt) : false;
                      }).length;
                      return (
                        <AssessmentListItem
                          key={asmt.id}
                          assessment={asmt}
                          grades={asmtGrades}
                          studentIds={studentIds}
                          href={`/assessments/${asmt.id}?classId=${classId}`}
                          variant="card"
                          unitTitle={asmt.unitId ? unitPlans.find((u) => u.id === asmt.unitId)?.title : undefined}
                          gradedCount={gradedCount}
                          totalStudents={studentIds.length}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="grades">
          {publishedAssessments.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No published assessments"
              description="This class has no published assessments to show in the gradebook."
            />
          ) : (() => {
            const studentIds = students.map((s) => s.id);
            const totalToMark = publishedAssessments.reduce((sum, a) => sum + getToMarkCount(studentIds, grades.filter((g) => g.assessmentId === a.id), a), 0);
            const totalMissing = publishedAssessments.reduce((sum, a) => sum + getMissingCount(studentIds, grades.filter((g) => g.assessmentId === a.id), a), 0);
            const totalExcused = publishedAssessments.reduce((sum, a) => sum + getExcusedCount(studentIds, grades.filter((g) => g.assessmentId === a.id), a), 0);

            // Class average with guardrail: only show when ≥3 assessments have numeric data
            const chartData = computeAssessmentChartData(students, grades, publishedAssessments);
            const classAvgNumeric = chartData.length >= 3 ? computeClassAveragePercent(grades, assessments, classId) : null;

            // Students needing attention (centralized selector)
            const attentionStudents = computeAttentionStudents(students, grades, publishedAssessments, learningGoals, classId);

            // Learning insights: weakest standards/criteria (centralized selector)
            const weakestGoals = computeWeakestGoals(students, grades, publishedAssessments, learningGoals);

            const strongest = chartData.length > 0 ? chartData.reduce((a, b) => a.avg > b.avg ? a : b) : null;
            const weakest = chartData.length > 0 ? chartData.reduce((a, b) => a.avg < b.avg ? a : b) : null;

            return (
            <div className="space-y-4">
            <Card className="p-0 gap-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px] font-medium min-w-[180px] sticky left-0 bg-background z-10 border-r border-border">
                        Student
                      </TableHead>
                      {publishedAssessments.map((asmt) => (
                        <TableHead
                          key={asmt.id}
                          className="text-[12px] font-medium text-center min-w-[90px]"
                        >
                          <Link
                            href={`/assessments/${asmt.id}?classId=${classId}`}
                            className="hover:text-[#c24e3f] transition-colors"
                            title={`${asmt.title}\nDue: ${asmt.dueDate ? format(parseISO(asmt.dueDate), "MMM d, yyyy") : "No date"}\nMode: ${GRADING_MODE_LABELS[asmt.gradingMode]}`}
                          >
                            {asmt.title.length > 14
                              ? `${asmt.title.slice(0, 14)}...`
                              : asmt.title}
                          </Link>
                          <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                            {GRADING_MODE_LABELS[asmt.gradingMode]}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-[12px] font-medium text-center min-w-[80px]">
                        Average
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const studentPercentages = publishedAssessments
                        .map((asmt) => {
                          const grade = grades.find(
                            (g) =>
                              g.studentId === student.id &&
                              g.assessmentId === asmt.id
                          );
                          return getGradePercentage(grade, asmt);
                        })
                        .filter((v): v is number => v !== null);
                      const studentAvg =
                        studentPercentages.length > 0
                          ? Math.round(
                              studentPercentages.reduce((s, v) => s + v, 0) /
                                studentPercentages.length
                            )
                          : null;

                      return (
                        <TableRow key={student.id}>
                          <TableCell className="sticky left-0 bg-background z-10 border-r border-border">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-[#c24e3f]/10 flex items-center justify-center text-[11px] font-semibold text-[#c24e3f]">
                                {student.firstName[0]}
                                {student.lastName[0]}
                              </div>
                              <Link
                                href={`/students/${student.id}?classId=${classId}`}
                                className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors"
                              >
                                {student.firstName} {student.lastName}
                              </Link>
                            </div>
                          </TableCell>
                          {publishedAssessments.map((asmt) => {
                            const grade = grades.find(
                              (g) =>
                                g.studentId === student.id &&
                                g.assessmentId === asmt.id
                            );
                            const display = getGradeCellDisplay(grade, asmt);
                            return (
                              <TableCell
                                key={asmt.id}
                                className="text-center"
                              >
                                <button
                                  onClick={() =>
                                    editor.openGradingSheet(student.id, asmt.id)
                                  }
                                  className={`text-[12px] font-medium px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer ${
                                    grade
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {display}
                                </button>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <span
                              className={`text-[12px] font-semibold ${
                                studentAvg !== null
                                  ? studentAvg >= 70
                                    ? "text-[#16a34a]"
                                    : studentAvg >= 50
                                      ? "text-[#b45309]"
                                      : "text-[#dc2626]"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {studentAvg !== null ? `${studentAvg}%` : "-"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Section A — Teaching Snapshot */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <AlertTriangle className={`h-4 w-4 ${totalToMark > 0 ? "text-[#b45309]" : "text-muted-foreground"}`} />
                <span className={`text-[13px] font-semibold ${totalToMark > 0 ? "text-[#b45309]" : "text-muted-foreground"}`}>{totalToMark}</span>
                <span className="text-[12px] text-muted-foreground">to mark</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <span className={`text-[13px] font-semibold ${totalMissing > 0 ? "text-[#dc2626]" : "text-muted-foreground"}`}>{totalMissing}</span>
                <span className="text-[12px] text-muted-foreground">missing</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <span className="text-[13px] font-semibold text-muted-foreground">{totalExcused}</span>
                <span className="text-[12px] text-muted-foreground">excused</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <span className={`text-[13px] font-semibold ${classAvgNumeric !== null ? (classAvgNumeric >= 70 ? "text-[#16a34a]" : classAvgNumeric >= 50 ? "text-[#b45309]" : "text-[#dc2626]") : "text-muted-foreground"}`}>
                        {classAvgNumeric !== null ? `${classAvgNumeric}%` : "N/A"}
                      </span>
                      <span className="text-[12px] text-muted-foreground">class avg</span>
                    </div>
                  </TooltipTrigger>
                  {classAvgNumeric === null && (
                    <TooltipContent>Not enough comparable grades</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Section B — Students Needing Attention */}
            {(() => {
              const visible = showAllAttention ? attentionStudents : attentionStudents.slice(0, 5);
              return (
                <Card className="p-4 gap-0">
                  <button className="flex items-center gap-2 w-full text-left" onClick={() => setShowAttention(!showAttention)}>
                    <h3 className="text-[14px] font-semibold flex-1">Students needing attention</h3>
                    {showAttention ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {showAttention && (
                    attentionStudents.length === 0 ? (
                      <p className="text-[13px] text-[#16a34a] mt-2">All students on track</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {visible.map(({ student, reasons }) => (
                          <div key={student.id} className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-[#c24e3f]/10 flex items-center justify-center text-[10px] font-semibold text-[#c24e3f]">
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <Link href={`/students/${student.id}?classId=${classId}`} className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors min-w-[120px]">
                              {student.firstName} {student.lastName}
                            </Link>
                            <div className="flex gap-1 flex-wrap">
                              {reasons.map((r, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] font-normal h-5">
                                  {r}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                        {attentionStudents.length > 5 && (
                          <button className="text-[12px] text-[#c24e3f] hover:underline" onClick={() => setShowAllAttention(!showAllAttention)}>
                            {showAllAttention ? "Show less" : `Show all (${attentionStudents.length})`}
                          </button>
                        )}
                      </div>
                    )
                  )}
                </Card>
              );
            })()}

            {/* Section C — Learning Insights */}
            {(() => {
              return (
                <Card className="p-4 gap-0">
                  <button className="flex items-center gap-2 w-full text-left" onClick={() => setShowInsights(!showInsights)}>
                    <h3 className="text-[14px] font-semibold flex-1">Learning insights</h3>
                    {showInsights ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {showInsights && (
                    weakestGoals.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground mt-2">No standards or criteria data yet</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {weakestGoals.map((goal) => {
                          const exceeding = goal.levels["exceeding"] || 0;
                          const meeting = goal.levels["meeting"] || 0;
                          const approaching = goal.levels["approaching"] || 0;
                          const beginning = goal.levels["beginning"] || 0;
                          return (
                            <div key={goal.code}>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] font-semibold h-5 shrink-0">{goal.code}</Badge>
                                <span className="text-[12px] font-medium truncate">{goal.title}</span>
                              </div>
                              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                                {exceeding > 0 && <div className="bg-[#16a34a] h-full" style={{ width: `${(exceeding / goal.total) * 100}%` }} />}
                                {meeting > 0 && <div className="bg-[#2563eb] h-full" style={{ width: `${(meeting / goal.total) * 100}%` }} />}
                                {approaching > 0 && <div className="bg-[#d97706] h-full" style={{ width: `${(approaching / goal.total) * 100}%` }} />}
                                {beginning > 0 && <div className="bg-[#dc2626] h-full" style={{ width: `${(beginning / goal.total) * 100}%` }} />}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {goal.below} of {goal.total} below proficient
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </Card>
              );
            })()}

            {/* Section D — Class Performance Chart */}
            {chartData.length >= 2 && (() => {
              return (
                <Card className="p-4 gap-0">
                  <button className="flex items-center gap-2 w-full text-left" onClick={() => setShowChart(!showChart)}>
                    <h3 className="text-[14px] font-semibold flex-1">Class performance</h3>
                    {showChart ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {showChart && (
                    <>
                      <p className="text-[12px] text-muted-foreground mt-1 mb-3">
                        {strongest && weakest && strongest.fullName !== weakest.fullName
                          ? `Strongest: ${strongest.fullName} (${strongest.avg}%) · Weakest: ${weakest.fullName} (${weakest.avg}%)`
                          : `Class averaging ${classAvgNumeric ?? "N/A"}% across ${chartData.length} assessments`}
                      </p>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <RechartsTooltip
                              formatter={(value) => [`${value}%`, "Class Avg"]}
                              contentStyle={{ fontSize: 12 }}
                            />
                            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.avg >= 70 ? "#16a34a" : entry.avg >= 50 ? "#d97706" : "#dc2626"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </Card>
              );
            })()}
            </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="standards">
          <StandardsTab
            classId={classId}
            students={students}
            assessments={assessments}
            grades={grades}
            learningGoals={learningGoals}
          />
        </TabsContent>

        <TabsContent value="units">
          <UnitPlansTab
            classId={classId}
            programme={cls.programme}
            units={unitPlans}
            lessonPlans={unitLessonPlans}
            lessonSlotAssignments={unitSlotAssignments}
            assessments={assessments}
            learningGoals={learningGoals}
            timetableSlots={cls.schedule}
            students={students}
            grades={grades}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab
            classId={classId}
            cls={cls}
            students={students}
            sessions={sessions}
          />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioTab
            classId={classId}
            artifacts={artifacts}
            students={students}
            learningGoals={learningGoals}
          />
        </TabsContent>

        {/* Reports tab (#23) */}
        <TabsContent value="reports">
          {!openCycle ? (
            <EmptyState icon={FileText} title="No open report cycle" description="There is no active report cycle for this class. Reports will appear here when a cycle is open." />
          ) : (() => {
            const cycleReports = classReports.filter((r) => r.cycleId === openCycle.id);
            if (cycleReports.length === 0) {
              return <EmptyState icon={FileText} title="No reports yet" description={`No reports generated for ${openCycle.name} in this class.`} />;
            }

            const drafts = cycleReports.filter((r) => r.publishState === "draft").length;
            const ready = cycleReports.filter((r) => r.publishState === "ready").length;
            const published = cycleReports.filter((r) => r.publishState === "published").length;
            const distributed = cycleReports.filter((r) => r.publishState === "distributed").length;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium">{openCycle.name}</p>
                    <p className="text-[12px] text-muted-foreground">{openCycle.term} · {openCycle.academicYear}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[12px]"
                    onClick={() => {
                      setActiveClass(null);
                      router.push("/reports");
                    }}
                  >
                    View cycle <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[18px] font-semibold">{drafts}</p>
                    <p className="text-[11px] text-muted-foreground">Drafts</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[18px] font-semibold">{ready}</p>
                    <p className="text-[11px] text-muted-foreground">Ready</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[18px] font-semibold">{published}</p>
                    <p className="text-[11px] text-muted-foreground">Published</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[18px] font-semibold">{distributed}</p>
                    <p className="text-[11px] text-muted-foreground">Distributed</p>
                  </div>
                </div>

                {/* Student report list */}
                <Card className="p-4 gap-0">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Student</th>
                        <th className="text-center py-2 px-2 font-medium text-muted-foreground">Status</th>
                        <th className="text-center py-2 px-2 font-medium text-muted-foreground">Sections filled</th>
                        <th className="text-right py-2 pl-2 font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cycleReports.map((rpt) => {
                        const st = allStudents.find((s) => s.id === rpt.studentId);
                        const filledSections = rpt.sections.filter((sec) => {
                          if (sec.type === "teacher_comment") {
                            const txt = (sec.content?.comment as string) || (sec.content?.text as string) || "";
                            return txt.trim() !== "";
                          }
                          return sec.content && Object.keys(sec.content).length > 0;
                        }).length;
                        const totalSec = rpt.sections.length;
                        const pct = totalSec > 0 ? Math.round((filledSections / totalSec) * 100) : 0;
                        return (
                          <tr key={rpt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-2 pr-4">
                              <Link href={`/reports/${rpt.id}?classId=${classId}`} className="font-medium hover:text-[#c24e3f] transition-colors">
                                {st ? `${st.firstName} ${st.lastName}` : "Unknown"}
                              </Link>
                            </td>
                            <td className="text-center py-2 px-2">
                              <StatusBadge status={rpt.publishState} />
                            </td>
                            <td className="text-center py-2 px-2">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : pct > 50 ? "bg-amber-500" : "bg-red-400"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-muted-foreground">{filledSections}/{totalSec}</span>
                              </div>
                            </td>
                            <td className="text-right py-2 pl-2">
                              <Link href={`/reports/${rpt.id}?classId=${classId}`}>
                                <Button variant="outline" size="sm" className="h-7 text-[12px]">Edit</Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="communication">
          {announcements.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No announcements" description="Class announcements will appear here." />
          ) : (
            <div className="space-y-2">
              {announcements.slice(0, 10).map((ann) => (
                <Card key={ann.id} className="p-4 gap-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[14px] font-medium">{ann.title}</p>
                    <StatusBadge status={ann.status} />
                  </div>
                  <p className="text-[13px] text-muted-foreground line-clamp-2">{ann.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {format(parseISO(ann.createdAt), "MMM d, yyyy")}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="p-5 gap-0">
            <h3 className="text-[16px] font-semibold mb-4">Weekly timetable</h3>
            {cls.schedule.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No schedule configured</p>
            ) : (
              <TooltipProvider>
              <div className="grid grid-cols-5 gap-2">
                {(["mon", "tue", "wed", "thu", "fri"] as const).map((day) => {
                  const daySlots = cls.schedule.filter((s) => s.day === day);
                  return (
                    <div key={day}>
                      <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-2">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </p>
                      {daySlots.length === 0 ? (
                        <div className="h-16 rounded-lg bg-muted/30 flex items-center justify-center">
                          <span className="text-[11px] text-muted-foreground">Free</span>
                        </div>
                      ) : (
                        daySlots.map((slot, i) => {
                          const nextDate = getNextDateForDay(slot.day);
                          // Find the most relevant lesson assignment for this slot
                          const matchingAssignments = unitSlotAssignments
                            .filter(
                              (a) => a.slotDay === slot.day && a.slotStartTime === slot.startTime
                            )
                            .sort((a, b) => b.date.localeCompare(a.date));

                          const todayStr = format(new Date(), "yyyy-MM-dd");
                          const slotAssignment =
                            matchingAssignments.find((a) => a.date >= todayStr) ??
                            matchingAssignments[0] ??
                            null;

                          const assignedLesson = slotAssignment
                            ? unitLessonPlans.find((lp) => lp.id === slotAssignment.lessonPlanId)
                            : null;
                          const assignedUnit = slotAssignment
                            ? unitPlans.find((u) => u.id === slotAssignment.unitId)
                            : null;
                          const dotColor = assignedUnit ? unitColorMap[assignedUnit.id] ?? null : null;

                          // Check attendance for next occurrence
                          const attTaken = sessions.some((s) => s.date === nextDate);

                          return (
                            <button
                              key={i}
                              type="button"
                              className="w-full rounded-lg bg-[#fff2f0] border border-[#ffc1b7] p-2 mb-1 text-left hover:bg-[#ffe8e5] transition-colors cursor-pointer"
                              onClick={() => {
                                setScheduleSheetSlot({
                                  slot,
                                  day: slot.day,
                                  nextDate,
                                  assignedLesson: assignedLesson ?? null,
                                  assignedUnit: assignedUnit ?? null,
                                  unitColor: dotColor,
                                });
                                setScheduleSheetOpen(true);
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                {dotColor && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        className="inline-block h-2 w-2 rounded-full shrink-0"
                                        style={{ backgroundColor: dotColor }}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-[11px]">
                                      {assignedUnit?.title}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <p className="text-[11px] font-medium text-[#c24e3f]">
                                  {slot.startTime} – {slot.endTime}
                                </p>
                                {attTaken && (
                                  <CheckCircle2 className="h-3 w-3 text-[#16a34a] shrink-0 ml-auto" />
                                )}
                              </div>
                              {slot.room && (
                                <p className="text-[10px] text-muted-foreground">{slot.room}</p>
                              )}
                              {assignedLesson && (
                                <p className="text-[10px] text-[#c24e3f]/70 font-medium truncate mt-0.5">
                                  {assignedLesson.title}
                                </p>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
              </TooltipProvider>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <GradingSheet editor={editor} onSaveAndNext={handleSaveAndNext} />

      <IncidentDialog
        open={incidentDialogOpen}
        onOpenChange={setIncidentDialogOpen}
        classId={classId}
      />

      <AttendanceDialog
        open={scheduleAttendanceOpen}
        onOpenChange={setScheduleAttendanceOpen}
        prefilledClassId={classId}
        prefilledDate={scheduleAttendanceDate}
      />

      {/* Schedule slot detail sheet */}
      <Sheet open={scheduleSheetOpen} onOpenChange={setScheduleSheetOpen}>
        <SheetContent className="sm:max-w-[420px]">
          {scheduleSheetSlot && (() => {
            const { slot, nextDate, assignedLesson, assignedUnit, unitColor } = scheduleSheetSlot;
            const attTaken = sessions.some((s) => s.date === nextDate);

            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-[18px]">{cls.name}</SheetTitle>
                  <SheetDescription>
                    <Badge
                      variant="outline"
                      className="text-[11px] border-transparent bg-[#dbeafe] text-[#2563eb]"
                    >
                      Class
                    </Badge>
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[13px]">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {(() => {
                          try { return format(parseISO(nextDate), "EEEE, MMMM d, yyyy"); }
                          catch { return nextDate; }
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px]">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{slot.startTime} – {slot.endTime}</span>
                    </div>
                    {slot.room && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{slot.room}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[13px]">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{students.length} students</span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px]">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      {attTaken ? (
                        <Badge variant="outline" className="text-[11px] bg-[#dcfce7] text-[#16a34a] border-transparent">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Taken
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Not taken</span>
                      )}
                    </div>
                  </div>

                  {/* Unit plan section */}
                  {assignedUnit && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                          Unit Plan
                        </span>
                        <div className="mt-1.5 flex items-center gap-2">
                          {unitColor && (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: unitColor }}
                            />
                          )}
                          <button
                            className="text-[13px] font-medium text-[#c24e3f] hover:underline text-left"
                            onClick={() => {
                              setScheduleSheetOpen(false);
                              setActiveTab("units");
                            }}
                          >
                            {assignedUnit.title}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Lesson plan section */}
                  {assignedLesson && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                          Lesson Plan
                        </span>
                        <div className="mt-1.5">
                          <p className="text-[13px] font-medium">{assignedLesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusBadge status={assignedLesson.status} showIcon={false} />
                            {assignedLesson.estimatedDurationMinutes && (
                              <span className="text-[11px] text-muted-foreground">
                                {assignedLesson.estimatedDurationMinutes} min
                              </span>
                            )}
                          </div>
                          {assignedLesson.objectives && assignedLesson.objectives.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {assignedLesson.objectives.slice(0, 2).map((obj, oi) => (
                                <li key={oi} className="text-[12px] text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-[10px] mt-0.5">•</span>
                                  <span>{obj}</span>
                                </li>
                              ))}
                              {assignedLesson.objectives.length > 2 && (
                                <li className="text-[11px] text-muted-foreground">
                                  +{assignedLesson.objectives.length - 2} more
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setScheduleAttendanceDate(nextDate);
                        setScheduleAttendanceOpen(true);
                      }}
                    >
                      {attTaken ? (
                        <>
                          <Pencil className="h-4 w-4 mr-1.5" />
                          Edit attendance
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Take attendance
                        </>
                      )}
                    </Button>
                    {assignedLesson && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScheduleLessonId(assignedLesson.id);
                          setScheduleLessonDrawerOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        Open lesson plan
                      </Button>
                    )}
                    <Link
                      href={`/classes/${classId}`}
                      className="inline-flex items-center gap-1.5 text-[13px] text-[#c24e3f] hover:underline"
                      onClick={() => setScheduleSheetOpen(false)}
                    >
                      View class
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <LessonPlanDrawer
        open={scheduleLessonDrawerOpen}
        onOpenChange={setScheduleLessonDrawerOpen}
        lessonPlan={
          scheduleLessonId
            ? unitLessonPlans.find((lp) => lp.id === scheduleLessonId) ?? null
            : null
        }
        learningGoals={learningGoals}
        assignment={
          scheduleLessonId
            ? unitSlotAssignments.find((a) => a.lessonPlanId === scheduleLessonId)
            : undefined
        }
      />
    </div>
  );
}
