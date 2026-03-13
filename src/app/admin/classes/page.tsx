"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ClipboardCheck, GraduationCap, Users } from "lucide-react";
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
import { AdminDetailDrawer, AdminKpiCard, AdminPanel, AdminRowLink, AdminToneBadge } from "@/features/admin/components/admin-ui";

function getProgrammeTeacherMap() {
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

export default function AdminClassesPage() {
  const classes = useStore((store) => store.classes);
  const assessments = useStore((store) => store.assessments);
  const unitPlans = useStore((store) => store.unitPlans);
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const teacherMap = useMemo(() => getProgrammeTeacherMap(), []);

  const filteredClasses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return classes.filter((cls) => {
      if (programmeFilter !== "all" && cls.programme !== programmeFilter) return false;
      if (typeFilter !== "all" && cls.type !== typeFilter) return false;
      if (!normalized) return true;
      const teacherNames = (teacherMap.get(cls.id) ?? []).map((teacher) => teacher.name.toLowerCase()).join(" ");
      return [cls.name, cls.subject, cls.gradeLevel, teacherNames].join(" ").toLowerCase().includes(normalized);
    });
  }, [classes, programmeFilter, query, teacherMap, typeFilter]);

  const selectedClass = filteredClasses.find((cls) => cls.id === selectedClassId) ?? classes.find((cls) => cls.id === selectedClassId) ?? null;

  const liveCounts = useMemo(() => {
    const liveAssessments = assessments.filter((assessment) => assessment.status === "live" || assessment.status === "published");
    return {
      classes: classes.length,
      students: classes.reduce((sum, cls) => sum + cls.studentIds.length, 0),
      liveAssessments: liveAssessments.length,
      unitPlans: unitPlans.length,
    };
  }, [assessments, classes, unitPlans]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="School-wide classes"
        description="Browse the live seeded classes across the school, then open any one directly in the existing teacher class hub."
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[140px] bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="subject">Subject</SelectItem>
              <SelectItem value="homeroom">Homeroom</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search classes, subjects, grade levels, or teachers"
            className="h-9 max-w-[320px] bg-white text-[13px]"
          />
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <AdminKpiCard label="Live classes" value={String(liveCounts.classes)} detail="Pulled from the seeded teacher prototype store" delta="Shared with teacher class hub" tone="peach" icon={BookOpen} />
        <AdminKpiCard label="Students in scope" value={String(liveCounts.students)} detail="Across homeroom and subject enrollments" delta="Live seeded roster context" tone="info" icon={Users} />
        <AdminKpiCard label="Live assessments" value={String(liveCounts.liveAssessments)} detail="Available in linked teacher class hubs" delta="Released and active tasks only" tone="success" icon={ClipboardCheck} />
        <AdminKpiCard label="Linked unit plans" value={String(liveCounts.unitPlans)} detail="Visible in teacher class hubs where available" delta="No duplicate admin copy" tone="warning" icon={GraduationCap} />
      </div>

      <AdminPanel title="Classes directory" description="This is the admin entry point. The `Open workspace` action keeps you inside the admin portal while embedding the existing live class hub.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Teachers</TableHead>
              <TableHead>Live context</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.map((cls) => {
              const teacherNames = teacherMap.get(cls.id) ?? [];
              const classAssessments = assessments.filter((assessment) => assessment.classId === cls.id);
              const publishedAssessments = classAssessments.filter((assessment) => assessment.status === "live" || assessment.status === "published").length;
              const classUnitPlans = unitPlans.filter((unit) => unit.classId === cls.id).length;
              return (
                <TableRow key={cls.id}>
                  <TableCell className="whitespace-normal">
                    <div>
                      <p className="font-medium text-foreground">{cls.name}</p>
                      <p className="text-[12px] text-muted-foreground">{cls.subject} · {cls.gradeLevel}</p>
                    </div>
                  </TableCell>
                  <TableCell>{cls.programme}</TableCell>
                  <TableCell className="capitalize">{cls.type}</TableCell>
                  <TableCell>{cls.studentIds.length}</TableCell>
                  <TableCell className="whitespace-normal">
                    {teacherNames.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {teacherNames.map((teacher) => (
                          <AdminToneBadge key={teacher.email} tone="neutral">{teacher.name}</AdminToneBadge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">Demo linkage not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <AdminToneBadge tone="info">{publishedAssessments} live assessments</AdminToneBadge>
                      <AdminToneBadge tone="warning">{classUnitPlans} unit plans</AdminToneBadge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <AdminRowLink label="Preview" onClick={() => setSelectedClassId(cls.id)} />
                      <Button asChild size="sm">
                        <Link href={`/admin/classes/${cls.id}`}>
                          Open workspace
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
        primaryLabel="Open admin workspace"
        onPrimary={() => {
          if (!selectedClass) return;
          window.location.href = `/admin/classes/${selectedClass.id}`;
        }}
      >
        {selectedClass ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Live seeded context</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <AdminToneBadge tone="peach">{selectedClass.programme}</AdminToneBadge>
                <AdminToneBadge tone="neutral" className="capitalize">{selectedClass.type}</AdminToneBadge>
                <AdminToneBadge tone="info">{selectedClass.studentIds.length} students</AdminToneBadge>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Teachers linked in admin</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(teacherMap.get(selectedClass.id) ?? []).map((teacher) => (
                  <AdminToneBadge key={teacher.email} tone="neutral">{teacher.name}</AdminToneBadge>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Why this route exists</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Admin stays school-wide here, but the open action intentionally drops into the existing teacher class hub so you can use the live seeded planning, gradebook, attendance, and communication context without rebuilding it.
              </p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
