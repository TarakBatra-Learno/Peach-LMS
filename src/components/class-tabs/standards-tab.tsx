"use client";

import { useState, useMemo } from "react";
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
import { ChevronDown, ChevronRight, Target, LayoutGrid, List } from "lucide-react";
import type { Student } from "@/types/student";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { MasteryLevel } from "@/types/common";

interface StandardsTabProps {
  classId: string;
  students: Student[];
  assessments: Assessment[];
  grades: GradeRecord[];
  learningGoals: LearningGoal[];
}

const MASTERY_LEVELS: { level: MasteryLevel; label: string; color: string; bg: string }[] = [
  { level: "exceeding", label: "Exceeding", color: "#16a34a", bg: "#dcfce7" },
  { level: "meeting", label: "Meeting", color: "#22c55e", bg: "#dcfce7" },
  { level: "approaching", label: "Approaching", color: "#b45309", bg: "#fef3c7" },
  { level: "beginning", label: "Beginning", color: "#dc2626", bg: "#fee2e2" },
];

/**
 * For a given student + learning goal, find the best mastery level across all their grades.
 */
function findBestMasteryForGoal(
  studentId: string,
  goalId: string,
  studentGrades: GradeRecord[]
): MasteryLevel | null {
  const hierarchy: MasteryLevel[] = ["exceeding", "meeting", "approaching", "beginning"];
  let bestIdx = -1;

  for (const grade of studentGrades) {
    if (grade.submissionStatus === "excused") continue;
    if (!grade.standardsMastery) continue;
    const match = grade.standardsMastery.find((sm) => sm.standardId === goalId);
    if (match && match.level !== "not_assessed") {
      const idx = hierarchy.indexOf(match.level);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
      }
    }
  }

  return bestIdx !== -1 ? hierarchy[bestIdx] : null;
}

export function StandardsTab({
  classId,
  students,
  assessments,
  grades,
  learningGoals,
}: StandardsTabProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "matrix">("cards");

  // Live/published assessments for this class
  const publishedAssessments = useMemo(
    () => assessments.filter((a) => a.status === "live" || a.status === "published"),
    [assessments]
  );

  // Learning goals referenced by published assessments (all categories)
  const coveredStandards = useMemo(() => {
    const goalIds = new Set<string>();
    publishedAssessments.forEach((asmt) => {
      asmt.learningGoalIds.forEach((gid) => {
        goalIds.add(gid);
      });
    });
    return learningGoals.filter((g) => goalIds.has(g.id));
  }, [publishedAssessments, learningGoals]);

  // Grades for this class only
  const classGrades = useMemo(
    () => grades.filter((g) => g.classId === classId),
    [grades, classId]
  );

  // Per-standard mastery distribution
  const standardData = useMemo(() => {
    return coveredStandards.map((goal) => {
      const distribution: Record<MasteryLevel, string[]> = {
        exceeding: [],
        meeting: [],
        approaching: [],
        beginning: [],
        not_assessed: [],
      };

      students.forEach((student) => {
        const studentGrades = classGrades.filter((g) => g.studentId === student.id);
        const best = findBestMasteryForGoal(student.id, goal.id, studentGrades);
        if (best) {
          distribution[best].push(student.id);
        } else {
          distribution.not_assessed.push(student.id);
        }
      });

      const assessed = students.length - distribution.not_assessed.length;

      return { goal, distribution, assessed };
    });
  }, [coveredStandards, students, classGrades]);

  if (coveredStandards.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No standards tracked"
        description="Standards & skills data will appear here once published assessments reference learning goals."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary + view toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-6">
          <p className="text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{coveredStandards.length}</span> standards tracked across{" "}
            <span className="font-semibold text-foreground">{publishedAssessments.length}</span> published assessments
          </p>
          <div className="flex items-center gap-3">
            {MASTERY_LEVELS.map((ml) => (
              <div key={ml.level} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ml.color }} />
                <span className="text-[11px] text-muted-foreground">{ml.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            className="h-7 text-[11px] px-2"
            onClick={() => setViewMode("cards")}
          >
            <List className="h-3.5 w-3.5 mr-1" />
            Cards
          </Button>
          <Button
            variant={viewMode === "matrix" ? "default" : "outline"}
            size="sm"
            className="h-7 text-[11px] px-2"
            onClick={() => setViewMode("matrix")}
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            Matrix
          </Button>
        </div>
      </div>

      {/* Matrix view */}
      {viewMode === "matrix" && (
        <Card className="p-0 gap-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px] font-medium min-w-[180px] sticky left-0 bg-background z-10 border-r border-border">
                    Standard
                  </TableHead>
                  {students.map((student) => (
                    <TableHead key={student.id} className="text-[11px] font-medium text-center min-w-[70px]">
                      <Link
                        href={`/students/${student.id}?classId=${classId}`}
                        className="hover:text-[#c24e3f] transition-colors"
                      >
                        {student.firstName[0]}{student.lastName[0]}
                      </Link>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {standardData.map(({ goal }) => (
                  <TableRow key={goal.id}>
                    <TableCell className="sticky left-0 bg-background z-10 border-r border-border">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0 h-5">
                          {goal.code}
                        </Badge>
                        <span className="text-[12px] truncate max-w-[120px]" title={goal.title}>
                          {goal.title}
                        </span>
                      </div>
                    </TableCell>
                    {students.map((student) => {
                      const studentGrades = classGrades.filter((g) => g.studentId === student.id);
                      const mastery = findBestMasteryForGoal(student.id, goal.id, studentGrades);
                      const ml = mastery ? MASTERY_LEVELS.find((m) => m.level === mastery) : null;
                      return (
                        <TableCell key={student.id} className="text-center p-1">
                          {ml ? (
                            <span
                              className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: ml.bg, color: ml.color }}
                            >
                              {ml.label.slice(0, 3)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Card view - Standards list */}
      {viewMode === "cards" && <div className="space-y-2">
        {standardData.map(({ goal, distribution, assessed }) => {
          const isExpanded = expandedGoalId === goal.id;
          const total = assessed || 1; // avoid /0

          return (
            <Card key={goal.id} className="p-0 gap-0">
              {/* Header row */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[11px] font-mono shrink-0">
                      {goal.code}
                    </Badge>
                    <span className="text-[13px] font-medium truncate">{goal.title}</span>
                  </div>
                  {goal.strand && (
                    <span className="text-[11px] text-muted-foreground">{goal.subject} · {goal.strand}</span>
                  )}
                </div>

                {/* Mastery bar */}
                <div className="flex items-center gap-3 shrink-0 w-[260px]">
                  <div className="flex h-3 rounded-full overflow-hidden flex-1 bg-muted">
                    {MASTERY_LEVELS.map((ml) => {
                      const count = distribution[ml.level].length;
                      const pct = (count / total) * 100;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={ml.level}
                          className="h-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: ml.color }}
                          title={`${ml.label}: ${count} students (${Math.round(pct)}%)`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-muted-foreground w-[50px] text-right">
                    {assessed}/{students.length}
                  </span>
                </div>
              </button>

              {/* Expanded drill-down */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-border/50">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                    {MASTERY_LEVELS.map((ml) => {
                      const studentIds = distribution[ml.level];
                      return (
                        <div key={ml.level}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ml.color }}
                            />
                            <span className="text-[12px] font-medium" style={{ color: ml.color }}>
                              {ml.label} ({studentIds.length})
                            </span>
                          </div>
                          {studentIds.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic">None</p>
                          ) : (
                            <div className="space-y-1">
                              {studentIds.map((sid) => {
                                const student = students.find((s) => s.id === sid);
                                if (!student) return null;
                                return (
                                  <Link
                                    key={sid}
                                    href={`/students/${sid}?classId=${classId}`}
                                    className="block text-[12px] text-foreground hover:text-[#c24e3f] transition-colors"
                                  >
                                    {student.firstName} {student.lastName}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Not assessed section */}
                  {distribution.not_assessed.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <span className="text-[11px] text-muted-foreground">
                        Not assessed: {distribution.not_assessed.map((sid) => {
                          const s = students.find((st) => st.id === sid);
                          return s ? `${s.firstName} ${s.lastName}` : sid;
                        }).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>}
    </div>
  );
}
