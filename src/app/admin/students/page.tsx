"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, FileText, Languages, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores";
import { getGradePercentage, isGradeComplete } from "@/lib/grade-helpers";
import { AdminDetailDrawer, AdminKpiCard, AdminPanel, AdminRowLink } from "@/features/admin/components/admin-ui";

function getStudentPrimaryClassId(classIds: string[], classMap: Map<string, { id: string; name: string; type: string; programme: string }>) {
  const homeroom = classIds.find((classId) => classMap.get(classId)?.type === "homeroom");
  return homeroom ?? classIds[0] ?? null;
}

export default function AdminStudentsPage() {
  const students = useStore((store) => store.students);
  const classes = useStore((store) => store.classes);
  const assessments = useStore((store) => store.assessments);
  const grades = useStore((store) => store.grades);
  const attendanceSessions = useStore((store) => store.attendanceSessions);
  const reports = useStore((store) => store.reports);

  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const classMap = useMemo(
    () =>
      new Map(
        classes.map((cls) => [cls.id, { id: cls.id, name: cls.name, type: cls.type, programme: cls.programme }])
      ),
    [classes]
  );

  const studentRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return students
      .map((student) => {
        const primaryClassId = getStudentPrimaryClassId(student.classIds, classMap);
        const primaryClass = primaryClassId ? classMap.get(primaryClassId) : null;
        const studentGrades = grades.filter((grade) => grade.studentId === student.id);
        const gradePercentages = studentGrades
          .map((grade) => {
            const assessment = assessments.find((entry) => entry.id === grade.assessmentId);
            if (!assessment || !isGradeComplete(grade, assessment)) return null;
            return getGradePercentage(grade, assessment);
          })
          .filter((value): value is number => typeof value === "number");
        const average = gradePercentages.length
          ? Math.round(gradePercentages.reduce((sum, value) => sum + value, 0) / gradePercentages.length)
          : null;
        const attendanceRecords = attendanceSessions.flatMap((session) =>
          session.records.filter((record) => record.studentId === student.id)
        );
        const attendanceRate = attendanceRecords.length
          ? Math.round(
              (attendanceRecords.filter((record) => record.status === "present").length /
                attendanceRecords.length) *
                100
            )
          : null;
        const distributedReports = reports.filter(
          (report) => report.studentId === student.id && report.distributionStatus === "completed"
        ).length;
        return {
          student,
          primaryClassId,
          primaryClass,
          programme: primaryClass?.programme ?? "MYP",
          average,
          attendanceRate,
          distributedReports,
        };
      })
      .filter((row) => {
        if (programmeFilter !== "all" && row.programme !== programmeFilter) return false;
        if (classFilter !== "all" && row.primaryClassId !== classFilter) return false;
        if (!normalized) return true;
        return [
          row.student.firstName,
          row.student.lastName,
          row.student.gradeLevel,
          row.primaryClass?.name ?? "",
          row.student.preferredLanguage,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      });
  }, [assessments, attendanceSessions, classFilter, classMap, grades, programmeFilter, query, reports, students]);

  const selectedRow = studentRows.find((row) => row.student.id === selectedStudentId) ?? null;

  const summary = useMemo(() => {
    return {
      students: students.length,
      distributedReports: reports.filter((report) => report.distributionStatus === "completed").length,
      averageAttendance: studentRows.length
        ? Math.round(
            studentRows.reduce((sum, row) => sum + (row.attendanceRate ?? 0), 0) /
              studentRows.filter((row) => row.attendanceRate !== null).length
          )
        : null,
      languages: new Set(students.map((student) => student.preferredLanguage)).size,
    };
  }, [reports, studentRows, students]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master student directory"
        description="Browse the live seeded student records across the school, then open any learner directly in the existing student profile surface."
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
            <SelectTrigger className="h-9 w-[140px] bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programmes</SelectItem>
              <SelectItem value="PYP">PYP</SelectItem>
              <SelectItem value="MYP">MYP</SelectItem>
              <SelectItem value="DP">DP</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-9 w-[220px] bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search students, grade levels, classes, or languages"
            className="h-9 max-w-[320px] bg-white text-[13px]"
          />
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <AdminKpiCard label="Students" value={String(summary.students)} detail="Pulled from the live seeded prototype store" delta="Openable in live profile view" tone="peach" icon={Users} />
        <AdminKpiCard label="Distributed reports" value={String(summary.distributedReports)} detail="Completed family-visible report records" delta="Read-only preview from live reports" tone="success" icon={FileText} />
        <AdminKpiCard label="Average attendance" value={summary.averageAttendance ? `${summary.averageAttendance}%` : "N/A"} detail="Across students in the current filter set" delta="Live attendance sessions" tone="info" icon={BarChart3} />
        <AdminKpiCard label="Family languages" value={String(summary.languages)} detail="Visible language context from student records" delta="Useful for communications follow-up" tone="warning" icon={Languages} />
      </div>

      <AdminPanel title="Student directory" description="This route reuses the live student profile surface rather than rebuilding a parallel admin-only learner detail page.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Primary class</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Language</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentRows.map((row) => (
              <TableRow key={row.student.id}>
                <TableCell className="whitespace-normal">
                  <div>
                    <p className="font-medium text-foreground">
                      {row.student.firstName} {row.student.lastName}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{row.student.gradeLevel}</p>
                  </div>
                </TableCell>
                <TableCell>{row.programme}</TableCell>
                <TableCell>{row.primaryClass?.name ?? "Not assigned"}</TableCell>
                <TableCell>{row.attendanceRate !== null ? `${row.attendanceRate}%` : "N/A"}</TableCell>
                <TableCell>{row.average !== null ? `${row.average}%` : "N/A"}</TableCell>
                <TableCell>{row.distributedReports}</TableCell>
                <TableCell>{row.student.preferredLanguage}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <AdminRowLink label="Preview" onClick={() => setSelectedStudentId(row.student.id)} />
                    <Button asChild size="sm">
                      <Link href={`/admin/students/${row.student.id}${row.primaryClassId ? `?classId=${row.primaryClassId}` : ""}`}>
                        Open workspace
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPanel>

      <AdminDetailDrawer
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null);
        }}
        title={selectedRow ? `${selectedRow.student.firstName} ${selectedRow.student.lastName}` : "Student preview"}
        description={selectedRow ? `${selectedRow.student.gradeLevel} · ${selectedRow.primaryClass?.name ?? "No primary class"}` : undefined}
        primaryLabel="Open admin workspace"
        onPrimary={() => {
          if (!selectedRow) return;
          window.location.href = `/admin/students/${selectedRow.student.id}${selectedRow.primaryClassId ? `?classId=${selectedRow.primaryClassId}` : ""}`;
        }}
      >
        {selectedRow ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Attendance</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">
                  {selectedRow.attendanceRate !== null ? `${selectedRow.attendanceRate}%` : "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Average</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">
                  {selectedRow.average !== null ? `${selectedRow.average}%` : "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Reports</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedRow.distributedReports}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Family context</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Preferred language: {selectedRow.student.preferredLanguage}. Parent contact: {selectedRow.student.parentName} ({selectedRow.student.parentEmail}).
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Why this route exists</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Admin can stay in a school-wide directory here, then jump into the existing live student profile to reuse the seeded grades, attendance, reports, support context, and portfolio surfaces already in the prototype.
              </p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
