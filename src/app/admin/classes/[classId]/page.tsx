"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BookOpen, ClipboardCheck, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLiveEmbed } from "@/features/admin/components/admin-live-embed";
import { AdminKpiCard, AdminPanel, AdminToneBadge } from "@/features/admin/components/admin-ui";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import { getAdminStudentWorkspaceHref } from "@/lib/admin-embed-routes";

function getTeacherNames(classId: string) {
  return adminDemoData.platform.users
    .filter((user) => {
      const linkedClasses = user.linkedClassIds as string[] | undefined;
      return linkedClasses?.includes(classId) ?? false;
    })
    .map((user) => user.name);
}

export default function AdminClassDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params.classId as string;
  const tab = searchParams.get("tab");
  const classes = useStore((store) => store.classes);
  const students = useStore((store) => store.students);
  const assessments = useStore((store) => store.assessments);
  const unitPlans = useStore((store) => store.unitPlans);
  const grades = useStore((store) => store.grades);

  const cls = classes.find((entry) => entry.id === classId);

  const roster = useMemo(() => {
    if (!cls) return [];
    return students.filter((student) => cls.studentIds.includes(student.id));
  }, [cls, students]);

  const liveAssessments = useMemo(
    () =>
      assessments.filter(
        (assessment) =>
          assessment.classId === classId &&
          (assessment.status === "live" || assessment.status === "published")
      ),
    [assessments, classId]
  );

  const unreleasedGrades = useMemo(
    () =>
      grades.filter(
        (grade) =>
          grade.classId === classId &&
          grade.releasedAt == null &&
          grade.gradingStatus === "ready"
      ).length,
    [classId, grades]
  );

  const liveUnits = unitPlans.filter((unit) => unit.classId === classId);
  const teacherNames = getTeacherNames(classId);

  if (!cls) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Class not found"
        description="This class is not available in the seeded prototype data."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={cls.name}
        description={`${cls.subject} · ${cls.gradeLevel} · Embedded live class hub`}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{cls.programme}</Badge>
          <Badge variant="outline" className="capitalize">{cls.type}</Badge>
          <AdminToneBadge tone="peach">Admin workspace</AdminToneBadge>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <AdminKpiCard label="Students" value={String(roster.length)} detail="Visible in the roster below" delta="Live seeded roster" tone="info" icon={Users} />
        <AdminKpiCard label="Live assessments" value={String(liveAssessments.length)} detail="Embedded teacher class hub shows their full context" delta="No admin duplicate view" tone="success" icon={ClipboardCheck} />
        <AdminKpiCard label="Unit plans" value={String(liveUnits.length)} detail="Read from the existing planning model" delta="Shared with teacher hub" tone="warning" icon={BookOpen} />
        <AdminKpiCard label="Unreleased grades" value={String(unreleasedGrades)} detail="Helpful admin oversight signal only" delta="Teacher-controlled visibility" tone="peach" icon={ClipboardCheck} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <AdminPanel title="Embedded live class view" description="This is the existing teacher class hub rendered inside admin, so the admin shell and navigation remain intact.">
          <AdminLiveEmbed
            title="Live class view"
            src={`/classes/${classId}?embed=1${tab ? `&tab=${tab}` : ""}`}
            minHeight={1280}
          />
        </AdminPanel>

        <div className="space-y-4">
          <AdminPanel title="Student roster" description="Use this roster to move from school-wide class browsing into individual student context.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead className="text-right">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="whitespace-normal">
                      <div>
                        <p className="font-medium text-foreground">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-[12px] text-muted-foreground">{student.gradeLevel}</p>
                      </div>
                    </TableCell>
                    <TableCell>{student.preferredLanguage}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={getAdminStudentWorkspaceHref(student.id, { classId })}>
                          Open student
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>

          <Card className="border-[#ffe1dc] bg-[#fffaf9] p-5 shadow-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#b9483a]">
              Linked teaching context
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {teacherNames.length > 0 ? (
                teacherNames.map((name) => (
                  <AdminToneBadge key={name} tone="neutral">{name}</AdminToneBadge>
                ))
              ) : (
                <span className="text-[13px] text-muted-foreground">No teacher linkage seeded for this class.</span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
