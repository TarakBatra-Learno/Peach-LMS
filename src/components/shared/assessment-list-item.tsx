"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { getToMarkCount, GRADING_MODE_LABELS } from "@/lib/grade-helpers";
import { computeUnreleasedGradesCount } from "@/lib/selectors/grade-selectors";
import { Calendar, Users } from "lucide-react";
import type { Assessment } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";

interface AssessmentListItemProps {
  assessment: Assessment;
  grades: GradeRecord[];
  studentIds: string[];
  /** Optional class name to display (shown on the assessments index page) */
  className?: string;
  /** Override default href (/assessments/{id}) — class detail uses ?classId= */
  href?: string;
  /** Card layout: "card" (grid card with full info) or "row" (compact list row) */
  variant?: "card" | "row";
  /** Optional unit title to show a unit tag */
  unitTitle?: string;
  /** Number of students who have been graded */
  gradedCount?: number;
  /** Total number of students in the class */
  totalStudents?: number;
}

export function AssessmentListItem({
  assessment,
  grades,
  studentIds,
  className,
  href,
  variant = "row",
  unitTitle,
  gradedCount,
  totalStudents,
}: AssessmentListItemProps) {
  const toMark = assessment.status === "live"
    ? getToMarkCount(studentIds, grades, assessment)
    : 0;

  const unreleasedCount = assessment.status === "live"
    ? computeUnreleasedGradesCount(grades, assessment.id)
    : 0;

  const resolvedHref = href || `/assessments/${assessment.id}`;

  if (variant === "card") {
    return (
      <Link href={resolvedHref}>
        <Card className="p-5 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:border-border/80 transition-all cursor-pointer h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold truncate">
                {assessment.title}
              </h3>
              {assessment.description && (
                <p className="text-[13px] text-muted-foreground line-clamp-2 mt-0.5">
                  {assessment.description}
                </p>
              )}
            </div>
            <StatusBadge status={assessment.status} className="ml-2 shrink-0" />
          </div>

          <div className="flex items-center gap-3 text-[12px] text-muted-foreground mb-3">
            {className && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {className}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(parseISO(assessment.dueDate), "MMM d, yyyy")}
            </span>
          </div>

          {unitTitle && (
            <p className="text-[11px] text-muted-foreground hover:underline hover:text-foreground cursor-pointer mb-2">
              {unitTitle}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-auto flex-wrap">
            <Badge variant="outline" className="text-[11px] font-medium">
              {GRADING_MODE_LABELS[assessment.gradingMode]}
            </Badge>
            {assessment.totalPoints != null && assessment.gradingMode === "score" && (
              <Badge variant="secondary" className="text-[11px] font-medium">
                {assessment.totalPoints} pts
              </Badge>
            )}
            {toMark > 0 && (
              <Badge className="bg-[#fef3c7] text-[#b45309] border-[#b45309]/20 text-[11px] font-medium hover:bg-[#fef3c7]">
                {toMark} to mark
              </Badge>
            )}
            {unreleasedCount > 0 && (
              <Badge className="bg-[#dbeafe] text-[#2563eb] border-[#2563eb]/20 text-[11px] font-medium hover:bg-[#dbeafe]">
                {unreleasedCount} unreleased
              </Badge>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  // Row variant (compact, for class detail assessments tab)
  return (
    <Link href={resolvedHref}>
      <Card className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium">{assessment.title}</p>
            <p className="text-[12px] text-muted-foreground">
              Due {format(parseISO(assessment.dueDate), "MMM d, yyyy")} · {GRADING_MODE_LABELS[assessment.gradingMode]}
              {unitTitle && (
                <span className="text-[11px] text-muted-foreground hover:underline hover:text-foreground cursor-pointer ml-1">
                  · {unitTitle}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {toMark > 0 && (
              <Badge className="bg-[#fef3c7] text-[#b45309] border-[#b45309]/20 text-[11px] font-medium hover:bg-[#fef3c7]">
                {toMark} to mark
              </Badge>
            )}
            {unreleasedCount > 0 && (
              <Badge className="bg-[#dbeafe] text-[#2563eb] border-[#2563eb]/20 text-[11px] font-medium hover:bg-[#dbeafe]">
                {unreleasedCount} unreleased
              </Badge>
            )}
            <StatusBadge status={assessment.status} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
