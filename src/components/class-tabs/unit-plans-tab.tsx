"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { BookOpen, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { StrategyEditDrawer } from "@/components/unit-planning/strategy-edit-drawer";
import { LessonPlanDrawer } from "@/components/unit-planning/lesson-plan-drawer";
import { AssignLessonDialog } from "@/components/unit-planning/assign-lesson-dialog";
import { LinkAssessmentDialog } from "@/components/unit-planning/link-assessment-dialog";
import { UnitDetailWorkspace } from "@/components/planning/unit-detail-workspace";
import {
  getUnitProgress,
  getUnassignedLessonPlans,
  getUnitAssessments,
  materializeTimetableOccurrences,
} from "@/lib/unit-planning-utils";
import { getDemoNow } from "@/lib/demo-time";
import type { Programme } from "@/types/common";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { TimetableSlot } from "@/types/class";
import type { GradeRecord } from "@/types/gradebook";
import type { Student } from "@/types/student";
import type {
  LessonPlan,
  LessonSlotAssignment,
  MaterializedOccurrence,
  UnitPlan,
} from "@/types/unit-planning";
import {
  getAdminClassAssessmentHref,
  getAdminStudentWorkspaceHref,
} from "@/lib/admin-embed-routes";

interface UnitPlansTabProps {
  classId: string;
  programme: Programme;
  embedded?: boolean;
  units: UnitPlan[];
  lessonPlans: LessonPlan[];
  lessonSlotAssignments: LessonSlotAssignment[];
  assessments: Assessment[];
  learningGoals: LearningGoal[];
  timetableSlots: TimetableSlot[];
  students: Student[];
  grades: GradeRecord[];
}

type PlanningSubview = "year_plan" | "unit_workspace" | "lessons";

function parsePlanningSubview(value: string | null): PlanningSubview | null {
  if (value === "year_plan") return "year_plan";
  if (value === "unit_workspace" || value === "unit_detail") return "unit_workspace";
  if (value === "lessons") return "lessons";
  return null;
}

function today() {
  return getDemoNow();
}

export function UnitPlansTab({
  classId,
  programme,
  embedded = false,
  units,
  lessonPlans,
  lessonSlotAssignments,
  assessments,
  learningGoals,
  timetableSlots,
  students,
  grades,
}: UnitPlansTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedUnitId = searchParams.get("selectedUnitId");
  const requestedLessonId = searchParams.get("selectedLessonId");
  const requestedPlanningView = searchParams.get("planningView");
  const initialRequestedUnitId =
    requestedUnitId && units.some((unit) => unit.id === requestedUnitId)
      ? requestedUnitId
      : null;
  const initialRequestedLesson =
    requestedLessonId
      ? lessonPlans.find((lesson) => lesson.id === requestedLessonId) ?? null
      : null;
  const initialSubview = initialRequestedLesson
    ? "lessons"
    : parsePlanningSubview(requestedPlanningView) ?? "year_plan";
  const getAssessmentHref = (assessmentId: string) =>
    embedded
      ? getAdminClassAssessmentHref(classId, assessmentId)
      : `/assessments/${assessmentId}?classId=${classId}`;
  const getStudentHref = (studentId: string) =>
    embedded
      ? getAdminStudentWorkspaceHref(studentId, { classId })
      : `/students/${studentId}?classId=${classId}`;

  const addUnitPlan = useStore((s) => s.addUnitPlan);
  const updateUnitPlan = useStore((s) => s.updateUnitPlan);
  const deleteUnitPlan = useStore((s) => s.deleteUnitPlan);
  const addLessonPlan = useStore((s) => s.addLessonPlan);
  const assignLessonToSlot = useStore((s) => s.assignLessonToSlot);
  const unassignLessonFromSlot = useStore((s) => s.unassignLessonFromSlot);
  const autoFillLessonSequence = useStore((s) => s.autoFillLessonSequence);
  const linkAssessmentToUnit = useStore((s) => s.linkAssessmentToUnit);
  const unlinkAssessmentFromUnit = useStore((s) => s.unlinkAssessmentFromUnit);

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    initialRequestedLesson?.unitId ?? initialRequestedUnitId ?? units[0]?.id ?? null
  );
  const [activeSubview, setActiveSubview] = useState<PlanningSubview>(initialSubview);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteConfirmUnit, setDeleteConfirmUnit] = useState<string | null>(null);
  const [strategyDrawerOpen, setStrategyDrawerOpen] = useState(false);
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(Boolean(initialRequestedLesson));
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    initialRequestedLesson?.id ?? null
  );
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignOccurrence, setAssignOccurrence] = useState<MaterializedOccurrence | null>(null);
  const [linkAssessmentOpen, setLinkAssessmentOpen] = useState(false);

  const syncPlanningRoute = (
    view: PlanningSubview,
    nextUnitId: string | null,
    nextLessonId?: string | null
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "units");
    params.set("planningView", view);
    if (nextUnitId) {
      params.set("selectedUnitId", nextUnitId);
    } else {
      params.delete("selectedUnitId");
    }
    if (nextLessonId) {
      params.set("selectedLessonId", nextLessonId);
    } else {
      params.delete("selectedLessonId");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filteredUnits = useMemo(() => {
    let result = [...units].sort((a, b) => a.order - b.order);
    if (statusFilter !== "all") {
      result = result.filter((unit) => unit.status === statusFilter);
    }
    return result;
  }, [statusFilter, units]);

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId) ?? null,
    [selectedUnitId, units]
  );

  const unitLessonPlans = useMemo(
    () =>
      selectedUnit
        ? lessonPlans
            .filter((lessonPlan) => lessonPlan.unitId === selectedUnit.id)
            .sort((a, b) => a.sequence - b.sequence)
        : [],
    [lessonPlans, selectedUnit]
  );

  const unitAssignments = useMemo(
    () =>
      selectedUnit
        ? lessonSlotAssignments.filter((assignment) => assignment.unitId === selectedUnit.id)
        : [],
    [lessonSlotAssignments, selectedUnit]
  );

  const unitAssessments = useMemo(
    () => (selectedUnit ? getUnitAssessments(assessments, selectedUnit.id) : []),
    [assessments, selectedUnit]
  );

  const unitOccurrences = useMemo(() => {
    if (!selectedUnit) return [];
    return materializeTimetableOccurrences(
      timetableSlots,
      selectedUnit.startDate,
      selectedUnit.endDate
    );
  }, [selectedUnit, timetableSlots]);

  const selectedLesson = useMemo(
    () => lessonPlans.find((lesson) => lesson.id === (selectedLessonId ?? "")) ?? null,
    [lessonPlans, selectedLessonId]
  );

  const selectedLessonAssignment = useMemo(
    () =>
      selectedLessonId
        ? lessonSlotAssignments.find((assignment) => assignment.lessonPlanId === selectedLessonId)
        : undefined,
    [lessonSlotAssignments, selectedLessonId]
  );

  const handleCreateUnit = () => {
    const now = today();
    const newUnit: UnitPlan = {
      id: `unit_new_${now.getTime()}`,
      classId,
      title: "New Unit Plan",
      programme,
      status: "draft",
      startDate: format(now, "yyyy-MM-dd"),
      endDate: format(new Date(now.getTime() + 21 * 86400000), "yyyy-MM-dd"),
      strategy: {
        learningGoals: [],
        linkedStandardIds: [],
      },
      lessonPlanIds: [],
      order: units.length + 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    addUnitPlan(newUnit);
    toast.success("Unit plan created");
    router.push(`/planning/units/${newUnit.id}`);
  };

  const handleDeleteUnit = () => {
    if (!deleteConfirmUnit) return;
    deleteUnitPlan(deleteConfirmUnit);
    if (selectedUnitId === deleteConfirmUnit) {
      const fallbackUnitId = units.find((unit) => unit.id !== deleteConfirmUnit)?.id ?? null;
      setSelectedUnitId(fallbackUnitId);
      syncPlanningRoute("year_plan", fallbackUnitId);
    }
    setDeleteConfirmUnit(null);
    toast.success("Unit plan deleted");
  };

  const handleAddLesson = () => {
    const targetUnit = selectedUnit ?? filteredUnits[0] ?? null;
    if (!targetUnit) return;
    const now = today().toISOString();
    const existingUnitLessons = lessonPlans.filter((lesson) => lesson.unitId === targetUnit.id);
    const newLesson: LessonPlan = {
      id: `lp_new_${Date.now()}`,
      unitId: targetUnit.id,
      classId,
      title: `Lesson ${existingUnitLessons.length + 1}`,
      sequence: existingUnitLessons.length + 1,
      activities: [],
      linkedStandardIds: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    addLessonPlan(newLesson);
    setSelectedUnitId(targetUnit.id);
    setSelectedLessonId(newLesson.id);
    setLessonDrawerOpen(true);
    setActiveSubview("lessons");
    syncPlanningRoute("lessons", targetUnit.id);
    toast.success("Lesson plan added");
  };

  const handleOpenLesson = (lessonId: string) => {
    const lesson = lessonPlans.find((entry) => entry.id === lessonId);
    if (lesson) {
      setSelectedUnitId(lesson.unitId);
    }
    setSelectedLessonId(lessonId);
    setLessonDrawerOpen(true);
  };

  const handleAssignLesson = (lessonPlanId: string) => {
    if (!assignOccurrence || !selectedUnit) return;
    assignLessonToSlot({
      id: `lsa_new_${Date.now()}`,
      lessonPlanId,
      unitId: selectedUnit.id,
      classId,
      date: assignOccurrence.date,
      slotDay: assignOccurrence.slotDay,
      slotStartTime: assignOccurrence.slotStartTime,
      createdAt: today().toISOString(),
    });
    setAssignDialogOpen(false);
    setAssignOccurrence(null);
    toast.success("Lesson assigned to slot");
  };

  const handleAutoFill = () => {
    if (!selectedUnit) return;
    const count = autoFillLessonSequence(selectedUnit.id);
    if (count === 0) {
      toast("No lessons assigned", {
        description: "Either no ready lesson plans or no available slots.",
      });
    } else {
      toast.success(`Assigned ${count} lesson plan${count !== 1 ? "s" : ""}`);
    }
  };

  const handleLinkAssessments = (assessmentIds: string[]) => {
    if (!selectedUnit) return;
    for (const assessmentId of assessmentIds) {
      linkAssessmentToUnit(assessmentId, selectedUnit.id);
    }
    setLinkAssessmentOpen(false);
    toast.success(
      `Linked ${assessmentIds.length} assessment${assessmentIds.length !== 1 ? "s" : ""}`
    );
  };

  if (units.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No unit plans"
        description="Create your first unit plan to organize lessons, assessments, and teaching strategy."
        action={{ label: "Create Unit Plan", onClick: handleCreateUnit }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreateUnit}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Create Unit
          </Button>
          <Button size="sm" variant="outline" onClick={handleAddLesson}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Lesson
          </Button>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px] text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[12px]">
              All statuses
            </SelectItem>
            <SelectItem value="draft" className="text-[12px]">
              Draft
            </SelectItem>
            <SelectItem value="active" className="text-[12px]">
              Active
            </SelectItem>
            <SelectItem value="completed" className="text-[12px]">
              Completed
            </SelectItem>
            <SelectItem value="archived" className="text-[12px]">
              Archived
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={activeSubview}
        onValueChange={(value) => {
          const nextView = value as PlanningSubview;
          setActiveSubview(nextView);
          syncPlanningRoute(nextView, selectedUnitId);
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="year_plan">Year plan</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
        </TabsList>

        <TabsContent value="year_plan" className="mt-0">
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredUnits.map((unit) => {
              const progress = getUnitProgress(lessonPlans.filter((lesson) => lesson.unitId === unit.id));
              const unitAsmts = getUnitAssessments(assessments, unit.id);
              const isSelected = selectedUnitId === unit.id;

              return (
                <Card
                  key={unit.id}
                  className={`p-5 ${isSelected ? "border-[#f3c7c0] bg-[#fff8f6]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {unit.code ? <Badge variant="outline">{unit.code}</Badge> : null}
                        <StatusBadge status={unit.status} showIcon={false} />
                      </div>
                      <button
                        type="button"
                        className="mt-3 text-left text-[18px] font-semibold hover:text-[#c24e3f]"
                        onClick={() => router.push(`/planning/units/${unit.id}`)}
                      >
                        {unit.title}
                      </button>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                        {unit.summary || "Add a summary to strengthen the yearly planning narrative."}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmUnit(unit.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Lesson count
                      </p>
                      <p className="mt-2 text-[18px] font-semibold">{progress.total}</p>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Assessment count
                      </p>
                      <p className="mt-2 text-[18px] font-semibold">{unitAsmts.length}</p>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Collaborators
                      </p>
                      <p className="mt-2 text-[18px] font-semibold">
                        {unit.collaborators?.length ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(unit.collaborators ?? []).map((collaborator) => (
                      <Badge key={collaborator.id} variant="outline">
                        {collaborator.initials}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-[12px] text-muted-foreground">
                      {unit.startDate} to {unit.endDate}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/planning/units/${unit.id}`)}
                    >
                      Open unit
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="unit_workspace" className="mt-0 space-y-4">
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-[16px] font-semibold">Unit workspace</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Switch units here to review inquiry, flow, evidence, and reflection without relying on another tab to define context.
                </p>
              </div>
              <div className="w-full lg:w-[320px]">
                <Select
                  value={selectedUnitId ?? undefined}
                  onValueChange={(value) => {
                    setSelectedUnitId(value);
                    syncPlanningRoute("unit_workspace", value);
                  }}
                >
                  <SelectTrigger aria-label="Selected unit">
                    <SelectValue placeholder="Choose a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {selectedUnit ? (
            <UnitDetailWorkspace
              unit={selectedUnit}
              learningGoals={learningGoals}
              lessons={unitLessonPlans}
              assessments={unitAssessments}
              assignments={unitAssignments}
              occurrences={unitOccurrences}
              students={students}
              grades={grades}
              embedded={embedded}
              getAssessmentHref={getAssessmentHref}
              getStudentHref={getStudentHref}
              onEditStrategy={() => setStrategyDrawerOpen(true)}
              onAddLesson={handleAddLesson}
              onOpenLesson={handleOpenLesson}
              onOpenAssessmentLinker={() => setLinkAssessmentOpen(true)}
              onAutoFill={handleAutoFill}
              onPrepareAssign={(occurrence) => {
                setAssignOccurrence(occurrence);
                setAssignDialogOpen(true);
              }}
              onUnassignLesson={(lessonPlanId) => {
                unassignLessonFromSlot(lessonPlanId);
                toast.success("Lesson unassigned");
              }}
              onUnlinkAssessment={(assessmentId) => {
                unlinkAssessmentFromUnit(assessmentId);
                toast.success("Assessment unlinked");
              }}
            />
          ) : (
            <Card className="flex min-h-[320px] items-center justify-center p-6 text-[13px] text-muted-foreground">
              Choose a unit to open its workspace.
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lessons" className="mt-0">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold">Class lesson plans</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Cross-unit lesson backlog for this class. Open any lesson to review its plan without changing the current unit workspace selection.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddLesson}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add lesson
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {lessonPlans
                .slice()
                .sort((a, b) => a.sequence - b.sequence)
                .map((lesson) => {
                  const parentUnit = units.find((unit) => unit.id === lesson.unitId);
                  const assignment = lessonSlotAssignments.find(
                    (entry) => entry.lessonPlanId === lesson.id
                  );
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleOpenLesson(lesson.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-border/70 p-3 text-left transition-colors hover:bg-muted/30"
                    >
                      <div>
                        <p className="text-[13px] font-medium">{lesson.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {parentUnit?.title ?? "No unit"} · {lesson.category || "Lesson"} ·{" "}
                          {lesson.status}
                        </p>
                        {assignment ? (
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            Scheduled {assignment.date} at {assignment.slotStartTime}
                          </p>
                        ) : null}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedUnit ? (
        <StrategyEditDrawer
          open={strategyDrawerOpen}
          onOpenChange={setStrategyDrawerOpen}
          strategy={selectedUnit.strategy}
          programme={selectedUnit.programme}
          learningGoals={learningGoals}
          onSave={(strategy) => {
            updateUnitPlan(selectedUnit.id, {
              strategy,
              updatedAt: today().toISOString(),
            });
            toast.success("Strategy updated");
          }}
        />
      ) : null}

      <LessonPlanDrawer
        key={`${selectedLesson?.id ?? "none"}-${lessonDrawerOpen ? "open" : "closed"}`}
        open={lessonDrawerOpen}
        onOpenChange={(open) => {
          setLessonDrawerOpen(open);
          if (!open) {
            setSelectedLessonId(null);
            syncPlanningRoute("lessons", selectedUnitId);
          }
        }}
        lessonPlan={selectedLesson}
        learningGoals={learningGoals}
        assignment={selectedLessonAssignment}
      />

      <AssignLessonDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        occurrence={assignOccurrence}
        readyLessonPlans={getUnassignedLessonPlans(unitLessonPlans)}
        onAssign={handleAssignLesson}
      />

      <LinkAssessmentDialog
        open={linkAssessmentOpen}
        onOpenChange={setLinkAssessmentOpen}
        assessments={assessments.filter((assessment) => assessment.classId === classId && !assessment.unitId)}
        unitId={selectedUnit?.id ?? ""}
        onLink={handleLinkAssessments}
      />

      <ConfirmDialog
        open={!!deleteConfirmUnit}
        onOpenChange={(open) => !open && setDeleteConfirmUnit(null)}
        title="Delete Unit Plan"
        description="This will delete the unit, all its lesson plans, slot assignments, and unlink any assessments. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteUnit}
      />
    </div>
  );
}
