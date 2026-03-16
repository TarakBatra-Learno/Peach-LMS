"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookCopy, CalendarRange, Grid2x2, Plus, Rows3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Class } from "@/types/class";
import type { Assessment } from "@/types/assessment";
import type { LessonPlan, UnitPlan } from "@/types/unit-planning";
import {
  buildCurriculumMapRows,
  buildPlanningInsightSummaries,
  buildPlanningUnitCardSummaries,
  groupPlanningTimelineByClass,
} from "@/lib/planning-selectors";
import { PlanningCreateDialog, type PlanningCreateInput } from "@/components/planning/planning-create-dialog";
import { PlanningTimelineView } from "@/components/planning/planning-timeline-view";
import { PlanningInsightsPanel } from "@/components/planning/planning-insights-panel";

interface PlanningHubProps {
  classes: Class[];
  units: UnitPlan[];
  lessons: LessonPlan[];
  assessments: Assessment[];
  onCreatePlan: (input: PlanningCreateInput) => void;
}

export function PlanningHub({
  classes,
  units,
  lessons,
  assessments,
  onCreatePlan,
}: PlanningHubProps) {
  const [activeTab, setActiveTab] = useState("yearly");
  const [yearlyView, setYearlyView] = useState<"cards" | "timeline">("cards");
  const [classFilter, setClassFilter] = useState("all");
  const [selectedInsightId, setSelectedInsightId] = useState<
    "standards_skills" | "concepts_inquiry" | "timeline_pacing"
  >("standards_skills");
  const [createOpen, setCreateOpen] = useState(false);

  const planningCards = useMemo(
    () => buildPlanningUnitCardSummaries(classes, units, lessons, assessments),
    [assessments, classes, lessons, units]
  );
  const timelineGroups = useMemo(
    () => groupPlanningTimelineByClass(classes, units, lessons, assessments),
    [assessments, classes, lessons, units]
  );
  const insightSummaries = useMemo(
    () => buildPlanningInsightSummaries(units, lessons, assessments),
    [assessments, lessons, units]
  );
  const curriculumMapRows = useMemo(
    () => buildCurriculumMapRows(classes, units, lessons, assessments),
    [assessments, classes, lessons, units]
  );

  const filteredCards = useMemo(
    () =>
      planningCards.filter((card) => classFilter === "all" || card.classId === classFilter),
    [classFilter, planningCards]
  );
  const filteredTimelineGroups = useMemo(
    () =>
      timelineGroups.filter((group) => classFilter === "all" || group.classId === classFilter),
    [classFilter, timelineGroups]
  );
  const filteredMapRows = useMemo(
    () => curriculumMapRows.filter((row) => classFilter === "all" || row.classId === classFilter),
    [classFilter, curriculumMapRows]
  );

  return (
    <>
      <PageHeader
        title="Planning"
        description="Cross-class yearly planning, seeded planning insights, and curriculum map views that stay connected to the live class planning surfaces."
        primaryAction={{
          label: "Create",
          icon: Plus,
          onClick: () => setCreateOpen(true),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{units.length} units</Badge>
          <Badge variant="outline">{lessons.length} lessons</Badge>
          <Badge variant="outline">{assessments.filter((assessment) => assessment.unitId).length} linked assessments</Badge>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="yearly">Yearly plans</TabsTrigger>
            <TabsTrigger value="insights">Planning insights</TabsTrigger>
            <TabsTrigger value="maps">Curriculum maps</TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger aria-label="Planning class filter" className="w-[220px]">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTab === "yearly" ? (
              <div className="inline-flex rounded-lg border border-border/70 bg-background p-1">
                <button
                  type="button"
                  onClick={() => setYearlyView("cards")}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium ${
                    yearlyView === "cards" ? "bg-muted text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Grid2x2 className="h-3.5 w-3.5" />
                  Card view
                </button>
                <button
                  type="button"
                  onClick={() => setYearlyView("timeline")}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium ${
                    yearlyView === "timeline" ? "bg-muted text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Rows3 className="h-3.5 w-3.5" />
                  Timeline view
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <TabsContent value="yearly" className="mt-0 space-y-4">
          {yearlyView === "cards" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredCards.map((card) => (
                <Card key={card.unitId} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">
                        {card.className}
                      </p>
                      <h3 className="mt-2 text-[18px] font-semibold">{card.title}</h3>
                    </div>
                    <Badge variant="secondary">{card.status}</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Lesson count
                      </p>
                      <p className="mt-2 text-[18px] font-semibold">{card.lessonCount}</p>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Assessment count
                      </p>
                      <p className="mt-2 text-[18px] font-semibold">{card.assessmentCount}</p>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Collaborators
                      </p>
                      <p className="mt-2 text-[18px] font-semibold">{card.collaboratorCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">{card.programme}</Badge>
                    <Badge variant="outline">
                      {card.durationWeeks ? `${card.durationWeeks} weeks` : card.durationHours ? `${card.durationHours} hours` : "Duration pending"}
                    </Badge>
                    <Badge variant="outline">{card.inquiryQuestionCount} inquiry prompts</Badge>
                    <Badge variant="outline">{card.standardsCoverageSignal} coverage</Badge>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-[12px] text-muted-foreground">
                      {card.startDate} to {card.endDate}
                    </p>
                    <Link
                      href={`/classes/${card.classId}?tab=units`}
                      className="inline-flex items-center gap-2 text-[13px] font-medium text-[#c24e3f]"
                    >
                      Open class planning
                      <CalendarRange className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <PlanningTimelineView groups={filteredTimelineGroups} />
          )}
        </TabsContent>

        <TabsContent value="insights" className="mt-0">
          <PlanningInsightsPanel
            insights={insightSummaries}
            selectedInsightId={selectedInsightId}
            onSelectInsightId={setSelectedInsightId}
            rows={filteredMapRows}
          />
        </TabsContent>

        <TabsContent value="maps" className="mt-0">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[16px] font-semibold">Curriculum maps</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Read-only curriculum map rows derived from linked units, standards, lessons, and assessments.
                </p>
              </div>
              <Button variant="outline" size="sm">
                <BookCopy className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Class</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Unit</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Duration</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMapRows.map((row) => (
                    <tr key={row.unitId} className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.className}</p>
                        <p className="text-[12px] text-muted-foreground">{row.programme}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{row.unitTitle}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.durationLabel}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {row.keySignals.map((signal) => (
                            <Badge key={signal} variant="outline">
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <PlanningCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        classes={classes}
        units={units}
        onCreate={onCreatePlan}
      />
    </>
  );
}
