"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { IncidentDialog } from "@/components/shared/incident-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function ClassHubPage() {
  const params = useParams();
  const classId = params.classId as string;
  const loading = useMockLoading([classId]);

  const getClassById = useStore((s) => s.getClassById);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const getAssessmentsByClassId = useStore((s) => s.getAssessmentsByClassId);
  const grades = useStore((s) => s.grades);
  const getArtifactsByClass = useStore((s) => s.getArtifactsByClass);
  const getSessionsByClass = useStore((s) => s.getSessionsByClass);
  const getAnnouncementsByClass = useStore((s) => s.getAnnouncementsByClass);

  const cls = getClassById(classId);
  const students = getStudentsByClassId(classId);
  const assessments = getAssessmentsByClassId(classId);
  const artifacts = getArtifactsByClass(classId);
  const sessions = getSessionsByClass(classId);
  const announcements = getAnnouncementsByClass(classId);

  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);

  if (loading) return <DetailSkeleton />;
  if (!cls) return <EmptyState icon={AlertCircle} title="Class not found" description="This class doesn't exist." />;

  const publishedAssessments = assessments.filter((a) => a.status === "published");
  const avgGrade = (() => {
    const classGrades = grades.filter((g) => g.classId === classId && g.score != null && !g.isMissing);
    if (classGrades.length === 0) return "N/A";
    const avg = classGrades.reduce((sum, g) => sum + (g.score || 0), 0) / classGrades.length;
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
              {students.slice(0, 24).map((student) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-[#c24e3f]/10 flex items-center justify-center text-[11px] font-semibold text-[#c24e3f]">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
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
            <p className="text-[13px] text-muted-foreground mb-4">Grade snapshot for {cls.name}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Student</th>
                    {publishedAssessments.slice(0, 6).map((a) => (
                      <th key={a.id} className="text-center py-2 px-2 font-medium text-muted-foreground max-w-[80px] truncate" title={a.title}>
                        {a.title.slice(0, 12)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 15).map((student) => (
                    <tr key={student.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 pr-4">
                        <Link href={`/students/${student.id}`} className="text-[13px] font-medium hover:text-[#c24e3f]">
                          {student.firstName} {student.lastName}
                        </Link>
                      </td>
                      {publishedAssessments.slice(0, 6).map((asmt) => {
                        const grade = grades.find(
                          (g) => g.assessmentId === asmt.id && g.studentId === student.id
                        );
                        return (
                          <td key={asmt.id} className="text-center py-2 px-2">
                            {grade ? (
                              grade.isMissing ? (
                                <span className="text-[#dc2626] text-[12px] font-medium">Missing</span>
                              ) : grade.score != null ? (
                                <span className="text-[12px]">{grade.score}%</span>
                              ) : grade.dpGrade != null ? (
                                <span className="text-[12px]">{grade.dpGrade}/7</span>
                              ) : grade.mypCriteriaScores?.length ? (
                                <span className="text-[12px]">
                                  {Math.round(grade.mypCriteriaScores.reduce((s, c) => s + c.level, 0) / grade.mypCriteriaScores.length)}/8
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[12px]">-</span>
                              )
                            ) : (
                              <span className="text-muted-foreground text-[12px]">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
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
                  <Card key={artifact.id} className="p-4 gap-0">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[14px] font-medium truncate flex-1">{artifact.title}</p>
                      <StatusBadge status={artifact.approvalStatus} />
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-2">
                      {student?.firstName} {student?.lastName} · {artifact.mediaType}
                    </p>
                    <p className="text-[12px] text-muted-foreground truncate">{artifact.description}</p>
                  </Card>
                );
              })}
            </div>
          )}
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

      <IncidentDialog
        open={incidentDialogOpen}
        onOpenChange={setIncidentDialogOpen}
        classId={classId}
      />
    </div>
  );
}
