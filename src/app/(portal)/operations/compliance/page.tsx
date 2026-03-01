"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/stores";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  Download,
  Eye,
  Users,
  GraduationCap,
  ClipboardCheck,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";

function OperationsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 mb-6 border-b border-border">
      {[
        { label: "Attendance", href: "/operations/attendance" },
        { label: "Calendar", href: "/operations/calendar" },
        { label: "Compliance", href: "/operations/compliance" },
      ].map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors",
            pathname === t.href
              ? "border-[#c24e3f] text-[#c24e3f]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CompliancePage() {
  const loading = useMockLoading();
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const grades = useStore((s) => s.grades);
  const assessments = useStore((s) => s.assessments);
  const attendanceSessions = useStore((s) => s.attendanceSessions);
  const getClassById = useStore((s) => s.getClassById);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<"students" | "grades" | "attendance" | null>(null);

  // Student export data
  const studentExportData = useMemo(() => {
    const headers = ["Student ID", "First Name", "Last Name", "Grade Level", "Parent Name", "Parent Email", "Classes"];
    const rows = students.slice(0, 10).map((s) => {
      const classNames = classes
        .filter((c) => c.studentIds.includes(s.id))
        .map((c) => c.name)
        .join("; ");
      return [s.id, s.firstName, s.lastName, s.gradeLevel, s.parentName, s.parentEmail, classNames];
    });
    return { headers, rows, totalRows: students.length };
  }, [students, classes]);

  // Grade export data
  const gradeExportData = useMemo(() => {
    const headers = ["Student", "Assessment", "Class", "Mode", "Score", "Graded At", "Missing"];
    const rows = grades.slice(0, 10).map((g) => {
      const student = students.find((s) => s.id === g.studentId);
      const assessment = assessments.find((a) => a.id === g.assessmentId);
      const cls = getClassById(g.classId);
      const studentName = student ? `${student.firstName} ${student.lastName}` : g.studentId;
      const assessmentTitle = assessment?.title || g.assessmentId;
      const className = cls?.name || g.classId;
      const score = g.score !== undefined ? `${g.score}/${g.totalPoints || ""}` : g.dpGrade !== undefined ? `DP: ${g.dpGrade}` : "-";
      const gradedAt = g.gradedAt ? format(parseISO(g.gradedAt), "MMM d, yyyy") : "-";
      return [studentName, assessmentTitle, className, g.gradingMode, score, gradedAt, g.isMissing ? "Yes" : "No"];
    });
    return { headers, rows, totalRows: grades.length };
  }, [grades, students, assessments, getClassById]);

  // Attendance export data
  const attendanceExportData = useMemo(() => {
    const headers = ["Date", "Class", "Student", "Status", "Note", "Arrived At"];
    const rows: string[][] = [];
    const sessionsToPreview = attendanceSessions.slice(0, 5);
    sessionsToPreview.forEach((session) => {
      const cls = getClassById(session.classId);
      const className = cls?.name || session.classId;
      const dateFormatted = format(parseISO(session.date), "MMM d, yyyy");
      session.records.forEach((record) => {
        const student = students.find((s) => s.id === record.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : record.studentId;
        rows.push([
          dateFormatted,
          className,
          studentName,
          record.status,
          record.note || "",
          record.arrivedAt || "",
        ]);
      });
    });
    const totalRecords = attendanceSessions.reduce((sum, s) => sum + s.records.length, 0);
    return { headers, rows: rows.slice(0, 10), totalRows: totalRecords };
  }, [attendanceSessions, students, getClassById]);

  const handleExportStudents = () => {
    const headers = ["Student ID", "First Name", "Last Name", "Grade Level", "Parent Name", "Parent Email", "Classes"];
    const rows = students.map((s) => {
      const classNames = classes
        .filter((c) => c.studentIds.includes(s.id))
        .map((c) => c.name)
        .join("; ");
      return [s.id, s.firstName, s.lastName, s.gradeLevel, s.parentName, s.parentEmail, classNames];
    });
    downloadCsv(`student-export-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
    toast.success(`Exported ${students.length} students`);
  };

  const handleExportGrades = () => {
    const headers = ["Student", "Assessment", "Class", "Mode", "Score", "Graded At", "Missing"];
    const rows = grades.map((g) => {
      const student = students.find((s) => s.id === g.studentId);
      const assessment = assessments.find((a) => a.id === g.assessmentId);
      const cls = getClassById(g.classId);
      const studentName = student ? `${student.firstName} ${student.lastName}` : g.studentId;
      const assessmentTitle = assessment?.title || g.assessmentId;
      const className = cls?.name || g.classId;
      const score = g.score !== undefined ? `${g.score}/${g.totalPoints || ""}` : g.dpGrade !== undefined ? `DP: ${g.dpGrade}` : "-";
      const gradedAt = g.gradedAt ? format(parseISO(g.gradedAt), "MMM d, yyyy") : "-";
      return [studentName, assessmentTitle, className, g.gradingMode, score, gradedAt, g.isMissing ? "Yes" : "No"];
    });
    downloadCsv(`grade-export-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
    toast.success(`Exported ${grades.length} grade records`);
  };

  const handleExportAttendance = () => {
    const headers = ["Date", "Class", "Student", "Status", "Note", "Arrived At"];
    const rows: string[][] = [];
    attendanceSessions.forEach((session) => {
      const cls = getClassById(session.classId);
      const className = cls?.name || session.classId;
      const dateFormatted = format(parseISO(session.date), "MMM d, yyyy");
      session.records.forEach((record) => {
        const student = students.find((s) => s.id === record.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : record.studentId;
        rows.push([
          dateFormatted,
          className,
          studentName,
          record.status,
          record.note || "",
          record.arrivedAt || "",
        ]);
      });
    });
    downloadCsv(`attendance-export-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
    const totalRecords = rows.length;
    toast.success(`Exported ${totalRecords} attendance records`);
  };

  const getPreviewData = () => {
    switch (previewType) {
      case "students":
        return studentExportData;
      case "grades":
        return gradeExportData;
      case "attendance":
        return attendanceExportData;
      default:
        return { headers: [], rows: [], totalRows: 0 };
    }
  };

  const previewData = getPreviewData();
  const previewTitle =
    previewType === "students"
      ? "Student Data Preview"
      : previewType === "grades"
        ? "Grade Data Preview"
        : "Attendance Data Preview";

  if (loading) {
    return (
      <div>
        <OperationsTabs />
        <PageHeader title="Compliance & Exports" />
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div>
      <OperationsTabs />
      <PageHeader
        title="Compliance & Exports"
        description="Export data for compliance reporting and record-keeping"
      />

      <div className="space-y-4">
        {/* Student Data Export */}
        <Card className="p-5 gap-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#dbeafe] p-2 shrink-0">
                <Users className="h-5 w-5 text-[#2563eb]" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold">Student Data</h3>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Export a complete list of enrolled students with their personal details,
                  class assignments, and parent contact information.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[11px]">
                    {students.length} students
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    {classes.length} classes
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewType("students");
                  setPreviewOpen(true);
                }}
                disabled={students.length === 0}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={handleExportStudents}
                disabled={students.length === 0}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Grade Export */}
        <Card className="p-5 gap-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#fef3c7] p-2 shrink-0">
                <GraduationCap className="h-5 w-5 text-[#b45309]" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold">Grade Records</h3>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Export all grade records including scores, assessment details,
                  grading modes, and completion status for compliance audits.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[11px]">
                    {grades.length} records
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    {assessments.length} assessments
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewType("grades");
                  setPreviewOpen(true);
                }}
                disabled={grades.length === 0}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={handleExportGrades}
                disabled={grades.length === 0}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Attendance Export */}
        <Card className="p-5 gap-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#dcfce7] p-2 shrink-0">
                <ClipboardCheck className="h-5 w-5 text-[#16a34a]" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold">Attendance Records</h3>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Export attendance session data including daily records, status
                  breakdowns, and individual student attendance history.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[11px]">
                    {attendanceSessions.length} sessions
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    {attendanceSessions.reduce((sum, s) => sum + s.records.length, 0)} records
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewType("attendance");
                  setPreviewOpen(true);
                }}
                disabled={attendanceSessions.length === 0}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={handleExportAttendance}
                disabled={attendanceSessions.length === 0}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* No data notice */}
        {students.length === 0 && grades.length === 0 && attendanceSessions.length === 0 && (
          <EmptyState
            icon={FileSpreadsheet}
            title="No data to export"
            description="Once you have students, grades, and attendance data in the system, you can export it here."
          />
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
            <DialogDescription>
              Showing first {previewData.rows.length} of {previewData.totalRows} total rows.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-auto flex-1 -mx-6 px-6">
            {previewData.rows.length === 0 ? (
              <p className="text-center text-[13px] text-muted-foreground py-8">
                No data available for preview.
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-muted/50">
                      {previewData.headers.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-foreground whitespace-nowrap max-w-[200px] truncate"
                          >
                            {cell || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {previewData.totalRows > previewData.rows.length && (
            <div className="pt-3 border-t border-border">
              <p className="text-[12px] text-muted-foreground text-center">
                {previewData.totalRows - previewData.rows.length} more rows not shown.
                Export to CSV to see all data.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
