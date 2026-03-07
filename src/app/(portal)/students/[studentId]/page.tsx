"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
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
  AlertCircle,
  BookOpen,
  Clock,
  ClipboardCheck,
  FolderOpen,
  FileText,
  Shield,
  ShieldAlert,
  Users,
  Mail,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { generateId } from "@/services/mock-service";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { GradeRecord } from "@/types/gradebook";
import { getGradePercentage, getGradeCellDisplay, isGradeComplete, getStudentAssessmentStatus } from "@/lib/grade-helpers";
import { StudentStandardsTab } from "@/components/student-tabs/student-standards-tab";

export default function StudentProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const urlClassId = searchParams.get("classId");
  const loading = useMockLoading([studentId]);

  const getStudentById = useStore((s) => s.getStudentById);
  const classes = useStore((s) => s.classes);
  const getGradesByStudent = useStore((s) => s.getGradesByStudent);
  const assessments = useStore((s) => s.assessments);
  const getArtifactsByStudent = useStore((s) => s.getArtifactsByStudent);
  const getSessionsByStudent = useStore((s) => s.getSessionsByStudent);
  const getReportsByStudent = useStore((s) => s.getReportsByStudent);
  const reportCycles = useStore((s) => s.reportCycles);
  const getIncidentsByStudent = useStore((s) => s.getIncidentsByStudent);
  const getSupportPlansByStudent = useStore((s) => s.getSupportPlansByStudent);
  const updateArtifact = useStore((s) => s.updateArtifact);
  const updateStudent = useStore((s) => s.updateStudent);
  const students = useStore((s) => s.students);

  const student = getStudentById(studentId);
  const studentGrades = getGradesByStudent(studentId);
  const artifacts = getArtifactsByStudent(studentId);
  const sessions = getSessionsByStudent(studentId);
  const reports = getReportsByStudent(studentId);
  const incidents = getIncidentsByStudent(studentId);
  const supportPlans = getSupportPlansByStudent(studentId);

  const learningGoals = useStore((s) => s.learningGoals);

  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(urlTab || "overview");

  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [detailArtifact, setDetailArtifact] = useState<PortfolioArtifact | null>(null);
  const [detailGrade, setDetailGrade] = useState<GradeRecord | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(urlClassId);
  const [teacherComment, setTeacherComment] = useState("");
  const [studentReflectionText, setStudentReflectionText] = useState("");

  if (loading) return <DetailSkeleton />;
  if (!student)
    return (
      <EmptyState
        icon={AlertCircle}
        title="Student not found"
        description="This student doesn't exist."
      />
    );

  const studentClasses = classes.filter((c) =>
    student.classIds.includes(c.id)
  );

  // Validate classFilter against the student's actual classes
  const validClassFilter = classFilter && student.classIds.includes(classFilter) ? classFilter : null;

  const handleClassFilterChange = (value: string) => {
    const newClassId = value === "all" ? null : value;
    setClassFilter(newClassId);
    const newParams = new URLSearchParams(searchParams.toString());
    if (newClassId) {
      newParams.set("classId", newClassId);
    } else {
      newParams.delete("classId");
    }
    const qs = newParams.toString();
    router.replace(`/students/${studentId}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  // Filtered data for class-scoped tabs
  const filteredGrades = validClassFilter
    ? studentGrades.filter((g) => g.classId === validClassFilter)
    : studentGrades;
  const filteredArtifacts = validClassFilter
    ? artifacts.filter((a) => a.classId === validClassFilter)
    : artifacts;
  const filteredSessions = validClassFilter
    ? sessions.filter((s) => s.classId === validClassFilter)
    : sessions;

  // Calculate stats (using filtered data)
  const avgGrade = (() => {
    const percentages: number[] = [];
    filteredGrades.forEach((g) => {
      const asmt = assessments.find((a) => a.id === g.assessmentId);
      if (!asmt) return;
      if (!isGradeComplete(g, asmt)) return;
      const pct = getGradePercentage(g, asmt);
      if (pct !== null) percentages.push(pct);
    });
    if (percentages.length === 0) return "N/A";
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    return `${Math.round(avg)}%`;
  })();

  const attendanceRate = (() => {
    let present = 0;
    let total = 0;
    filteredSessions.forEach((s) => {
      const record = s.records.find((r) => r.studentId === studentId);
      if (record) {
        total++;
        if (record.status === "present") present++;
      }
    });
    return total > 0 ? `${Math.round((present / total) * 100)}%` : "N/A";
  })();

  const openIncidents = incidents.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  ).length;

  // Portfolio action handlers
  const openArtifactDetail = (artifact: PortfolioArtifact) => {
    setDetailArtifact(artifact);
    setTeacherComment(artifact.reflection?.teacherComment || "");
    setStudentReflectionText(artifact.reflection?.text || "");
  };

  const handleApprove = (id: string) => {
    updateArtifact(id, { approvalStatus: "approved", updatedAt: new Date().toISOString() });
    toast.success("Artifact approved");
    if (detailArtifact?.id === id) {
      setDetailArtifact({ ...detailArtifact, approvalStatus: "approved" });
    }
  };

  const handleRequestRevision = (id: string) => {
    updateArtifact(id, { approvalStatus: "needs_revision", familyShareStatus: "not_shared", updatedAt: new Date().toISOString() });
    toast.info("Revision requested — family share revoked");
    if (detailArtifact?.id === id) {
      setDetailArtifact({ ...detailArtifact, approvalStatus: "needs_revision", familyShareStatus: "not_shared" });
    }
  };

  const handleSaveTeacherComment = () => {
    if (!detailArtifact || !teacherComment.trim()) return;
    const now = new Date().toISOString();
    updateArtifact(detailArtifact.id, {
      reflection: {
        ...(detailArtifact.reflection || { text: "", submittedAt: now }),
        teacherComment: teacherComment.trim(),
        teacherCommentAt: now,
      },
      updatedAt: now,
    });
    toast.success("Comment saved");
  };

  const handleSaveStudentReflection = () => {
    if (!detailArtifact) return;
    const now = new Date().toISOString();
    updateArtifact(detailArtifact.id, {
      reflection: {
        text: studentReflectionText.trim(),
        submittedAt: detailArtifact.reflection?.submittedAt || now,
        teacherComment: detailArtifact.reflection?.teacherComment,
        teacherCommentAt: detailArtifact.reflection?.teacherCommentAt,
      },
      updatedAt: now,
    });
    setDetailArtifact({
      ...detailArtifact,
      reflection: {
        text: studentReflectionText.trim(),
        submittedAt: detailArtifact.reflection?.submittedAt || now,
        teacherComment: detailArtifact.reflection?.teacherComment,
        teacherCommentAt: detailArtifact.reflection?.teacherCommentAt,
      },
    });
    toast.success("Student reflection saved");
  };

  const handleToggleFamilyShare = (checked: boolean) => {
    if (!detailArtifact) return;
    const now = new Date().toISOString();
    const status = checked ? "shared" : "not_shared";
    updateArtifact(detailArtifact.id, { familyShareStatus: status, updatedAt: now });
    setDetailArtifact({ ...detailArtifact, familyShareStatus: status });

    if (checked) {
      const stu = students.find((s) => s.id === detailArtifact.studentId);
      if (stu) {
        const record = {
          id: generateId("fsr"),
          type: "portfolio" as const,
          referenceId: detailArtifact.id,
          sharedAt: now,
          status: "shared" as const,
        };
        updateStudent(stu.id, {
          familyShareHistory: [...(stu.familyShareHistory || []), record],
        });
      }
    }

    toast.success(checked ? "Shared with family" : "Family sharing removed");
  };

  const handleToggleReportEligible = (checked: boolean) => {
    if (!detailArtifact) return;
    updateArtifact(detailArtifact.id, { isReportEligible: checked, updatedAt: new Date().toISOString() });
    setDetailArtifact({ ...detailArtifact, isReportEligible: checked });
    toast.success(checked ? "Added to report" : "Removed from report");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="h-12 w-12">
          {student.avatarUrl && <AvatarImage src={student.avatarUrl} alt={`${student.firstName} ${student.lastName}`} />}
          <AvatarFallback className="text-[16px] font-semibold bg-[#c24e3f]/10 text-[#c24e3f]">
            {student.firstName[0]}{student.lastName[0]}
          </AvatarFallback>
        </Avatar>
      </div>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={student.gradeLevel}
      >
        <div className="flex gap-2 mt-2">
          {studentClasses.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                {cls.name}
              </Badge>
            </Link>
          ))}
        </div>
      </PageHeader>

      {studentClasses.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[13px] text-muted-foreground">Viewing:</span>
          <Select value={validClassFilter || "all"} onValueChange={handleClassFilterChange}>
            <SelectTrigger className="w-[240px] h-8 text-[13px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {studentClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="family">Family Share</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Avg grade" value={avgGrade} icon={BookOpen} />
            <StatCard
              label="Attendance"
              value={attendanceRate}
              icon={Clock}
            />
            <StatCard
              label="Portfolio items"
              value={filteredArtifacts.length}
              icon={FolderOpen}
            />
            <StatCard
              label="Open incidents"
              value={openIncidents}
              icon={Shield}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 gap-0">
              <h3 className="text-[16px] font-semibold mb-3">Classes</h3>
              <div className="space-y-2">
                {studentClasses.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/classes/${cls.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="text-[13px] font-medium">{cls.name}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {cls.subject} &middot; {cls.programme}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {cls.type}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-5 gap-0">
              <h3 className="text-[16px] font-semibold mb-3">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px]">{student.parentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] text-muted-foreground">
                    {student.parentEmail}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] text-muted-foreground">
                    Preferred language: {student.preferredLanguage}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Grades ── */}
        <TabsContent value="grades">
          {filteredGrades.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No grades yet"
              description="Grades will appear here once assessments are graded."
            />
          ) : (
            <Card className="p-5 gap-0">
              <p className="text-[13px] text-muted-foreground mb-4">
                {validClassFilter
                  ? `Grades in ${studentClasses.find((c) => c.id === validClassFilter)?.name ?? "class"}`
                  : `All grades for ${student.firstName}`}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                        Assessment
                      </th>
                      {!validClassFilter && (
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                          Class
                        </th>
                      )}
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                        Score
                      </th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.map((grade) => {
                      const asmt = assessments.find(
                        (a) => a.id === grade.assessmentId
                      );
                      const cls = classes.find(
                        (c) => c.id === grade.classId
                      );
                      const display = asmt ? getGradeCellDisplay(grade, asmt) : "—";
                      return (
                        <tr
                          key={grade.id}
                          className="border-b border-border/50 hover:bg-muted/30"
                        >
                          <td className="py-2 pr-4">
                            <button
                              onClick={() => setDetailGrade(grade)}
                              className="text-[13px] font-medium hover:text-[#c24e3f] text-left"
                            >
                              {asmt?.title || "Unknown"}
                            </button>
                          </td>
                          {!validClassFilter && (
                            <td className="py-2 px-2 text-muted-foreground">
                              {cls?.name || "—"}
                            </td>
                          )}
                          <td className="text-center py-2 px-2">
                            <span className={`font-medium ${grade.submissionStatus === "missing" ? "text-[#dc2626]" : "text-foreground"}`}>
                              {display}
                            </span>
                          </td>
                          <td className="text-center py-2 px-2">
                            {(() => {
                              const asmtForStatus = assessments.find((a) => a.id === grade.assessmentId);
                              if (!asmtForStatus) return <StatusBadge status="pending" />;
                              const status = getStudentAssessmentStatus(grade, asmtForStatus);
                              return <StatusBadge status={status} />;
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── Standards ── */}
        <TabsContent value="standards">
          <StudentStandardsTab
            studentId={studentId}
            grades={filteredGrades}
            assessments={assessments}
            learningGoals={learningGoals}
            classFilter={validClassFilter}
            classes={studentClasses}
          />
        </TabsContent>

        {/* ── Portfolio ── */}
        <TabsContent value="portfolio">
          {filteredArtifacts.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No portfolio items"
              description="Portfolio artifacts will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArtifacts.map((artifact) => (
                <Card
                  key={artifact.id}
                  className="p-4 gap-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => openArtifactDetail(artifact)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-[14px] font-medium truncate flex-1">
                      {artifact.title}
                    </p>
                    <StatusBadge status={artifact.approvalStatus} />
                  </div>
                  <p className="text-[12px] text-muted-foreground mb-1">
                    {artifact.mediaType} &middot;{" "}
                    {format(parseISO(artifact.createdAt), "MMM d, yyyy")}
                  </p>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {artifact.description}
                  </p>
                  {artifact.learningGoalIds.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {artifact.learningGoalIds.slice(0, 3).map((gId) => (
                        <Badge
                          key={gId}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {gId}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Attendance ── */}
        <TabsContent value="attendance">
          {filteredSessions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No attendance records"
              description="Attendance records will appear here."
            />
          ) : (
            <Card className="p-5 gap-0">
              <div className="flex items-center gap-4 mb-4">
                <p className="text-[13px] text-muted-foreground">
                  Attendance rate: <span className="font-semibold text-foreground">{attendanceRate}</span>
                </p>
              </div>
              <div className="space-y-1">
                {filteredSessions
                  .slice(-20)
                  .reverse()
                  .map((session) => {
                    const record = session.records.find(
                      (r) => r.studentId === studentId
                    );
                    const cls = classes.find(
                      (c) => c.id === session.classId
                    );
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-medium w-[100px]">
                            {format(parseISO(session.date), "MMM d")}
                          </span>
                          <span className="text-[12px] text-muted-foreground">
                            {cls?.name}
                          </span>
                        </div>
                        {record && (
                          <StatusBadge status={record.status} />
                        )}
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── Reports ── */}
        <TabsContent value="reports">
          {reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports"
              description="Student reports will appear here."
            />
          ) : (
            <div className="space-y-2">
              {reports.map((report) => {
                const cycle = reportCycles.find(
                  (c) => c.id === report.cycleId
                );
                const cls = classes.find((c) => c.id === report.classId);
                return (
                  <Link key={report.id} href={`/reports/${report.id}`}>
                    <Card className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[14px] font-medium">
                            {cycle?.name || "Report"}
                          </p>
                          <p className="text-[12px] text-muted-foreground">
                            {cls?.name} &middot; {cls?.subject}
                          </p>
                        </div>
                        <StatusBadge status={report.publishState} />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Support ── */}
        <TabsContent value="support">
          <div className="space-y-6">
            {/* Incidents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-semibold">Incidents</h3>
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
              {incidents.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No incidents"
                  description="No incidents recorded for this student."
                />
              ) : (
                <div className="space-y-2">
                  {incidents.map((inc) => (
                    <Card key={inc.id} className="p-4 gap-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[14px] font-medium">{inc.title}</p>
                        <div className="flex gap-2">
                          <StatusBadge status={inc.severity} />
                          <StatusBadge status={inc.status} />
                        </div>
                      </div>
                      <p className="text-[12px] text-muted-foreground">
                        {inc.category} &middot; Reported{" "}
                        {format(parseISO(inc.reportedAt), "MMM d, yyyy")}
                      </p>
                      {inc.followUps.length > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {inc.followUps.length} follow-up
                          {inc.followUps.length !== 1 && "s"}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Support Plans */}
            <div>
              <h3 className="text-[16px] font-semibold mb-3">Support Plans</h3>
              {supportPlans.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No support plans"
                  description="Support plans will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {supportPlans.map((plan) => (
                    <Card key={plan.id} className="p-4 gap-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[14px] font-medium">{plan.title}</p>
                        <StatusBadge status={plan.status} />
                      </div>
                      <p className="text-[12px] text-muted-foreground mb-2">
                        {plan.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Next check-in: {format(parseISO(plan.nextCheckIn), "MMM d, yyyy")}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Family Share ── */}
        <TabsContent value="family">
          {student.familyShareHistory.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No shared items"
              description="Items shared with family will appear here."
            />
          ) : (
            <Card className="p-5 gap-0">
              <p className="text-[13px] text-muted-foreground mb-4">
                Items shared with {student.parentName}
              </p>
              <div className="space-y-2">
                {student.familyShareHistory.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="text-[13px] font-medium capitalize">
                        {share.type}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Shared{" "}
                        {format(parseISO(share.sharedAt), "MMM d, yyyy")}
                        {share.viewedAt &&
                          ` · Viewed ${format(parseISO(share.viewedAt), "MMM d")}`}
                      </p>
                    </div>
                    <StatusBadge status={share.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <IncidentDialog
        open={incidentDialogOpen}
        onOpenChange={setIncidentDialogOpen}
        studentId={studentId}
      />

      {/* ── Portfolio artifact detail Sheet ── */}
      <Sheet open={!!detailArtifact} onOpenChange={(open) => { if (!open) setDetailArtifact(null); }}>
        <SheetContent className="w-full sm:max-w-[480px]">
          {detailArtifact && (() => {
            const cls = classes.find((c) => c.id === detailArtifact.classId);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-[16px]">{detailArtifact.title}</SheetTitle>
                  <SheetDescription className="text-[13px]">
                    {student.firstName} {student.lastName} &middot; {cls?.name || "Unknown class"}
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

                  {/* Student reflection (editable) */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Student reflection</h4>
                    </div>
                    {detailArtifact.reflection?.text && detailArtifact.reflection.submittedAt && (
                      <p className="text-[11px] text-muted-foreground mb-1.5">
                        Submitted {format(parseISO(detailArtifact.reflection.submittedAt), "MMM d, yyyy")}
                      </p>
                    )}
                    <Textarea
                      value={studentReflectionText}
                      onChange={(e) => setStudentReflectionText(e.target.value)}
                      placeholder="Add or edit student reflection..."
                      className="text-[13px] min-h-[70px]"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-[12px]"
                      onClick={handleSaveStudentReflection}
                      disabled={!studentReflectionText.trim()}
                    >
                      Save reflection
                    </Button>
                  </div>

                  {/* Teacher comment (editable) */}
                  <div>
                    <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Teacher comment</h4>
                    <Textarea
                      value={teacherComment}
                      onChange={(e) => setTeacherComment(e.target.value)}
                      placeholder="Add your feedback for this artifact..."
                      className="text-[13px] min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-[12px]"
                      onClick={handleSaveTeacherComment}
                      disabled={!teacherComment.trim()}
                    >
                      Save comment
                    </Button>
                  </div>

                  <Separator />

                  {/* Toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium">Share with family</p>
                        <p className="text-[12px] text-muted-foreground">Make this artifact visible to parents</p>
                      </div>
                      <Switch
                        checked={detailArtifact.familyShareStatus !== "not_shared"}
                        onCheckedChange={handleToggleFamilyShare}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium">Add to report</p>
                        <p className="text-[12px] text-muted-foreground">Include as evidence in student report</p>
                      </div>
                      <Switch
                        checked={detailArtifact.isReportEligible}
                        onCheckedChange={handleToggleReportEligible}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Approval actions */}
                  {detailArtifact.approvalStatus === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleApprove(detailArtifact.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRequestRevision(detailArtifact.id)}>
                        Request revision
                      </Button>
                    </div>
                  )}
                  {detailArtifact.approvalStatus !== "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          updateArtifact(detailArtifact.id, { approvalStatus: "pending", familyShareStatus: "not_shared", updatedAt: new Date().toISOString() });
                          setDetailArtifact({ ...detailArtifact, approvalStatus: "pending", familyShareStatus: "not_shared" });
                          toast.info("Status reset to pending — family share revoked");
                        }}
                      >
                        Reset to pending
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <Link
                    href={`/portfolio?studentId=${studentId}&artifactId=${detailArtifact.id}`}
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

      {/* ── Assessment grade detail Sheet ── */}
      <Sheet open={!!detailGrade} onOpenChange={(open) => { if (!open) setDetailGrade(null); }}>
        <SheetContent className="w-full sm:max-w-[480px]">
          {detailGrade && (() => {
            const asmt = assessments.find((a) => a.id === detailGrade.assessmentId);
            const cls = classes.find((c) => c.id === detailGrade.classId);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-[16px]">{asmt?.title || "Assessment"}</SheetTitle>
                  <SheetDescription className="text-[13px]">
                    {student.firstName} {student.lastName} &middot; {cls?.name || "Unknown class"}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 mt-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const dAsmt = assessments.find((a) => a.id === detailGrade.assessmentId);
                      if (!dAsmt) return <StatusBadge status="pending" />;
                      const status = getStudentAssessmentStatus(detailGrade, dAsmt);
                      return <StatusBadge status={status} />;
                    })()}
                    {asmt && (
                      <Badge variant="outline" className="text-[11px]">
                        {asmt.gradingMode.replace("_", " ")}
                      </Badge>
                    )}
                    {asmt && (
                      <span className="text-[12px] text-muted-foreground">
                        Due {format(parseISO(asmt.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  <Separator />

                  {detailGrade.submissionStatus === "missing" ? (
                    <div className="rounded-lg bg-[#fee2e2] p-4">
                      <p className="text-[14px] font-semibold text-[#dc2626]">Missing</p>
                      <p className="text-[12px] text-[#dc2626]/80">This assessment was not submitted.</p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Grade</h4>
                      {detailGrade.score != null && (
                        <div className="rounded-lg bg-muted/50 p-4">
                          <p className="text-[24px] font-bold">{detailGrade.score}%</p>
                          {detailGrade.totalPoints != null && (
                            <p className="text-[12px] text-muted-foreground">{detailGrade.score} / {detailGrade.totalPoints} points</p>
                          )}
                        </div>
                      )}
                      {detailGrade.dpGrade != null && (
                        <div className="rounded-lg bg-muted/50 p-4">
                          <p className="text-[24px] font-bold">{detailGrade.dpGrade}<span className="text-[14px] text-muted-foreground font-normal">/7</span></p>
                        </div>
                      )}
                      {detailGrade.mypCriteriaScores && detailGrade.mypCriteriaScores.length > 0 && (
                        <div className="space-y-2">
                          {detailGrade.mypCriteriaScores.map((c) => (
                            <div key={c.criterion} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                              <span className="text-[13px] font-medium">Criterion {c.criterion}</span>
                              <span className="text-[14px] font-bold">{c.level}<span className="text-[12px] text-muted-foreground font-normal">/8</span></span>
                            </div>
                          ))}
                          {(() => {
                            const assessed = detailGrade.mypCriteriaScores.filter((c) => c.level > 0);
                            if (assessed.length === 0) return null;
                            const avg = assessed.reduce((s, c) => s + c.level, 0) / assessed.length;
                            return (
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[12px] text-muted-foreground">Average</span>
                                <span className="text-[13px] font-semibold">{avg.toFixed(1)}/8</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {detailGrade.feedback && (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Teacher feedback</h4>
                      <p className="text-[13px] text-foreground bg-muted/50 rounded-lg p-3">
                        {detailGrade.feedback}
                      </p>
                    </div>
                  )}

                  {detailGrade.gradedAt && (
                    <p className="text-[12px] text-muted-foreground">
                      Graded {format(parseISO(detailGrade.gradedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}

                  <Separator />

                  <Link
                    href={`/assessments/${detailGrade.assessmentId}?studentId=${studentId}`}
                    className="flex items-center gap-2 text-[13px] font-medium text-[#c24e3f] hover:underline"
                  >
                    Open in Assessments
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
