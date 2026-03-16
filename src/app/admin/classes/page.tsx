"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  Download,
  GraduationCap,
  MoreHorizontal,
  Settings2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { useStore } from "@/stores";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
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
import {
  AdminDetailDrawer,
  AdminKpiCard,
  AdminMiniStat,
  AdminPanel,
  AdminRowLink,
  AdminToneBadge,
  AdminUtilityBar,
} from "@/features/admin/components/admin-ui";

function getTeacherMap() {
  const map = new Map<string, { name: string; email: string }[]>();
  for (const user of adminDemoData.platform.users) {
    if (!user.linkedClassIds?.length) continue;
    for (const classId of user.linkedClassIds) {
      const entry = map.get(classId) ?? [];
      entry.push({ name: user.name, email: user.email });
      map.set(classId, entry);
    }
  }
  return map;
}

type ClassRow = {
  id: string;
  name: string;
  programme: string;
  gradeLevel: string;
  subject: string;
  status: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info" | "peach";
  studentCount: number;
  staffCount: number;
  familyCount: number;
  liveAssessments: number;
  linkedUnits: number;
  unreleasedGrades: number;
  teachers: { name: string; email: string }[];
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
};

export default function AdminClassesPage() {
  const classes = useStore((store) => store.classes);
  const students = useStore((store) => store.students);
  const parentProfiles = useStore((store) => store.parentProfiles);
  const assessments = useStore((store) => store.assessments);
  const unitPlans = useStore((store) => store.unitPlans);
  const grades = useStore((store) => store.grades);
  const artifacts = useStore((store) => store.artifacts);
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const teacherMap = useMemo(() => getTeacherMap(), []);

  const rows = useMemo<ClassRow[]>(() => {
    return classes.map((cls) => {
      const teachers = teacherMap.get(cls.id) ?? [];
      const familyCount = parentProfiles.filter((profile) =>
        profile.linkedStudentIds.some((studentId) => cls.studentIds.includes(studentId)),
      ).length;
      const liveAssessments = assessments.filter(
        (assessment) =>
          assessment.classId === cls.id &&
          (assessment.status === "live" || assessment.status === "published" || assessment.status === "closed"),
      );
      const linkedUnits = unitPlans.filter((unit) => unit.classId === cls.id).length;
      const unreleasedGrades = grades.filter(
        (grade) => grade.classId === cls.id && grade.releasedAt == null && grade.gradingStatus === "ready",
      ).length;

      let status = "Healthy";
      let tone: ClassRow["tone"] = "success";
      if (linkedUnits === 0) {
        status = "Needs setup";
        tone = "warning";
      } else if (liveAssessments.length === 0) {
        status = "Planning only";
        tone = "info";
      } else if (unreleasedGrades > 0) {
        status = "Needs review";
        tone = "warning";
      }

      return {
        id: cls.id,
        name: cls.name,
        programme: cls.programme,
        gradeLevel: cls.gradeLevel,
        subject: cls.subject,
        status,
        tone,
        studentCount: cls.studentIds.length,
        staffCount: teachers.length,
        familyCount,
        liveAssessments: liveAssessments.length,
        linkedUnits,
        unreleasedGrades,
        teachers,
        schedule: cls.schedule,
      };
    });
  }, [assessments, classes, grades, parentProfiles, teacherMap, unitPlans]);

  const gradeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.gradeLevel))).sort(),
    [rows],
  );
  const subjectOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.subject))).sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (programmeFilter !== "all" && row.programme !== programmeFilter) return false;
      if (gradeFilter !== "all" && row.gradeLevel !== gradeFilter) return false;
      if (subjectFilter !== "all" && row.subject !== subjectFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!normalized) return true;
      return [row.name, row.subject, row.gradeLevel, ...row.teachers.map((teacher) => teacher.name)]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [gradeFilter, programmeFilter, query, rows, statusFilter, subjectFilter]);

  const selectedClass =
    filteredRows.find((row) => row.id === selectedClassId) ??
    rows.find((row) => row.id === selectedClassId) ??
    null;

  const selectedRoster = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter((student) => student.classIds.includes(selectedClass.id));
  }, [selectedClass, students]);

  const selectedFamilies = useMemo(() => {
    if (!selectedClass) return [];
    return parentProfiles.filter((profile) =>
      profile.linkedStudentIds.some((studentId) => selectedClass.id && selectedClass.id.length > 0 && selectedRoster.some((student) => student.id === studentId)),
    );
  }, [parentProfiles, selectedClass, selectedRoster]);

  const selectedArtifacts = useMemo(() => {
    if (!selectedClass) return [];
    return artifacts.filter((artifact) => artifact.classId === selectedClass.id);
  }, [artifacts, selectedClass]);

  const liveCounts = useMemo(() => {
    return {
      classes: rows.length,
      students: rows.reduce((sum, row) => sum + row.studentCount, 0),
      liveAssessments: rows.reduce((sum, row) => sum + row.liveAssessments, 0),
      unitPlans: rows.reduce((sum, row) => sum + row.linkedUnits, 0),
    };
  }, [rows]);

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
        title="School-wide classes"
        description="A school-wide operational directory for classes, with filters, selection, export affordances, and direct admin drill-in to the live class workspace."
        primaryAction={{
          label: "Export classes",
          onClick: () => toast.success("Classes export queued for the demo"),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">Live class hub drill-in preserved</AdminToneBadge>
          <AdminToneBadge tone="info">Operational roster table</AdminToneBadge>
          <AdminToneBadge tone="warning">Demo-only bulk actions</AdminToneBadge>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <AdminKpiCard label="Live classes" value={String(liveCounts.classes)} detail="Pulled from the seeded teacher prototype store" delta="School-wide roster coverage" tone="peach" icon={BookOpen} />
        <AdminKpiCard label="Students in scope" value={String(liveCounts.students)} detail="Across homeroom and subject enrolments" delta="Operational directory breadth" tone="info" icon={Users} />
        <AdminKpiCard label="Live assessments" value={String(liveCounts.liveAssessments)} detail="Available in linked teacher class hubs" delta="Review-ready oversight" tone="success" icon={ClipboardCheck} />
        <AdminKpiCard label="Linked unit plans" value={String(liveCounts.unitPlans)} detail="Visible in live class hubs where planning exists" delta="Curriculum oversight signal" tone="warning" icon={GraduationCap} />
      </div>

      <AdminUtilityBar
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success("Column settings opened in the demo")}>
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              Columns
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success("Selected class rows added to the export queue")}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
          </>
        }
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search classes, subjects, year groups, or teachers"
          className="h-9 min-w-[220px] max-w-[320px] bg-white text-[13px]"
        />
        <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
          <SelectTrigger className="h-9 w-[140px] bg-white text-[13px]">
            <SelectValue placeholder="Programme" />
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
            <SelectValue placeholder="Year group" />
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
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="h-9 w-[200px] bg-white text-[13px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjectOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px] bg-white text-[13px]">
            <SelectValue placeholder="Status" />
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
            {selectedIds.length} class{selectedIds.length === 1 ? "" : "es"} selected for demo-only bulk actions
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.success("Leadership review pack created from selected classes")}>
              Queue QA review
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.success("Selected classes exported for the demo")}>
              Export selection
            </Button>
          </div>
        </AdminUtilityBar>
      ) : null}

      <AdminPanel title="Classes directory" description="Table-first, searchable, and filterable. Preview stays light, while the workspace action keeps the live class hub as the real drill-in.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[42px]">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))}
                  aria-label="Select all visible classes"
                />
              </TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Year group</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Students</TableHead>
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
                  <button
                    type="button"
                    onClick={() => setSelectedClassId(row.id)}
                    className="text-left"
                  >
                    <p className="font-medium text-foreground hover:text-[#c24e3f]">{row.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {row.liveAssessments} live assessments · {row.linkedUnits} linked units
                    </p>
                  </button>
                </TableCell>
                <TableCell>{row.programme}</TableCell>
                <TableCell>{row.gradeLevel}</TableCell>
                <TableCell>{row.subject}</TableCell>
                <TableCell>{row.staffCount}</TableCell>
                <TableCell>{row.studentCount}</TableCell>
                <TableCell>
                  <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <AdminRowLink label="Preview" onClick={() => setSelectedClassId(row.id)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/classes/${row.id}`}>Open workspace</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success(`${row.name} added to review pack`)}>
                          Add to QA review
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success(`${row.name} summary copied`)}>
                          Copy class summary
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button asChild size="sm">
                      <Link href={`/admin/classes/${row.id}`}>Open workspace</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPanel>

      <AdminDetailDrawer
        open={Boolean(selectedClass)}
        onOpenChange={(open) => {
          if (!open) setSelectedClassId(null);
        }}
        title={selectedClass?.name ?? "Class preview"}
        description={selectedClass ? `${selectedClass.subject} · ${selectedClass.gradeLevel}` : undefined}
        primaryLabel="Open live class hub"
        secondaryLabel="Export class summary"
        onPrimary={() => {
          if (!selectedClass) return;
          window.location.href = `/admin/classes/${selectedClass.id}`;
        }}
        onSecondary={() => toast.success("Class summary exported for the demo")}
      >
        {selectedClass ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminMiniStat label="Students" value={String(selectedClass.studentCount)} helper="Visible in the roster tab below" tone="info" />
              <AdminMiniStat label="Families" value={String(selectedClass.familyCount)} helper="Linked through rostered learners" tone="warning" />
              <AdminMiniStat label="Unreleased grades" value={String(selectedClass.unreleasedGrades)} helper="Admin-only release oversight signal" tone={selectedClass.unreleasedGrades > 0 ? "warning" : "success"} />
            </div>

            <Tabs defaultValue="students" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="families">Families</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio settings</TabsTrigger>
                <TabsTrigger value="timetable">Timetable</TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-3">
                {selectedRoster.map((student) => (
                  <div key={student.id} className="rounded-2xl border border-border/80 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-[12px] text-muted-foreground">{student.gradeLevel} · {student.preferredLanguage}</p>
                      </div>
                      <AdminToneBadge tone="neutral">{student.parentName}</AdminToneBadge>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="families" className="space-y-3">
                {selectedFamilies.length > 0 ? (
                  selectedFamilies.map((family) => (
                    <div key={family.id} className="rounded-2xl border border-border/80 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{family.householdName}</p>
                          <p className="text-[12px] text-muted-foreground">{family.name} · {family.email}</p>
                        </div>
                        <AdminToneBadge tone="info">
                          {family.linkedStudentIds.length} child{family.linkedStudentIds.length === 1 ? "" : "ren"}
                        </AdminToneBadge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-muted-foreground">No family links are seeded for this class.</p>
                )}
              </TabsContent>

              <TabsContent value="staff" className="space-y-3">
                {selectedClass.teachers.length > 0 ? (
                  selectedClass.teachers.map((teacher) => (
                    <div key={teacher.email} className="rounded-2xl border border-border/80 bg-white px-4 py-3">
                      <p className="text-[14px] font-medium text-foreground">{teacher.name}</p>
                      <p className="text-[12px] text-muted-foreground">{teacher.email}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-muted-foreground">No teacher linkage is seeded for this class.</p>
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-3">
                <AdminMiniStat
                  label="Eligible evidence"
                  value={String(selectedArtifacts.filter((artifact) => artifact.isReportEligible).length)}
                  helper="Portfolio items flagged as report-ready in this class"
                  tone="success"
                />
                <AdminMiniStat
                  label="Family shared"
                  value={String(selectedArtifacts.filter((artifact) => artifact.familyShareStatus === "shared").length)}
                  helper="Items already visible in the family story"
                  tone="info"
                />
                <AdminMiniStat
                  label="Needs moderation"
                  value={String(selectedArtifacts.filter((artifact) => artifact.approvalStatus !== "approved").length)}
                  helper="A light proxy for portfolio governance"
                  tone="warning"
                />
              </TabsContent>

              <TabsContent value="timetable" className="space-y-3">
                {selectedClass.schedule.map((slot) => (
                  <div key={`${slot.day}-${slot.startTime}`} className="rounded-2xl border border-border/80 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{slot.day}</p>
                        <p className="text-[12px] text-muted-foreground">{slot.startTime} - {slot.endTime}</p>
                      </div>
                      <AdminToneBadge tone="neutral">{slot.room}</AdminToneBadge>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
