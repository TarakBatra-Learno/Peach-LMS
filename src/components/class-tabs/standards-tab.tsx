"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { LayoutGrid, List, Target } from "lucide-react";
import { buildClassMasterySections } from "@/lib/mastery-selectors";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { Student } from "@/types/student";
import type { LessonPlan, UnitPlan } from "@/types/unit-planning";

interface StandardsTabProps {
  classId: string;
  students: Student[];
  assessments: Assessment[];
  grades: GradeRecord[];
  learningGoals: LearningGoal[];
  unitPlans: UnitPlan[];
  lessonPlans: LessonPlan[];
}

const LEVEL_STYLES = {
  exceeding: "bg-[#dcfce7] text-[#15803d]",
  meeting: "bg-[#dbeafe] text-[#1d4ed8]",
  approaching: "bg-[#fef3c7] text-[#a16207]",
  beginning: "bg-[#fee2e2] text-[#dc2626]",
  not_assessed: "bg-muted text-muted-foreground",
} as const;

const LEVEL_LABELS = {
  exceeding: "Exceeding",
  meeting: "Meeting",
  approaching: "Approaching",
  beginning: "Beginning",
  not_assessed: "Not assessed",
} as const;

export function StandardsTab({
  classId,
  students,
  assessments,
  grades,
  learningGoals,
  unitPlans,
  lessonPlans,
}: StandardsTabProps) {
  const [viewMode, setViewMode] = useState<"cards" | "matrix">("cards");

  const sections = useMemo(
    () =>
      buildClassMasterySections({
        classId,
        students,
        assessments,
        grades,
        learningGoals,
        unitPlans,
        lessonPlans,
      }),
    [classId, students, assessments, grades, learningGoals, unitPlans, lessonPlans],
  );

  const rowCount = sections.reduce((sum, section) => sum + section.rows.length, 0);
  const trackedGoals = sections.reduce(
    (sum, section) => sum + section.rows.filter((row) => row.trackedStudentCount > 0).length,
    0,
  );

  if (rowCount === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No standards tracked"
        description="Standards & skills data will appear here once planning and assessments reference learning goals."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{trackedGoals}</span> tracked goals across{" "}
            <span className="font-semibold text-foreground">{sections.length}</span> mastery lenses
          </p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {(["exceeding", "meeting", "approaching", "beginning"] as const).map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${LEVEL_STYLES[level]}`} />
                <span>{LEVEL_LABELS[level]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => setViewMode("cards")}
          >
            <List className="mr-1.5 h-3.5 w-3.5" />
            Cards
          </Button>
          <Button
            variant={viewMode === "matrix" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => setViewMode("matrix")}
          >
            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
            Matrix
          </Button>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-[15px] font-semibold">{section.title}</h3>
            <p className="text-[12px] text-muted-foreground">{section.description}</p>
          </div>

          {viewMode === "matrix" ? (
            <Card className="p-0 gap-0 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 min-w-[240px] bg-background border-r border-border">
                        Goal
                      </TableHead>
                      {students.map((student) => (
                        <TableHead
                          key={student.id}
                          className="min-w-[76px] text-center text-[11px] font-medium"
                        >
                          <Link
                            href={`/students/${student.id}?classId=${classId}`}
                            className="hover:text-[#c24e3f] transition-colors"
                          >
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </Link>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.rows.map((row) => (
                      <TableRow key={row.goalId}>
                        <TableCell className="sticky left-0 z-10 bg-background border-r border-border align-top">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {row.goalCode}
                              </Badge>
                              <span className="text-[12px] font-medium">{row.goalTitle}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {row.linkedAssessmentCount} linked assessment
                              {row.linkedAssessmentCount !== 1 ? "s" : ""} · {row.plannedUnitCount} unit
                              {row.plannedUnitCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </TableCell>
                        {row.studentLevels.map((entry) => (
                          <TableCell key={entry.studentId} className="text-center p-2">
                            <span
                              className={`inline-flex min-w-[52px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-medium ${LEVEL_STYLES[entry.level]}`}
                            >
                              {entry.level === "not_assessed"
                                ? "—"
                                : LEVEL_LABELS[entry.level].slice(0, 3)}
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {section.rows.map((row) => {
                const totalStudents = row.studentLevels.length || 1;
                const trackedRatio = `${row.meetingOrAboveCount}/${totalStudents}`;

                return (
                  <Card key={row.goalId} className="p-4 gap-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px] font-mono">
                            {row.goalCode}
                          </Badge>
                          <h4 className="text-[14px] font-medium">{row.goalTitle}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span>{row.plannedUnitCount} unit plans</span>
                          <span>•</span>
                          <span>{row.plannedLessonCount} lessons</span>
                          <span>•</span>
                          <span>{row.linkedAssessmentCount} linked assessments</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[11px]">
                          {trackedRatio} meeting or above
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {row.trackedStudentCount}/{totalStudents} tracked
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted">
                      {(["exceeding", "meeting", "approaching", "beginning", "not_assessed"] as const).map(
                        (level) => {
                          const count = row.masteryDistribution[level];
                          if (count === 0) return null;
                          return (
                            <div
                              key={level}
                              className={LEVEL_STYLES[level].split(" ")[0]}
                              style={{ width: `${(count / totalStudents) * 100}%` }}
                              title={`${LEVEL_LABELS[level]}: ${count}`}
                            />
                          );
                        },
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {row.studentLevels
                        .filter((entry) => entry.level !== "not_assessed")
                        .slice(0, 6)
                        .map((entry) => (
                          <Link
                            key={entry.studentId}
                            href={`/students/${entry.studentId}?classId=${classId}`}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium hover:opacity-90 ${LEVEL_STYLES[entry.level]}`}
                          >
                            <span>{entry.studentName}</span>
                            <span>·</span>
                            <span>{LEVEL_LABELS[entry.level]}</span>
                          </Link>
                        ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
