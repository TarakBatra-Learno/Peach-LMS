"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Target } from "lucide-react";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { Class } from "@/types/class";
import type { MasteryLevel } from "@/types/common";

interface StudentStandardsTabProps {
  studentId: string;
  grades: GradeRecord[];
  assessments: Assessment[];
  learningGoals: LearningGoal[];
  classFilter: string | null;
  classes: Class[];
}

const MASTERY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  exceeding: { label: "Exceeding", color: "#16a34a", bg: "#dcfce7", border: "#16a34a30" },
  meeting: { label: "Meeting", color: "#22c55e", bg: "#dcfce7", border: "#22c55e30" },
  approaching: { label: "Approaching", color: "#b45309", bg: "#fef3c7", border: "#b4530930" },
  beginning: { label: "Beginning", color: "#dc2626", bg: "#fee2e2", border: "#dc262630" },
};

const MASTERY_HIERARCHY: MasteryLevel[] = ["exceeding", "meeting", "approaching", "beginning"];

export function StudentStandardsTab({
  studentId,
  grades,
  assessments,
  learningGoals,
  classFilter,
  classes,
}: StudentStandardsTabProps) {
  // Collect all standards & skills the student has data for
  const standardData = useMemo(() => {
    // Map: standardId → array of { assessmentId, level, classId }
    const masteryByStandard = new Map<
      string,
      { assessmentId: string; level: MasteryLevel; classId: string }[]
    >();

    grades.forEach((grade) => {
      if (!grade.standardsMastery || grade.standardsMastery.length === 0) return;
      grade.standardsMastery.forEach((sm) => {
        if (sm.level === "not_assessed") return;
        if (!masteryByStandard.has(sm.standardId)) {
          masteryByStandard.set(sm.standardId, []);
        }
        masteryByStandard.get(sm.standardId)!.push({
          assessmentId: grade.assessmentId,
          level: sm.level,
          classId: grade.classId,
        });
      });
    });

    // Build display data for each standard
    const result: {
      goal: LearningGoal;
      bestLevel: MasteryLevel;
      assessmentEntries: {
        assessmentId: string;
        assessmentTitle: string;
        level: MasteryLevel;
        className: string;
      }[];
    }[] = [];

    masteryByStandard.forEach((entries, standardId) => {
      const goal = learningGoals.find((g) => g.id === standardId);
      if (!goal) return;

      // Find best mastery level
      let bestIdx = MASTERY_HIERARCHY.length;
      entries.forEach((e) => {
        const idx = MASTERY_HIERARCHY.indexOf(e.level);
        if (idx !== -1 && idx < bestIdx) bestIdx = idx;
      });
      const bestLevel = bestIdx < MASTERY_HIERARCHY.length ? MASTERY_HIERARCHY[bestIdx] : "beginning";

      // Build per-assessment entries
      const assessmentEntries = entries
        .map((e) => {
          const asmt = assessments.find((a) => a.id === e.assessmentId);
          const cls = classes.find((c) => c.id === e.classId);
          return {
            assessmentId: e.assessmentId,
            assessmentTitle: asmt?.title ?? e.assessmentId,
            level: e.level,
            className: cls?.name ?? "",
          };
        })
        // Remove duplicates (same assessment can appear once per standard)
        .filter(
          (entry, idx, arr) =>
            arr.findIndex((e) => e.assessmentId === entry.assessmentId) === idx
        );

      result.push({ goal, bestLevel, assessmentEntries });
    });

    // Sort by standard code
    result.sort((a, b) => a.goal.code.localeCompare(b.goal.code));

    return result;
  }, [grades, assessments, learningGoals, classes]);

  const totalAssessments = useMemo(() => {
    const ids = new Set<string>();
    standardData.forEach((sd) => {
      sd.assessmentEntries.forEach((e) => ids.add(e.assessmentId));
    });
    return ids.size;
  }, [standardData]);

  if (standardData.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No standards & skills data"
        description={
          classFilter
            ? "No standards & skills data for this class yet."
            : "Standards & skills data will appear here once assessments are graded."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-[13px] text-muted-foreground">
        <span className="font-semibold text-foreground">{standardData.length}</span> standard{standardData.length !== 1 ? "s" : ""} assessed across{" "}
        <span className="font-semibold text-foreground">{totalAssessments}</span> assessment{totalAssessments !== 1 ? "s" : ""}
      </p>

      {/* Legend */}
      <div className="flex items-center gap-3">
        {MASTERY_HIERARCHY.map((level) => {
          const cfg = MASTERY_CONFIG[level];
          return (
            <div key={level} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Standard cards */}
      <div className="space-y-3">
        {standardData.map(({ goal, bestLevel, assessmentEntries }) => {
          const cfg = MASTERY_CONFIG[bestLevel];
          return (
            <Card key={goal.id} className="p-4 gap-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-[11px] font-mono shrink-0">
                    {goal.code}
                  </Badge>
                  <span className="text-[13px] font-medium truncate">{goal.title}</span>
                  {goal.strand && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      · {goal.strand}
                    </span>
                  )}
                </div>
                <Badge
                  className="text-[11px] font-medium shrink-0 ml-2"
                  style={{
                    backgroundColor: cfg.bg,
                    color: cfg.color,
                    borderColor: cfg.border,
                  }}
                >
                  {cfg.label}
                </Badge>
              </div>

              {/* Per-assessment breakdown */}
              <div className="space-y-1.5">
                {assessmentEntries.map((entry) => {
                  const entryCfg = MASTERY_CONFIG[entry.level];
                  return (
                    <div
                      key={entry.assessmentId}
                      className="flex items-center justify-between py-1 text-[12px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          href={`/assessments/${entry.assessmentId}`}
                          className="text-foreground hover:text-[#c24e3f] transition-colors truncate"
                        >
                          {entry.assessmentTitle}
                        </Link>
                        {!classFilter && entry.className && (
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {entry.className}
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[11px] font-medium shrink-0"
                        style={{ color: entryCfg.color }}
                      >
                        {entryCfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
