"use client";

import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLessonSummaryMetadata } from "@/lib/unit-planning-utils";
import type { LessonPlan } from "@/types/unit-planning";

interface LessonSummaryCardProps {
  lesson: LessonPlan;
  onOpen: (lessonId: string) => void;
}

export function LessonSummaryCard({ lesson, onOpen }: LessonSummaryCardProps) {
  const summary = getLessonSummaryMetadata(lesson);

  return (
    <button
      type="button"
      onClick={() => onOpen(lesson.id)}
      className="flex w-full items-start justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/30"
    >
      <div className="space-y-2">
        <div>
          <p className="text-[14px] font-medium">{lesson.title}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {(lesson.category || "Lesson").replace(/_/g, " ")} · {summary.statusLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[11px]">
            {summary.objectiveCount} objective{summary.objectiveCount === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline" className="text-[11px]">
            {summary.activityCount} activit{summary.activityCount === 1 ? "y" : "ies"}
          </Badge>
          <Badge variant="outline" className="text-[11px]">
            {summary.standardCount} standard{summary.standardCount === 1 ? "" : "s"}
          </Badge>
          {summary.assignmentState ? (
            <Badge variant="secondary" className="text-[11px]">
              {summary.assignmentState}
            </Badge>
          ) : null}
        </div>
      </div>

      <ArrowUpRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
    </button>
  );
}
