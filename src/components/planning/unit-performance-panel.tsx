"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { Student } from "@/types/student";
import type { UnitPlan } from "@/types/unit-planning";
import { getGradePercentage, getTeacherReviewStatus } from "@/lib/grade-helpers";

interface UnitPerformancePanelProps {
  unit: UnitPlan;
  students: Student[];
  assessments: Assessment[];
  grades: GradeRecord[];
  learningGoals: LearningGoal[];
  getStudentHref: (studentId: string) => string;
}

export function UnitPerformancePanel({
  unit,
  students,
  assessments,
  grades,
  learningGoals,
  getStudentHref,
}: UnitPerformancePanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const overview = useMemo(() => {
    const relevantGrades = grades.filter((grade) =>
      assessments.some((assessment) => assessment.id === grade.assessmentId)
    );
    const releasedCount = relevantGrades.filter((grade) => Boolean(grade.releasedAt)).length;
    const readyCount = relevantGrades.filter((grade) => grade.gradingStatus === "ready" && !grade.releasedAt).length;
    const percentages = relevantGrades
      .map((grade) => {
        const assessment = assessments.find((entry) => entry.id === grade.assessmentId);
        return assessment ? getGradePercentage(grade, assessment) : null;
      })
      .filter((value): value is number => value !== null);

    return {
      linkedAssessmentCount: assessments.length,
      releasedCount,
      readyCount,
      average: percentages.length
        ? `${Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)}%`
        : "N/A",
    };
  }, [assessments, grades]);

  const matrixRows = useMemo(
    () =>
      students.map((student) => {
        const studentGrades = grades.filter((grade) => grade.studentId === student.id);
        const percentages = studentGrades
          .map((grade) => {
            const assessment = assessments.find((entry) => entry.id === grade.assessmentId);
            return assessment ? getGradePercentage(grade, assessment) : null;
          })
          .filter((value): value is number => value !== null);
        const released = studentGrades.filter((grade) => Boolean(grade.releasedAt)).length;

        return {
          student,
          released,
          average: percentages.length
            ? `${Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)}%`
            : "Pending",
          statuses: studentGrades.map((grade) => {
            const assessment = assessments.find((entry) => entry.id === grade.assessmentId);
            return {
              assessmentId: grade.assessmentId,
              status: assessment ? getTeacherReviewStatus(grade, assessment) : "pending",
            };
          }),
        };
      }),
    [assessments, grades, students]
  );

  const taggedGoals = useMemo(
    () =>
      unit.strategy.linkedStandardIds
        .map((goalId) => learningGoals.find((goal) => goal.id === goalId))
        .filter(Boolean) as LearningGoal[],
    [learningGoals, unit.strategy.linkedStandardIds]
  );

  return (
    <Card className="p-5">
      <div>
        <p className="text-[16px] font-semibold">Performance</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          View this unit as a class story: outcomes, linked grades, and standards signals in one
          place.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5 space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matrix">Student matrix</TabsTrigger>
          <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
          <TabsTrigger value="standards">Standards &amp; skills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SignalCard label="Linked assessments" value={overview.linkedAssessmentCount.toString()} />
            <SignalCard label="Ready to release" value={overview.readyCount.toString()} />
            <SignalCard label="Released outcomes" value={overview.releasedCount.toString()} />
            <SignalCard label="Average unit performance" value={overview.average} />
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Released</TableHead>
                <TableHead>Average</TableHead>
                <TableHead>Outcome pattern</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrixRows.map((row) => (
                <TableRow key={row.student.id}>
                  <TableCell>
                    <Link href={getStudentHref(row.student.id)} className="font-medium hover:text-[#c24e3f]">
                      {row.student.firstName} {row.student.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{row.released}</TableCell>
                  <TableCell>{row.average}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {row.statuses.map((status) => (
                        <Badge key={status.assessmentId} variant="outline" className="text-[10px]">
                          {status.status.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="gradebook" className="mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                {assessments.map((assessment) => (
                  <TableHead key={assessment.id}>{assessment.title}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.firstName} {student.lastName}
                  </TableCell>
                  {assessments.map((assessment) => {
                    const grade = grades.find(
                      (entry) =>
                        entry.studentId === student.id && entry.assessmentId === assessment.id
                    );
                    const percentage = grade ? getGradePercentage(grade, assessment) : null;
                    return (
                      <TableCell key={assessment.id}>
                        {percentage !== null ? `${percentage}%` : "—"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="standards" className="mt-0 space-y-3">
          {taggedGoals.length > 0 ? (
            taggedGoals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-2xl border border-border/70 bg-background px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {goal.code}
                  </Badge>
                  <p className="text-[14px] font-medium">{goal.title}</p>
                </div>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Tagged in strategy and available for unit-linked outcomes and report attribution.
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-[13px] text-muted-foreground">
              No standards or skills are tagged on this unit yet.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-[20px] font-semibold">{value}</p>
    </div>
  );
}
