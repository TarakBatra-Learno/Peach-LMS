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
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, addDays, getDay } from "date-fns";
import { getGradeCellDisplay, getGradePercentage, isGradeComplete, GRADING_MODE_LABELS } from "@/lib/grade-helpers";
import { StandardsTab } from "@/components/class-tabs/standards-tab";
import { PortfolioTab } from "@/components/class-tabs/portfolio-tab";
import { AttendanceTab } from "@/components/class-tabs/attendance-tab";
import { AttendanceDialog } from "@/components/shared/attendance-dialog";

const VALID_TABS = new Set(["overview", "assessments", "grades", "attendance", "portfolio", "reports", "communication", "schedule", "standards"]);

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

  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const editor = useGradeEditor();
  const [scheduleAttendanceOpen, setScheduleAttendanceOpen] = useState(false);
  const [scheduleAttendanceDate, setScheduleAttendanceDate] = useState<string | undefined>();

  if (loading) return <DetailSkeleton />;
  if (!cls) return <EmptyState icon={AlertCircle} title="Class not found" description="This class doesn't exist." />;

  const publishedAssessments = assessments.filter((a) => a.status === "published");
  const avgGrade = (() => {
    const classGrades = grades.filter((g) => g.classId === classId && !g.isMissing);
    const percentages: number[] = [];
    classGrades.forEach((g) => {
      const asmt = assessments.find((a) => a.id === g.assessmentId);
      if (!asmt) return;
      const pct = getGradePercentage(g, asmt);
      if (pct !== null) percentages.push(pct);
    });
    if (percentages.length === 0) return "N/A";
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    return `${Math.round(avg)}%`;
  })();

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
                <Link
                  key={student.id}
                  href={`/students/${student.id}?classId=${classId}`}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted transition-colors"
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
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          {assessments.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No assessments yet" description="Create your first assessment for this class." />
          ) : (() => {
            // Compute needs-grading count per assessment
            const withGradingInfo = assessments.map((asmt) => {
              if (asmt.status !== "published") return { asmt, needsGrading: 0 };
              const targetStudentIds = asmt.assignedStudentIds?.length
                ? asmt.assignedStudentIds
                : students.map((s) => s.id);
              const needsGrading = targetStudentIds.filter((sid) => {
                const grade = grades.find(
                  (g) => g.studentId === sid && g.assessmentId === asmt.id
                );
                return !isGradeComplete(grade, asmt);
              }).length;
              return { asmt, needsGrading };
            });
            // Sort: needs-grading first (desc), then by due date desc
            const sorted = [...withGradingInfo].sort((a, b) => {
              if (a.needsGrading !== b.needsGrading) return b.needsGrading - a.needsGrading;
              return b.asmt.dueDate.localeCompare(a.asmt.dueDate);
            });
            return (
              <div className="space-y-2">
                {sorted.map(({ asmt, needsGrading }) => (
                  <Link key={asmt.id} href={`/assessments/${asmt.id}?classId=${classId}`}>
                    <Card className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[14px] font-medium">{asmt.title}</p>
                          <p className="text-[12px] text-muted-foreground">
                            Due {format(parseISO(asmt.dueDate), "MMM d, yyyy")} · {asmt.gradingMode.replace("_", " ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {needsGrading > 0 && (
                            <Badge className="bg-[#fef3c7] text-[#b45309] border-[#b45309]/20 text-[11px] font-medium hover:bg-[#fef3c7]">
                              {needsGrading} need grading
                            </Badge>
                          )}
                          <StatusBadge status={asmt.status} />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
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
          ) : (
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
                                    grade?.isMissing
                                      ? "text-[#dc2626]"
                                      : grade
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
          )}
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
                        daySlots.map((slot, i) => (
                          <button
                            key={i}
                            className="w-full rounded-lg bg-[#fff2f0] border border-[#ffc1b7] p-2 mb-1 text-left cursor-pointer hover:bg-[#ffe8e4] transition-colors"
                            onClick={() => {
                              setScheduleAttendanceDate(getNextDateForDay(slot.day));
                              setScheduleAttendanceOpen(true);
                            }}
                            title="Click to take attendance"
                          >
                            <p className="text-[11px] font-medium text-[#c24e3f]">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            {slot.room && (
                              <p className="text-[10px] text-muted-foreground">{slot.room}</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <GradingSheet editor={editor} />

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
    </div>
  );
}
