"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitDetailWorkspace } from "@/components/planning/unit-detail-workspace";
import { UnitContentPanel } from "@/components/planning/unit-content-panel";
import { UnitPerformancePanel } from "@/components/planning/unit-performance-panel";
import { UnitReflectionPanel } from "@/components/planning/unit-reflection-panel";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { Student } from "@/types/student";
import type {
  LessonPlan,
  LessonSlotAssignment,
  MaterializedOccurrence,
  UnitPlan,
} from "@/types/unit-planning";

interface UnitRouteShellProps {
  unit: UnitPlan;
  className: string;
  learningGoals: LearningGoal[];
  lessons: LessonPlan[];
  assessments: Assessment[];
  assignments: LessonSlotAssignment[];
  occurrences: MaterializedOccurrence[];
  students: Student[];
  grades: GradeRecord[];
  embedded?: boolean;
  getAssessmentHref: (assessmentId: string) => string;
  getStudentHref: (studentId: string) => string;
  onEditStrategy: () => void;
  onAddLesson: () => void;
  onOpenLesson: (lessonId: string) => void;
  onCreateAssessment: () => void;
  onOpenAssessmentLinker: () => void;
  onAutoFill: () => void;
  onPrepareAssign: (occurrence: MaterializedOccurrence) => void;
  onUnassignLesson: (lessonPlanId: string) => void;
  onUnlinkAssessment: (assessmentId: string) => void;
}

export function UnitRouteShell({
  unit,
  className,
  learningGoals,
  lessons,
  assessments,
  assignments,
  occurrences,
  students,
  grades,
  embedded = false,
  getAssessmentHref,
  getStudentHref,
  onEditStrategy,
  onAddLesson,
  onOpenLesson,
  onCreateAssessment,
  onOpenAssessmentLinker,
  onAutoFill,
  onPrepareAssign,
  onUnassignLesson,
  onUnlinkAssessment,
}: UnitRouteShellProps) {
  const [activeTab, setActiveTab] = useState("strategy");

  return (
    <div className="space-y-5">
      <Card className="rounded-3xl border border-border/70 bg-card px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{className}</Badge>
              <Badge variant="secondary">{unit.programme}</Badge>
              {unit.code ? <Badge variant="outline">{unit.code}</Badge> : null}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{unit.title}</h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-muted-foreground">
              {unit.summary || "Open the tabs below to plan, teach, review performance, and reflect on this unit."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Lessons" value={lessons.length.toString()} />
            <Metric label="Assessments" value={assessments.length.toString()} />
            <Metric label="Collaborators" value={(unit.collaborators?.length ?? 0).toString()} />
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="content">Unit content</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reflection">Reflection</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="mt-0">
          <UnitDetailWorkspace
            unit={unit}
            learningGoals={learningGoals}
            lessons={lessons}
            assessments={assessments}
            assignments={assignments}
            occurrences={occurrences}
            students={students}
            grades={grades}
            embedded={embedded}
            getAssessmentHref={getAssessmentHref}
            getStudentHref={getStudentHref}
            onEditStrategy={onEditStrategy}
            onAddLesson={onAddLesson}
            onOpenLesson={onOpenLesson}
            onOpenAssessmentLinker={onOpenAssessmentLinker}
            onAutoFill={onAutoFill}
            onPrepareAssign={onPrepareAssign}
            onUnassignLesson={onUnassignLesson}
            onUnlinkAssessment={onUnlinkAssessment}
          />
        </TabsContent>

        <TabsContent value="content" className="mt-0">
          <UnitContentPanel
            lessons={lessons}
            assessments={assessments}
            getAssessmentHref={getAssessmentHref}
            onAddLesson={onAddLesson}
            onOpenLesson={onOpenLesson}
            onCreateAssessment={onCreateAssessment}
            onOpenAssessmentLinker={onOpenAssessmentLinker}
            onAutoFill={onAutoFill}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-0">
          <UnitPerformancePanel
            unit={unit}
            students={students}
            assessments={assessments}
            grades={grades}
            learningGoals={learningGoals}
            getStudentHref={getStudentHref}
          />
        </TabsContent>

        <TabsContent value="reflection" className="mt-0">
          <UnitReflectionPanel unit={unit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-[20px] font-semibold">{value}</p>
    </div>
  );
}
