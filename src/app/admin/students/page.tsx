"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  FileText,
  Languages,
  MoreHorizontal,
  Settings2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/stores";
import { getGradePercentage, isGradeComplete } from "@/lib/grade-helpers";
import {
  AdminDetailDrawer,
  AdminKpiCard,
  AdminMiniStat,
  AdminPanel,
  AdminRowLink,
  AdminToneBadge,
  AdminUtilityBar,
} from "@/features/admin/components/admin-ui";

function getStudentPrimaryClassId(
  classIds: string[],
  classMap: Map<string, { id: string; name: string; type: string; programme: string }>,
) {
  const homeroom = classIds.find((classId) => classMap.get(classId)?.type === "homeroom");
  return homeroom ?? classIds[0] ?? null;
}

type StudentRow = {
  id: string;
  name: string;
  programme: string;
  gradeLevel: string;
  primaryClassId: string | null;
  primaryClassName: string;
  familyState: string;
  supportState: string;
  status: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info" | "peach";
  attendanceRate: number | null;
  average: number | null;
  distributedReports: number;
  preferredLanguage: string;
  parentName: string;
  parentEmail: string;
};

export default function AdminStudentsPage() {
  const students = useStore((store) => store.students);
  const classes = useStore((store) => store.classes);
  const assessments = useStore((store) => store.assessments);
  const grades = useStore((store) => store.grades);
  const attendanceSessions = useStore((store) => store.attendanceSessions);
  const reports = useStore((store) => store.reports);
  const incidents = useStore((store) => store.incidents);
  const supportPlans = useStore((store) => store.supportPlans);
  const parentProfiles = useStore((store) => store.parentProfiles);

  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const classMap = useMemo(
    () =>
      new Map(
        classes.map((cls) => [cls.id, { id: cls.id, name: cls.name, type: cls.type, programme: cls.programme }]),
      ),
    [classes],
  );

  const rows = useMemo<StudentRow[]>(() => {
    return students.map((student) => {
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
        session.records.filter((record) => record.studentId === student.id),
      );
      const attendanceRate = attendanceRecords.length
        ? Math.round(
            (attendanceRecords.filter((record) => record.status === "present").length / attendanceRecords.length) * 100,
          )
        : null;
      const distributedReports = reports.filter(
        (report) => report.studentId === student.id && report.distributionStatus === "completed",
      ).length;
      const familyLinks = parentProfiles.filter((profile) => profile.linkedStudentIds.includes(student.id));
      const incidentCount = incidents.filter((incident) => incident.studentId === student.id).length;
      const activeSupportPlans = supportPlans.filter((plan) => plan.studentId === student.id).length;

      const familyState =
        familyLinks.length === 0
          ? "Needs link"
          : familyLinks.length > 1
            ? "Multi-household"
            : "Linked";
      const supportState =
        activeSupportPlans > 0
          ? "Support plan"
          : incidentCount > 0
            ? "Monitor"
            : "Clear";

      let status = "Active";
      let tone: StudentRow["tone"] = "success";
      if (attendanceRate !== null && attendanceRate < 92) {
        status = "Attendance watch";
        tone = "warning";
      }
      if (activeSupportPlans > 0) {
        status = "Needs follow-up";
        tone = "danger";
      } else if (familyLinks.length === 0) {
        status = "Family setup";
        tone = "info";
      }

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        programme: primaryClass?.programme ?? "MYP",
        gradeLevel: student.gradeLevel,
        primaryClassId,
        primaryClassName: primaryClass?.name ?? "Not assigned",
        familyState,
        supportState,
        status,
        tone,
        attendanceRate,
        average,
        distributedReports,
        preferredLanguage: student.preferredLanguage,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
      };
    });
  }, [assessments, attendanceSessions, classMap, grades, incidents, parentProfiles, reports, students, supportPlans]);

  const gradeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.gradeLevel))).sort(),
    [rows],
  );
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (programmeFilter !== "all" && row.programme !== programmeFilter) return false;
      if (gradeFilter !== "all" && row.gradeLevel !== gradeFilter) return false;
      if (classFilter !== "all" && row.primaryClassId !== classFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!normalized) return true;
      return [
        row.name,
        row.gradeLevel,
        row.primaryClassName,
        row.preferredLanguage,
        row.familyState,
        row.supportState,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [classFilter, gradeFilter, programmeFilter, query, rows, statusFilter]);

  const selectedRow =
    filteredRows.find((row) => row.id === selectedStudentId) ??
    rows.find((row) => row.id === selectedStudentId) ??
    null;

  const summary = useMemo(() => {
    const attendanceRows = rows.filter((row) => row.attendanceRate !== null);
    return {
      students: rows.length,
      distributedReports: reports.filter((report) => report.distributionStatus === "completed").length,
      averageAttendance: attendanceRows.length
        ? Math.round(
            attendanceRows.reduce((sum, row) => sum + (row.attendanceRate ?? 0), 0) / attendanceRows.length,
          )
        : null,
      languages: new Set(students.map((student) => student.preferredLanguage)).size,
    };
  }, [reports, rows, students]);

  const allVisibleSelected =
    filteredRows.length > 0 && filteredRows.every((row) => selectedIds.includes(row.id));

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? Array.from(new Set([...current, id])) : current.filter((value) => value !== id),
    );
  };

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...filteredRows.map((row) => row.id)])));
      return;
    }
    setSelectedIds((current) => current.filter((id) => !filteredRows.some((row) => row.id === id)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master student directory"
        description="A school-wide operational directory for students, with family connection state, support signals, and a direct route into the live student profile."
        primaryAction={{
          label: "Export student roster",
          onClick: () => toast.success("Student roster export queued for the demo"),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">Live student profile drill-in preserved</AdminToneBadge>
          <AdminToneBadge tone="info">Family and support context included</AdminToneBadge>
          <AdminToneBadge tone="warning">Demo-only bulk account actions</AdminToneBadge>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <AdminKpiCard label="Students" value={String(summary.students)} detail="Pulled from the live seeded prototype store" delta="School-wide directory coverage" tone="peach" icon={Users} />
        <AdminKpiCard label="Distributed reports" value={String(summary.distributedReports)} detail="Completed family-visible report records" delta="Read-only oversight context" tone="success" icon={FileText} />
        <AdminKpiCard label="Average attendance" value={summary.averageAttendance ? `${summary.averageAttendance}%` : "N/A"} detail="Across students in the current filter set" delta="Live attendance records" tone="info" icon={BarChart3} />
        <AdminKpiCard label="Family languages" value={String(summary.languages)} detail="Visible language context from student records" delta="Useful for communication planning" tone="warning" icon={Languages} />
      </div>

      <AdminUtilityBar
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success("Column settings opened in the demo")}>
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              Columns
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success("Selected students exported for the demo")}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
          </>
        }
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students, year groups, classes, or family context"
          className="h-9 min-w-[220px] max-w-[320px] bg-white text-[13px]"
        />
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
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="h-9 w-[180px] bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All year groups</SelectItem>
            {gradeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="h-9 w-[220px] bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[180px] bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Array.from(new Set(rows.map((row) => row.status))).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminUtilityBar>

      {selectedIds.length > 0 ? (
        <AdminUtilityBar className="border-[#ffe1dc] bg-[#fff7f5]">
          <p className="text-[13px] text-foreground">
            {selectedIds.length} student{selectedIds.length === 1 ? "" : "s"} selected for demo-only account and reporting actions
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.success("Sign-in codes prepared for the selected students")}>
              Print sign-in codes
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.success("Selected student summary copied for leadership review")}>
              Copy summary
            </Button>
          </div>
        </AdminUtilityBar>
      ) : null}

      <AdminPanel title="Student directory" description="Table-first, filterable, and school-wide. The open action reuses the live student profile instead of creating a fake admin duplicate.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[42px]">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))}
                  aria-label="Select all visible students"
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Primary class</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Support</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onCheckedChange={(checked) => toggleRow(row.id, Boolean(checked))}
                    aria-label={`Select ${row.name}`}
                  />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <button type="button" onClick={() => setSelectedStudentId(row.id)} className="text-left">
                    <p className="font-medium text-foreground hover:text-[#c24e3f]">{row.name}</p>
                    <p className="text-[12px] text-muted-foreground">{row.gradeLevel} · {row.preferredLanguage}</p>
                  </button>
                </TableCell>
                <TableCell>{row.programme}</TableCell>
                <TableCell>{row.primaryClassName}</TableCell>
                <TableCell>
                  <AdminToneBadge tone={row.familyState === "Linked" ? "success" : row.familyState === "Multi-household" ? "info" : "warning"}>
                    {row.familyState}
                  </AdminToneBadge>
                </TableCell>
                <TableCell>
                  <AdminToneBadge tone={row.supportState === "Clear" ? "success" : row.supportState === "Support plan" ? "danger" : "warning"}>
                    {row.supportState}
                  </AdminToneBadge>
                </TableCell>
                <TableCell>
                  <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <AdminRowLink label="Preview" onClick={() => setSelectedStudentId(row.id)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/students/${row.id}${row.primaryClassId ? `?classId=${row.primaryClassId}` : ""}`}>
                            Open workspace
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success(`${row.name} sign-in code prepared`)}>
                          Print sign-in code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success(`${row.name} added to leadership watchlist`)}>
                          Flag for follow-up
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button asChild size="sm">
                      <Link href={`/admin/students/${row.id}${row.primaryClassId ? `?classId=${row.primaryClassId}` : ""}`}>
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
        title={selectedRow?.name ?? "Student preview"}
        description={selectedRow ? `${selectedRow.gradeLevel} · ${selectedRow.primaryClassName}` : undefined}
        primaryLabel="Open live student profile"
        secondaryLabel="Copy student summary"
        onPrimary={() => {
          if (!selectedRow) return;
          window.location.href = `/admin/students/${selectedRow.id}${selectedRow.primaryClassId ? `?classId=${selectedRow.primaryClassId}` : ""}`;
        }}
        onSecondary={() => toast.success("Student summary copied for the demo")}
      >
        {selectedRow ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminMiniStat label="Attendance" value={selectedRow.attendanceRate !== null ? `${selectedRow.attendanceRate}%` : "N/A"} helper="Live attendance context" tone={selectedRow.attendanceRate !== null && selectedRow.attendanceRate < 92 ? "warning" : "success"} />
              <AdminMiniStat label="Average" value={selectedRow.average !== null ? `${selectedRow.average}%` : "N/A"} helper="Completed assessment average" tone="info" />
              <AdminMiniStat label="Reports" value={String(selectedRow.distributedReports)} helper="Family-visible completed reports" tone="warning" />
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="family">Family</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Primary learning context</p>
                  <p className="mt-2 text-[14px] font-medium text-foreground">{selectedRow.primaryClassName}</p>
                  <p className="text-[12px] text-muted-foreground">{selectedRow.programme} · {selectedRow.gradeLevel}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
                  <p className="text-[13px] leading-6 text-muted-foreground">
                    This preview stays high-level. The real drill-in is the live student profile, which already carries grades, attendance, reports, portfolio, and support context.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="family" className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Family connection state</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AdminToneBadge tone={selectedRow.familyState === "Linked" ? "success" : selectedRow.familyState === "Multi-household" ? "info" : "warning"}>
                      {selectedRow.familyState}
                    </AdminToneBadge>
                    <AdminToneBadge tone="neutral">{selectedRow.preferredLanguage}</AdminToneBadge>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                    {selectedRow.parentName} · {selectedRow.parentEmail}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="support" className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-[#c24e3f]" />
                    <p className="text-[14px] font-medium text-foreground">{selectedRow.supportState}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    A school-wide support signal for leadership scanning. Details remain in the live student profile and the support module.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="access" className="space-y-3">
                <AdminMiniStat label="Account state" value={selectedRow.status} helper="Demo-only operational account posture" tone={selectedRow.tone} />
                <AdminMiniStat label="Suggested action" value="Print sign-in code" helper="Surface a real-looking but non-destructive admin action" tone="peach" />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
