"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Link2, Plus, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Assessment } from "@/types/assessment";
import type { LessonPlan } from "@/types/unit-planning";
import { GRADING_MODE_LABELS } from "@/lib/grade-helpers";
import { LessonSummaryCard } from "@/components/planning/lesson-summary-card";

interface UnitContentPanelProps {
  lessons: LessonPlan[];
  assessments: Assessment[];
  getAssessmentHref: (assessmentId: string) => string;
  onAddLesson: () => void;
  onOpenLesson: (lessonId: string) => void;
  onCreateAssessment: () => void;
  onOpenAssessmentLinker: () => void;
  onAutoFill: () => void;
}

export function UnitContentPanel({
  lessons,
  assessments,
  getAssessmentHref,
  onAddLesson,
  onOpenLesson,
  onCreateAssessment,
  onOpenAssessmentLinker,
  onAutoFill,
}: UnitContentPanelProps) {
  const [activeTab, setActiveTab] = useState("lessons");

  const flowItems = useMemo(
    () =>
      [
        ...lessons.map((lesson) => ({
          id: lesson.id,
          kind: "lesson" as const,
          title: lesson.title,
          label: lesson.category || "Lesson",
          order: lesson.sequence,
        })),
        ...assessments.map((assessment, index) => ({
          id: assessment.id,
          kind: "assessment" as const,
          title: assessment.title,
          label: `${(assessment.assessmentType ?? "assessment").replace(/_/g, " ")} · ${assessment.assessmentIntent ?? "assessment"}`,
          order: lessons.length + index + 1,
        })),
      ].sort((a, b) => a.order - b.order),
    [assessments, lessons]
  );

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[16px] font-semibold">Unit content</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Work inside this unit through unit-linked lessons and assessments rather than a mixed
            class backlog.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === "assessments" ? (
            <>
              <Button size="sm" onClick={onCreateAssessment}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Create assessment
              </Button>
              <Button size="sm" variant="outline" onClick={onOpenAssessmentLinker}>
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                Link existing
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onAddLesson}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add lesson
              </Button>
              <Button size="sm" variant="outline" onClick={onAutoFill}>
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Auto-fill flow
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5 space-y-4">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="flow">Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-0 space-y-3">
          {lessons.length > 0 ? (
            lessons.map((lesson) => (
              <LessonSummaryCard
                key={lesson.id}
                lesson={lesson}
                onOpen={onOpenLesson}
              />
            ))
          ) : (
            <EmptyCopy text="No lessons linked to this unit yet." />
          )}
        </TabsContent>

        <TabsContent value="assessments" className="mt-0 space-y-3">
          {assessments.length > 0 ? (
            assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-start justify-between rounded-2xl border border-border/70 bg-background px-4 py-3"
              >
                <div>
                  <Link
                    href={getAssessmentHref(assessment.id)}
                    className="text-[14px] font-medium hover:text-[#c24e3f]"
                  >
                    {assessment.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {(assessment.assessmentType ?? "assessment").replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      {assessment.assessmentIntent}
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                      {GRADING_MODE_LABELS[assessment.gradingMode]}
                    </Badge>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  {assessment.status}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyCopy text="No assessments are linked to this unit yet. Create one here or link an existing assessment into the unit." />
          )}
        </TabsContent>

        <TabsContent value="flow" className="mt-0 space-y-3">
          {flowItems.length > 0 ? (
            flowItems.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3"
              >
                <Badge variant={item.kind === "lesson" ? "secondary" : "outline"} className="text-[11px]">
                  {item.kind === "lesson" ? "Lesson" : "Assessment"}
                </Badge>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">{item.title}</p>
                  <p className="text-[12px] text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyCopy text="Flow becomes useful once lessons and assessments are linked into the unit." />
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-[13px] text-muted-foreground">{text}</p>;
}
