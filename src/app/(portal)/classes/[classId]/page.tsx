"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { IncidentDialog } from "@/components/shared/incident-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import {
  Users,
  ClipboardCheck,
  BookOpen,
  Clock,
  FolderOpen,
  MessageSquare,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  FileText,
  CheckCircle2,
  Eye,
  Send,
} from "lucide-react";
import type { PortfolioArtifact } from "@/types/portfolio";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getGradeCellDisplay, getGradePercentage, GRADING_MODE_LABELS } from "@/lib/grade-helpers";

export default function ClassHubPage() {
  const params = useParams();
  const classId = params.classId as string;
  const loading = useMockLoading([classId]);
  const router = useRouter();

  const activeClassId = useStore((s) => s.ui.activeClassId);
  const getClassById = useStore((s) => s.getClassById);

  // When the global class switcher changes, navigate to the new class
  useEffect(() => {
    if (activeClassId && activeClassId !== classId) {
      router.push(`/classes/${activeClassId}`);
    }
  }, [activeClassId, classId, router]);
  const allStudents = useStore((s) => s.students);
  const allClasses = useStore((s) => s.classes);
  const allAssessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const allArtifacts = useStore((s) => s.artifacts);
  const updateArtifact = useStore((s) => s.updateArtifact);
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
  const [detailArtifact, setDetailArtifact] = useState<PortfolioArtifact | null>(null);

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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="grades">Grade snapshot</TabsTrigger>
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
          ) : (
            <div className="space-y-2">
              {assessments.map((asmt) => (
                <Link key={asmt.id} href={`/assessments/${asmt.id}`}>
                  <Card className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-medium">{asmt.title}</p>
                        <p className="text-[12px] text-muted-foreground">
                          Due {format(parseISO(asmt.dueDate), "MMM d, yyyy")} · {asmt.gradingMode.replace("_", " ")}
                        </p>
                      </div>
                      <StatusBadge status={asmt.status} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grades">
          <Card className="p-5 gap-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted-foreground">Grade snapshot for {cls.name}</p>
              <Link href="/gradebook" className="text-[13px] font-medium text-[#c24e3f] hover:underline">
                Open gradebook →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Student</th>
                    {publishedAssessments.map((a) => (
                      <th key={a.id} className="text-center py-2 px-2 font-medium text-muted-foreground max-w-[100px]" title={a.title}>
                        <Link href={`/assessments/${a.id}`} className="hover:text-[#c24e3f] transition-colors">
                          {a.title.length > 14 ? `${a.title.slice(0, 14)}...` : a.title}
                        </Link>
                        <div className="text-[10px] font-normal mt-0.5">
                          {GRADING_MODE_LABELS[a.gradingMode] ?? a.gradingMode}
                        </div>
                      </th>
                    ))}
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const studentPcts = publishedAssessments
                      .map((asmt) => {
                        const grade = grades.find(
                          (g) => g.assessmentId === asmt.id && g.studentId === student.id
                        );
                        return getGradePercentage(grade, asmt);
                      })
                      .filter((v): v is number => v !== null);
                    const studentAvg = studentPcts.length > 0
                      ? Math.round(studentPcts.reduce((s, v) => s + v, 0) / studentPcts.length)
                      : null;

                    return (
                      <tr key={student.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 pr-4">
                          <Link href={`/students/${student.id}?classId=${classId}`} className="text-[13px] font-medium hover:text-[#c24e3f]">
                            {student.firstName} {student.lastName}
                          </Link>
                        </td>
                        {publishedAssessments.map((asmt) => {
                          const grade = grades.find(
                            (g) => g.assessmentId === asmt.id && g.studentId === student.id
                          );
                          const display = getGradeCellDisplay(grade, asmt);
                          return (
                            <td key={asmt.id} className="text-center py-2 px-2">
                              <span className={`text-[12px] font-medium ${
                                grade?.isMissing
                                  ? "text-[#dc2626]"
                                  : grade
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                              }`}>
                                {display}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-center py-2 px-2">
                          <span className={`text-[12px] font-semibold ${
                            studentAvg !== null
                              ? studentAvg >= 70
                                ? "text-[#16a34a]"
                                : studentAvg >= 50
                                  ? "text-[#b45309]"
                                  : "text-[#dc2626]"
                              : "text-muted-foreground"
                          }`}>
                            {studentAvg !== null ? `${studentAvg}%` : "-"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          {sessions.length === 0 ? (
            <EmptyState icon={Clock} title="No attendance records" description="Start taking attendance for this class." />
          ) : (
            <Card className="p-5 gap-0">
              <p className="text-[13px] text-muted-foreground mb-4">Recent attendance sessions</p>
              <div className="space-y-2">
                {sessions.slice(-10).reverse().map((session) => {
                  const present = session.records.filter((r) => r.status === "present").length;
                  const absent = session.records.filter((r) => r.status === "absent").length;
                  const late = session.records.filter((r) => r.status === "late").length;
                  return (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-[13px] font-medium">{format(parseISO(session.date), "EEE, MMM d")}</span>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-[11px] bg-[#dcfce7] text-[#16a34a]">{present} present</Badge>
                        {absent > 0 && <Badge variant="secondary" className="text-[11px] bg-[#fee2e2] text-[#dc2626]">{absent} absent</Badge>}
                        {late > 0 && <Badge variant="secondary" className="text-[11px] bg-[#fef3c7] text-[#b45309]">{late} late</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          {artifacts.length === 0 ? (
            <EmptyState icon={FolderOpen} title="No portfolio artifacts" description="Portfolio items from this class will appear here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {artifacts.slice(0, 12).map((artifact) => {
                const student = students.find((s) => s.id === artifact.studentId);
                return (
                  <Card
                    key={artifact.id}
                    className="p-4 gap-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setDetailArtifact(artifact)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[14px] font-medium truncate flex-1">{artifact.title}</p>
                      <StatusBadge status={artifact.approvalStatus} />
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-2">
                      <Link href={`/students/${artifact.studentId}?classId=${classId}`} className="text-[#c24e3f] hover:underline" onClick={(e) => e.stopPropagation()}>
                        {student?.firstName} {student?.lastName}
                      </Link>
                      {" "}· {artifact.mediaType}
                    </p>
                    <p className="text-[12px] text-muted-foreground truncate">{artifact.description}</p>
                  </Card>
                );
              })}
            </div>
          )}
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
                  <Link href={`/reports/cycles/${openCycle.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-[12px]">
                      View cycle <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
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
                              <Link href={`/reports/${rpt.id}`} className="font-medium hover:text-[#c24e3f] transition-colors">
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
                              <Link href={`/reports/${rpt.id}`}>
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
                          <div key={i} className="rounded-lg bg-[#fff2f0] border border-[#ffc1b7] p-2 mb-1">
                            <p className="text-[11px] font-medium text-[#c24e3f]">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            {slot.room && (
                              <p className="text-[10px] text-muted-foreground">{slot.room}</p>
                            )}
                          </div>
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

      {/* ── Portfolio artifact detail Sheet ── */}
      <Sheet open={!!detailArtifact} onOpenChange={(open) => { if (!open) setDetailArtifact(null); }}>
        <SheetContent className="w-full sm:max-w-[480px]">
          {detailArtifact && (() => {
            const artifactStudent = students.find((s) => s.id === detailArtifact.studentId);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-[16px]">{detailArtifact.title}</SheetTitle>
                  <SheetDescription className="text-[13px]">
                    <Link href={`/students/${detailArtifact.studentId}?classId=${classId}`} className="text-[#c24e3f] hover:underline">
                      {artifactStudent ? `${artifactStudent.firstName} ${artifactStudent.lastName}` : "Unknown"}
                    </Link>
                    {" "}&middot; {cls.name}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 mt-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={detailArtifact.approvalStatus} />
                    <Badge variant="outline" className="text-[11px]">{detailArtifact.mediaType}</Badge>
                    <StatusBadge status={detailArtifact.familyShareStatus} />
                  </div>

                  {detailArtifact.description && (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</h4>
                      <p className="text-[13px] text-foreground">{detailArtifact.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Created</h4>
                      <p className="text-[13px]">{format(parseISO(detailArtifact.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Created by</h4>
                      <p className="text-[13px] capitalize">{detailArtifact.createdBy}</p>
                    </div>
                  </div>

                  {detailArtifact.learningGoalIds.length > 0 && (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Learning goals</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {detailArtifact.learningGoalIds.map((goalId) => {
                          const goal = learningGoals.find((g) => g.id === goalId);
                          return (
                            <Badge key={goalId} variant="outline" className="text-[11px]">
                              {goal?.title || goalId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {detailArtifact.reflection?.text && (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Student reflection</h4>
                      {detailArtifact.reflection.submittedAt && (
                        <p className="text-[11px] text-muted-foreground mb-1.5">
                          Submitted {format(parseISO(detailArtifact.reflection.submittedAt), "MMM d, yyyy")}
                        </p>
                      )}
                      <p className="text-[13px] text-foreground bg-muted/50 rounded-lg p-3">
                        {detailArtifact.reflection.text}
                      </p>
                    </div>
                  )}

                  {detailArtifact.reflection?.teacherComment && (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Teacher comment</h4>
                      <p className="text-[13px] text-foreground bg-muted/50 rounded-lg p-3">
                        {detailArtifact.reflection.teacherComment}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Flag for report toggle (#19) */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[13px] font-medium">Flag for report</Label>
                      <p className="text-[12px] text-muted-foreground">Include this artifact in term reports</p>
                    </div>
                    <Switch
                      checked={detailArtifact.flaggedForReport ?? false}
                      onCheckedChange={(checked) => {
                        updateArtifact(detailArtifact.id, { flaggedForReport: checked });
                        setDetailArtifact({ ...detailArtifact, flaggedForReport: checked });
                      }}
                    />
                  </div>

                  <Separator />

                  <Link
                    href={`/portfolio?studentId=${detailArtifact.studentId}&artifactId=${detailArtifact.id}`}
                    className="flex items-center gap-2 text-[13px] font-medium text-[#c24e3f] hover:underline"
                  >
                    Open in Portfolio
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <IncidentDialog
        open={incidentDialogOpen}
        onOpenChange={setIncidentDialogOpen}
        classId={classId}
      />
    </div>
  );
}
