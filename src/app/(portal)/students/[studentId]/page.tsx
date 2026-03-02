"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
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

  const student = getStudentById(studentId);
  const studentGrades = getGradesByStudent(studentId);
  const artifacts = getArtifactsByStudent(studentId);
  const sessions = getSessionsByStudent(studentId);
  const reports = getReportsByStudent(studentId);
  const incidents = getIncidentsByStudent(studentId);
  const supportPlans = getSupportPlansByStudent(studentId);

  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);

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

  // Calculate stats
  const avgGrade = (() => {
    const percentages: number[] = [];
    studentGrades.forEach((g) => {
      if (g.isMissing) return;
      const asmt = assessments.find((a) => a.id === g.assessmentId);
      if (!asmt) return;
      if (asmt.gradingMode === "score" && g.score != null && asmt.totalPoints) {
        percentages.push((g.score / asmt.totalPoints) * 100);
      } else if (asmt.gradingMode === "dp_scale" && g.dpGrade != null) {
        percentages.push((g.dpGrade / 7) * 100);
      } else if (asmt.gradingMode === "myp_criteria" && g.mypCriteriaScores?.length) {
        const assessed = g.mypCriteriaScores.filter((c) => c.level > 0);
        if (assessed.length > 0) {
          const avg = assessed.reduce((s, c) => s + c.level, 0) / assessed.length;
          percentages.push((avg / 8) * 100);
        }
      } else if (g.score != null) {
        percentages.push(g.score);
      }
    });
    if (percentages.length === 0) return "N/A";
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    return `${Math.round(avg)}%`;
  })();

  const attendanceRate = (() => {
    let present = 0;
    let total = 0;
    sessions.forEach((s) => {
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
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
              value={artifacts.length}
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
          {studentGrades.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No grades yet"
              description="Grades will appear here once assessments are graded."
            />
          ) : (
            <Card className="p-5 gap-0">
              <p className="text-[13px] text-muted-foreground mb-4">
                All grades for {student.firstName}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                        Assessment
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                        Class
                      </th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                        Score
                      </th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGrades.map((grade) => {
                      const asmt = assessments.find(
                        (a) => a.id === grade.assessmentId
                      );
                      const cls = classes.find(
                        (c) => c.id === grade.classId
                      );
                      return (
                        <tr
                          key={grade.id}
                          className="border-b border-border/50 hover:bg-muted/30"
                        >
                          <td className="py-2 pr-4">
                            <Link
                              href={`/assessments/${grade.assessmentId}`}
                              className="text-[13px] font-medium hover:text-[#c24e3f]"
                            >
                              {asmt?.title || "Unknown"}
                            </Link>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {cls?.name || "—"}
                          </td>
                          <td className="text-center py-2 px-2">
                            {grade.isMissing ? (
                              <span className="text-[#dc2626] font-medium">
                                Missing
                              </span>
                            ) : grade.score != null ? (
                              <span>{grade.score}%</span>
                            ) : grade.dpGrade != null ? (
                              <span>{grade.dpGrade}/7</span>
                            ) : grade.mypCriteriaScores?.length ? (
                              <span>
                                {Math.round(
                                  grade.mypCriteriaScores.reduce(
                                    (s, c) => s + c.level,
                                    0
                                  ) / grade.mypCriteriaScores.length
                                )}
                                /8
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="text-center py-2 px-2">
                            <StatusBadge
                              status={
                                grade.isMissing
                                  ? "missing"
                                  : grade.score != null ||
                                    grade.dpGrade != null ||
                                    grade.mypCriteriaScores?.length
                                  ? "graded"
                                  : "pending"
                              }
                            />
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

        {/* ── Portfolio ── */}
        <TabsContent value="portfolio">
          {artifacts.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No portfolio items"
              description="Portfolio artifacts will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {artifacts.map((artifact) => (
                <Link key={artifact.id} href="/portfolio">
                <Card className="p-4 gap-0 hover:bg-muted/50 transition-colors cursor-pointer">
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
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Attendance ── */}
        <TabsContent value="attendance">
          {sessions.length === 0 ? (
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
                {sessions
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
    </div>
  );
}
