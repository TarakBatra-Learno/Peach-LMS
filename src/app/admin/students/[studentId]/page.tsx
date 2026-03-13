"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BarChart3, FileText, Languages, UserRound } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useStore } from "@/stores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminLiveEmbed } from "@/features/admin/components/admin-live-embed";
import { AdminKpiCard, AdminToneBadge } from "@/features/admin/components/admin-ui";
import { getGradePercentage, isGradeComplete } from "@/lib/grade-helpers";

export default function AdminStudentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  const classId = searchParams.get("classId");
  const tab = searchParams.get("tab");

  const getStudentById = useStore((store) => store.getStudentById);
  const classes = useStore((store) => store.classes);
  const grades = useStore((store) => store.grades);
  const assessments = useStore((store) => store.assessments);
  const attendanceSessions = useStore((store) => store.attendanceSessions);
  const reports = useStore((store) => store.reports);

  const student = getStudentById(studentId);

  const studentClasses = useMemo(() => {
    if (!student) return [];
    return classes.filter((cls) => student.classIds.includes(cls.id));
  }, [classes, student]);

  const average = useMemo(() => {
    const studentGrades = grades.filter((grade) => grade.studentId === studentId);
    const percentages = studentGrades
      .map((grade) => {
        const assessment = assessments.find((entry) => entry.id === grade.assessmentId);
        if (!assessment || !isGradeComplete(grade, assessment)) return null;
        return getGradePercentage(grade, assessment);
      })
      .filter((value): value is number => typeof value === "number");
    if (percentages.length === 0) return null;
    return Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length);
  }, [assessments, grades, studentId]);

  const attendanceRate = useMemo(() => {
    const records = attendanceSessions.flatMap((session) =>
      session.records.filter((record) => record.studentId === studentId)
    );
    if (records.length === 0) return null;
    return Math.round(
      (records.filter((record) => record.status === "present").length / records.length) * 100
    );
  }, [attendanceSessions, studentId]);

  const distributedReports = reports.filter(
    (report) => report.studentId === studentId && report.distributionStatus === "completed"
  ).length;

  if (!student) {
    return (
      <EmptyState
        icon={UserRound}
        title="Student not found"
        description="This student is not available in the seeded prototype data."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`${student.gradeLevel} · Embedded live student profile`}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{student.preferredLanguage}</Badge>
          <AdminToneBadge tone="peach">Admin workspace</AdminToneBadge>
          {studentClasses.map((cls) => (
            <Button key={cls.id} asChild variant="outline" size="sm">
              <Link href={`/admin/classes/${cls.id}`}>
                {cls.name}
              </Link>
            </Button>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <AdminKpiCard label="Attendance" value={attendanceRate !== null ? `${attendanceRate}%` : "N/A"} detail="From the live attendance sessions" delta="Same data as teacher profile" tone="info" icon={BarChart3} />
        <AdminKpiCard label="Average grade" value={average !== null ? `${average}%` : "N/A"} detail="From completed seeded grading records" delta="Read-only oversight context" tone="success" icon={BarChart3} />
        <AdminKpiCard label="Distributed reports" value={String(distributedReports)} detail="Family-visible completed report records" delta="Live report distribution state" tone="warning" icon={FileText} />
        <AdminKpiCard label="Family language" value={student.preferredLanguage} detail={`${student.parentName} · ${student.parentEmail}`} delta="Useful for communications follow-up" tone="peach" icon={Languages} />
      </div>

      <Card className="p-5 shadow-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight">Embedded live student profile</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              This is the existing student profile surface inside the admin shell, so admins keep their navigation while seeing the real seeded learner context.
            </p>
          </div>
          {classId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/classes/${classId}`}>Back to class roster</Link>
            </Button>
          ) : null}
        </div>
        <AdminLiveEmbed
          title="Live student profile"
          src={`/students/${studentId}?embed=1${classId ? `&classId=${classId}` : ""}${tab ? `&tab=${tab}` : ""}`}
          minHeight={1380}
        />
      </Card>
    </div>
  );
}
