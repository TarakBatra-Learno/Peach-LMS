"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StrategyEditDrawer } from "@/components/unit-planning/strategy-edit-drawer";
import { LessonPlanDrawer } from "@/components/unit-planning/lesson-plan-drawer";
import { AssignLessonDialog } from "@/components/unit-planning/assign-lesson-dialog";
import { LinkAssessmentDialog } from "@/components/unit-planning/link-assessment-dialog";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  LinkIcon,
  ExternalLink,
  Zap,
  Unlink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/stores";
import { format, parseISO } from "date-fns";
import {
  getUnitProgress,
  getUnassignedLessonPlans,
  getUnitAssessments,
  materializeTimetableOccurrences,
} from "@/lib/unit-planning-utils";
import type { Programme } from "@/types/common";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { TimetableSlot } from "@/types/class";
import type { Student } from "@/types/student";
import type { GradeRecord } from "@/types/gradebook";
import type {
  UnitPlan,
  LessonPlan,
  LessonSlotAssignment,
  UnitStatus,
  MaterializedOccurrence,
} from "@/types/unit-planning";
import { getGradeCellDisplay, getGradePercentage, GRADING_MODE_LABELS } from "@/lib/grade-helpers";
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
  const getAssessmentHref = (assessmentId: string) =>
    embedded
      ? getAdminClassAssessmentHref(classId, assessmentId)
      : `/assessments/${assessmentId}?classId=${classId}`;
  const getStudentHref = (studentId: string) =>
    embedded
      ? getAdminStudentWorkspaceHref(studentId, { classId })
      : `/students/${studentId}?classId=${classId}`;

  // Store actions
  const addUnitPlan = useStore((s) => s.addUnitPlan);
  const updateUnitPlan = useStore((s) => s.updateUnitPlan);
  const deleteUnitPlan = useStore((s) => s.deleteUnitPlan);
  const addLessonPlan = useStore((s) => s.addLessonPlan);
  const assignLessonToSlot = useStore((s) => s.assignLessonToSlot);
  const unassignLessonFromSlot = useStore((s) => s.unassignLessonFromSlot);
  const autoFillLessonSequence = useStore((s) => s.autoFillLessonSequence);
  const linkAssessmentToUnit = useStore((s) => s.linkAssessmentToUnit);
  const unlinkAssessmentFromUnit = useStore((s) => s.unlinkAssessmentFromUnit);

  // UI state
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    units.length > 0 ? units[0].id : null
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteConfirmUnit, setDeleteConfirmUnit] = useState<string | null>(null);
  const [strategyDrawerOpen, setStrategyDrawerOpen] = useState(false);
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignOccurrence, setAssignOccurrence] = useState<MaterializedOccurrence | null>(null);
  const [linkAssessmentOpen, setLinkAssessmentOpen] = useState(false);

  // Filtered units
  const filteredUnits = useMemo(() => {
    let result = [...units].sort((a, b) => a.order - b.order);
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }
    return result;
  }, [units, statusFilter]);

  // Selected unit + derived data
  const selectedUnit = useMemo(
    () => units.find((u) => u.id === selectedUnitId) ?? null,
    [units, selectedUnitId]
  );

  const unitLessonPlans = useMemo(
    () =>
      selectedUnit
        ? lessonPlans
            .filter((lp) => lp.unitId === selectedUnit.id)
            .sort((a, b) => a.sequence - b.sequence)
        : [],
    [lessonPlans, selectedUnit]
  );

  const unitAssignments = useMemo(
    () =>
      selectedUnit
        ? lessonSlotAssignments.filter((a) => a.unitId === selectedUnit.id)
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
  }, [timetableSlots, selectedUnit]);

  // Handlers
  const handleCreateUnit = () => {
    const now = new Date().toISOString();
    const newUnit: UnitPlan = {
      id: `unit_new_${Date.now()}`,
      classId,
      title: "New Unit Plan",
      programme,
      status: "draft",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(Date.now() + 21 * 86400000), "yyyy-MM-dd"),
      strategy: {
        learningGoals: [],
        linkedStandardIds: [],
      },
      lessonPlanIds: [],
      order: units.length + 1,
      createdAt: now,
      updatedAt: now,
    };
    addUnitPlan(newUnit);
    setSelectedUnitId(newUnit.id);
    toast.success("Unit plan created");
  };

  const handleDeleteUnit = () => {
    if (!deleteConfirmUnit) return;
    deleteUnitPlan(deleteConfirmUnit);
    if (selectedUnitId === deleteConfirmUnit) {
      setSelectedUnitId(units.find((u) => u.id !== deleteConfirmUnit)?.id ?? null);
    }
    setDeleteConfirmUnit(null);
    toast.success("Unit plan deleted");
  };

  const handleAddLesson = () => {
    if (!selectedUnit) return;
    const now = new Date().toISOString();
    const newLesson: LessonPlan = {
      id: `lp_new_${Date.now()}`,
      unitId: selectedUnit.id,
      classId,
      title: `Lesson ${unitLessonPlans.length + 1}`,
      sequence: unitLessonPlans.length + 1,
      activities: [],
      linkedStandardIds: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    addLessonPlan(newLesson);
    toast.success("Lesson plan added");
  };

  const handleOpenLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setLessonDrawerOpen(true);
  };

  const handleAssignLesson = (lessonPlanId: string) => {
    if (!assignOccurrence || !selectedUnit) return;
    const now = new Date().toISOString();
    assignLessonToSlot({
      id: `lsa_new_${Date.now()}`,
      lessonPlanId,
      unitId: selectedUnit.id,
      classId,
      date: assignOccurrence.date,
      slotDay: assignOccurrence.slotDay,
      slotStartTime: assignOccurrence.slotStartTime,
      createdAt: now,
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
    for (const aId of assessmentIds) {
      linkAssessmentToUnit(aId, selectedUnit!.id);
    }
    setLinkAssessmentOpen(false);
    toast.success(`Linked ${assessmentIds.length} assessment${assessmentIds.length !== 1 ? "s" : ""}`);
  };

  const dayLabels: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
  };

  const dayLabelsFull: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
  };

  // ─── Empty state ───
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

  // ─── Two-panel layout ───
  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* ── Left panel: Unit list ── */}
      <div className="w-[280px] shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreateUnit} className="flex-1">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Unit
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[110px] text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">All statuses</SelectItem>
              <SelectItem value="draft" className="text-[12px]">Draft</SelectItem>
              <SelectItem value="active" className="text-[12px]">Active</SelectItem>
              <SelectItem value="completed" className="text-[12px]">Completed</SelectItem>
              <SelectItem value="archived" className="text-[12px]">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-1.5 pr-2">
            {filteredUnits.map((unit) => {
              const progress = getUnitProgress(
                lessonPlans.filter((lp) => lp.unitId === unit.id)
              );
              const unitAsmts = getUnitAssessments(assessments, unit.id);
              const isSelected = selectedUnitId === unit.id;
              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnitId(unit.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? "bg-[#fff2f0] border-[#ffc1b7]"
                      : "bg-background border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {unit.code && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                        {unit.code}
                      </Badge>
                    )}
                    <StatusBadge status={unit.status} showIcon={false} />
                  </div>
                  <p className="text-[13px] font-medium leading-tight mb-1.5 line-clamp-2">
                    {unit.title}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>
                      {progress.assigned + progress.taught}/{progress.total} lessons
                    </span>
                    <span>{unitAsmts.length} assessments</span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* ── Right panel: Selected unit workspace ── */}
      <div className="flex-1 min-w-0">
        {!selectedUnit ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[13px]">
            Select a unit to view details
          </div>
        ) : (
          <Card className="p-0 gap-0">
            <Tabs defaultValue="overview" className="w-full">
              <div className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-semibold truncate max-w-[400px]">
                      {selectedUnit.title}
                    </h2>
                    {selectedUnit.code && (
                      <Badge variant="outline" className="text-[11px] shrink-0">
                        {selectedUnit.code}
                      </Badge>
                    )}
                    <StatusBadge status={selectedUnit.status} showIcon={false} />
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedUnit.programme}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setDeleteConfirmUnit(selectedUnit.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <TabsList className="mb-0">
                  <TabsTrigger value="overview" className="text-[12px]">Overview</TabsTrigger>
                  <TabsTrigger value="strategy" className="text-[12px]">Strategy</TabsTrigger>
                  <TabsTrigger value="lessons" className="text-[12px]">Lessons</TabsTrigger>
                  <TabsTrigger value="assessments" className="text-[12px]">Assessments</TabsTrigger>
                  <TabsTrigger value="timetable" className="text-[12px]">Timetable</TabsTrigger>
                </TabsList>
              </div>

              {/* ── Overview sub-tab ── */}
              <TabsContent value="overview" className="px-4 pb-4 mt-0">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] text-muted-foreground">Title</Label>
                      <Input
                        value={selectedUnit.title}
                        onChange={(e) =>
                          updateUnitPlan(selectedUnit.id, {
                            title: e.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="text-[13px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] text-muted-foreground">Code</Label>
                      <Input
                        value={selectedUnit.code || ""}
                        onChange={(e) =>
                          updateUnitPlan(selectedUnit.id, {
                            code: e.target.value || undefined,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        placeholder="e.g. SCI-U1"
                        className="text-[13px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">Summary</Label>
                    <Textarea
                      value={selectedUnit.summary || ""}
                      onChange={(e) =>
                        updateUnitPlan(selectedUnit.id, {
                          summary: e.target.value || undefined,
                          updatedAt: new Date().toISOString(),
                        })
                      }
                      placeholder="Brief unit description..."
                      className="text-[13px] min-h-[60px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] text-muted-foreground">Start date</Label>
                      <Input
                        type="date"
                        value={selectedUnit.startDate}
                        onChange={(e) =>
                          updateUnitPlan(selectedUnit.id, {
                            startDate: e.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="text-[13px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] text-muted-foreground">End date</Label>
                      <Input
                        type="date"
                        value={selectedUnit.endDate}
                        onChange={(e) =>
                          updateUnitPlan(selectedUnit.id, {
                            endDate: e.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="text-[13px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] text-muted-foreground">Status</Label>
                      <Select
                        value={selectedUnit.status}
                        onValueChange={(v) =>
                          updateUnitPlan(selectedUnit.id, {
                            status: v as UnitStatus,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                      >
                        <SelectTrigger className="text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Progress snapshot */}
                  {(() => {
                    const progress = getUnitProgress(unitLessonPlans);
                    const conceptualFraming = selectedUnit.strategy.conceptualFraming;
                    const liveAssessments = unitAssessments.filter(
                      (assessment) => assessment.status === "live" || assessment.status === "published"
                    );
                    const nextAssessment = [...unitAssessments].sort((a, b) =>
                      a.dueDate.localeCompare(b.dueDate)
                    )[0] ?? null;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-[18px] font-semibold">{progress.total}</p>
                            <p className="text-[11px] text-muted-foreground">Lessons</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-[18px] font-semibold">{progress.assigned}</p>
                            <p className="text-[11px] text-muted-foreground">Assigned</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-[18px] font-semibold">{progress.taught}</p>
                            <p className="text-[11px] text-muted-foreground">Taught</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-[18px] font-semibold">{unitAssessments.length}</p>
                            <p className="text-[11px] text-muted-foreground">Assessments</p>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                              Inquiry Snapshot
                            </p>
                            {conceptualFraming ? (
                              <div className="space-y-2 text-[13px]">
                                {conceptualFraming.keyConcept && (
                                  <p>
                                    <span className="text-muted-foreground">Key concept:</span>{" "}
                                    {conceptualFraming.keyConcept}
                                  </p>
                                )}
                                {conceptualFraming.statementOfInquiry && (
                                  <p>
                                    <span className="text-muted-foreground">Statement of inquiry:</span>{" "}
                                    <em>{conceptualFraming.statementOfInquiry}</em>
                                  </p>
                                )}
                                {conceptualFraming.atlFocus && conceptualFraming.atlFocus.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {conceptualFraming.atlFocus.map((focus) => (
                                      <Badge key={focus} variant="outline" className="text-[11px]">
                                        {focus}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[13px] text-muted-foreground">
                                Add conceptual framing to make the unit narrative easier to scan at a glance.
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                              Assessment Signal
                            </p>
                            <div className="space-y-2 text-[13px]">
                              <p>
                                <span className="text-muted-foreground">Live or published:</span>{" "}
                                {liveAssessments.length}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Linked standards:</span>{" "}
                                {selectedUnit.strategy.linkedStandardIds.length}
                              </p>
                              {nextAssessment ? (
                                <Link
                                  href={getAssessmentHref(nextAssessment.id)}
                                  target={embedded ? "_top" : undefined}
                                  className="block rounded-lg border border-border/50 bg-background px-3 py-2 hover:bg-muted/30"
                                >
                                  <p className="font-medium text-[#c24e3f]">{nextAssessment.title}</p>
                                  <p className="text-[12px] text-muted-foreground">
                                    Due {format(parseISO(nextAssessment.dueDate), "MMM d, yyyy")} · {GRADING_MODE_LABELS[nextAssessment.gradingMode]}
                                  </p>
                                </Link>
                              ) : (
                                <p className="text-[13px] text-muted-foreground">
                                  Link an assessment to show due dates and evidence points here.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>

              {/* ── Strategy sub-tab ── */}
              <TabsContent value="strategy" className="px-4 pb-4 mt-0">
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold">Unit Strategy</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStrategyDrawerOpen(true)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit Strategy
                    </Button>
                  </div>

                  {/* Learning goals */}
                  {selectedUnit.strategy.learningGoals.length > 0 && (
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground mb-1.5">
                        Learning Goals
                      </p>
                      <ul className="space-y-1">
                        {selectedUnit.strategy.learningGoals.map((g, i) => (
                          <li
                            key={i}
                            className="text-[13px] pl-3 border-l-2 border-[#c24e3f]/30 py-0.5"
                          >
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Linked standards */}
                  {selectedUnit.strategy.linkedStandardIds.length > 0 && (
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground mb-1.5">
                        Standards
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUnit.strategy.linkedStandardIds.map((id) => {
                          const lg = learningGoals.find((g) => g.id === id);
                          return lg ? (
                            <Badge key={id} variant="outline" className="text-[11px]">
                              {lg.code}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Conceptual framing */}
                  {selectedUnit.strategy.conceptualFraming && (
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground mb-1.5">
                        Conceptual Framing
                      </p>
                      <div className="space-y-2 text-[13px]">
                        {selectedUnit.strategy.conceptualFraming.keyConcept && (
                          <div>
                            <span className="text-muted-foreground">Key Concept:</span>{" "}
                            {selectedUnit.strategy.conceptualFraming.keyConcept}
                          </div>
                        )}
                        {selectedUnit.strategy.conceptualFraming.relatedConcepts &&
                          selectedUnit.strategy.conceptualFraming.relatedConcepts.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Related Concepts:</span>{" "}
                              {selectedUnit.strategy.conceptualFraming.relatedConcepts.join(", ")}
                            </div>
                          )}
                        {selectedUnit.strategy.conceptualFraming.globalContext && (
                          <div>
                            <span className="text-muted-foreground">Global Context:</span>{" "}
                            {selectedUnit.strategy.conceptualFraming.globalContext}
                          </div>
                        )}
                        {selectedUnit.strategy.conceptualFraming.statementOfInquiry && (
                          <div>
                            <span className="text-muted-foreground">Statement of Inquiry:</span>{" "}
                            <em>{selectedUnit.strategy.conceptualFraming.statementOfInquiry}</em>
                          </div>
                        )}
                        {selectedUnit.strategy.conceptualFraming.tokConnection && (
                          <div>
                            <span className="text-muted-foreground">TOK Connection:</span>{" "}
                            {selectedUnit.strategy.conceptualFraming.tokConnection}
                          </div>
                        )}
                        {selectedUnit.strategy.conceptualFraming.casOpportunity && (
                          <div>
                            <span className="text-muted-foreground">CAS Opportunity:</span>{" "}
                            {selectedUnit.strategy.conceptualFraming.casOpportunity}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assessment approach */}
                  {selectedUnit.strategy.assessmentApproach && (
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground mb-1">
                        Assessment Approach
                      </p>
                      <p className="text-[13px]">{selectedUnit.strategy.assessmentApproach}</p>
                    </div>
                  )}

                  {/* Differentiation */}
                  {selectedUnit.strategy.action?.differentiationNotes && (
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground mb-1">
                        Differentiation
                      </p>
                      <p className="text-[13px]">
                        {selectedUnit.strategy.action.differentiationNotes}
                      </p>
                    </div>
                  )}

                  {/* No strategy yet */}
                  {selectedUnit.strategy.learningGoals.length === 0 &&
                    !selectedUnit.strategy.conceptualFraming &&
                    !selectedUnit.strategy.assessmentApproach && (
                      <p className="text-[13px] text-muted-foreground italic">
                        No strategy defined yet. Click Edit Strategy to get started.
                      </p>
                    )}
                </div>
              </TabsContent>

              {/* ── Lessons sub-tab ── */}
              <TabsContent value="lessons" className="px-4 pb-4 mt-0">
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold">
                      Lesson Plans ({unitLessonPlans.length})
                    </h3>
                    <Button size="sm" variant="outline" onClick={handleAddLesson}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Lesson
                    </Button>
                  </div>

                  {unitLessonPlans.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground italic py-4 text-center">
                      No lesson plans yet. Add your first lesson plan.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {unitLessonPlans.map((lp) => {
                        const assignment = unitAssignments.find(
                          (a) => a.lessonPlanId === lp.id
                        );
                        return (
                          <button
                            key={lp.id}
                            onClick={() => handleOpenLesson(lp.id)}
                            className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 shrink-0"
                              >
                                {lp.sequence}
                              </Badge>
                              <span className="text-[13px] font-medium flex-1 truncate">
                                {lp.title}
                              </span>
                              <StatusBadge status={lp.status} showIcon={false} />
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </div>
                            {assignment && (
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground ml-7">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {dayLabelsFull[assignment.slotDay]},{" "}
                                  {format(parseISO(assignment.date), "MMM d")}
                                </span>
                                <Clock className="h-3 w-3 ml-1" />
                                <span>{assignment.slotStartTime}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Assessments sub-tab ── */}
              <TabsContent value="assessments" className="px-4 pb-4 mt-0">
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold">
                      Linked Assessments ({unitAssessments.length})
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLinkAssessmentOpen(true)}
                      >
                        <LinkIcon className="h-3.5 w-3.5 mr-1" />
                        Link Existing
                      </Button>
                      {!embedded ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/assessments?createFor=${classId}&unitId=${selectedUnit.id}`
                            )
                          }
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Create New
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {unitAssessments.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground italic py-4 text-center">
                      No assessments linked to this unit yet.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        {unitAssessments.map((asmt) => (
                          <div
                            key={asmt.id}
                            className="flex items-center gap-2 rounded-lg border border-border p-3"
                          >
                            <div className="flex-1 min-w-0">
                              <Link
                                href={getAssessmentHref(asmt.id)}
                                target={embedded ? "_top" : undefined}
                                className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors"
                              >
                                {asmt.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StatusBadge status={asmt.status} showIcon={false} />
                                <span className="text-[11px] text-muted-foreground">
                                  Due {asmt.dueDate}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                unlinkAssessmentFromUnit(asmt.id);
                                toast.success("Assessment unlinked");
                              }}
                            >
                              <Unlink className="h-3.5 w-3.5" />
                            </Button>
                            <Link
                              href={getAssessmentHref(asmt.id)}
                              target={embedded ? "_top" : undefined}
                            >
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>

                      {/* Unit Gradebook */}
                      {(() => {
                        const publishedUnitAssessments = unitAssessments.filter(
                          (a) => a.status === "live" || a.status === "published"
                        );
                        if (publishedUnitAssessments.length === 0) return null;
                        return (
                          <>
                            <Separator className="my-4" />
                            <h3 className="text-[14px] font-semibold mb-3">
                              Unit Gradebook
                            </h3>
                            <div className="overflow-x-auto rounded-lg border border-border">
                              <table className="w-full text-[12px]">
                                <thead>
                                  <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[150px] sticky left-0 bg-muted/30 z-10">
                                      Student
                                    </th>
                                    {publishedUnitAssessments.map((asmt) => (
                                      <th
                                        key={asmt.id}
                                        className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[80px]"
                                      >
                                        <Link
                                          href={getAssessmentHref(asmt.id)}
                                          target={embedded ? "_top" : undefined}
                                          className="hover:text-[#c24e3f] transition-colors"
                                          title={asmt.title}
                                        >
                                          {asmt.title.length > 12
                                            ? `${asmt.title.slice(0, 12)}…`
                                            : asmt.title}
                                        </Link>
                                        <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                                          {GRADING_MODE_LABELS[asmt.gradingMode]}
                                        </div>
                                      </th>
                                    ))}
                                    <th className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[60px]">
                                      Avg
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {students
                                    .slice()
                                    .sort((a, b) =>
                                      `${a.lastName} ${a.firstName}`.localeCompare(
                                        `${b.lastName} ${b.firstName}`
                                      )
                                    )
                                    .map((student) => {
                                      const studentPercentages = publishedUnitAssessments
                                        .map((asmt) => {
                                          const grade = grades.find(
                                            (g) =>
                                              g.studentId === student.id &&
                                              g.assessmentId === asmt.id
                                          );
                                          return grade
                                            ? getGradePercentage(grade, asmt)
                                            : null;
                                        })
                                        .filter(
                                          (v): v is number => v !== null
                                        );
                                      const studentAvg =
                                        studentPercentages.length > 0
                                          ? Math.round(
                                              studentPercentages.reduce(
                                                (s, v) => s + v,
                                                0
                                              ) / studentPercentages.length
                                            )
                                          : null;
                                      return (
                                        <tr
                                          key={student.id}
                                          className="border-b border-border/50 hover:bg-muted/20"
                                        >
                                          <td className="py-1.5 px-3 sticky left-0 bg-background z-10">
                                            <Link
                                              href={getStudentHref(student.id)}
                                              target={embedded ? "_top" : undefined}
                                              className="text-[12px] font-medium hover:text-[#c24e3f] transition-colors"
                                            >
                                              {student.firstName}{" "}
                                              {student.lastName}
                                            </Link>
                                          </td>
                                          {publishedUnitAssessments.map(
                                            (asmt) => {
                                              const grade = grades.find(
                                                (g) =>
                                                  g.studentId ===
                                                    student.id &&
                                                  g.assessmentId === asmt.id
                                              );
                                              const display =
                                                getGradeCellDisplay(
                                                  grade,
                                                  asmt
                                                );
                                              return (
                                                <td
                                                  key={asmt.id}
                                                  className="text-center py-1.5 px-2"
                                                >
                                                  <span
                                                    className={`text-[12px] font-medium ${
                                                      grade?.submissionStatus ===
                                                      "missing"
                                                        ? "text-[#dc2626]"
                                                        : grade
                                                          ? "text-foreground"
                                                          : "text-muted-foreground"
                                                    }`}
                                                  >
                                                    {display}
                                                  </span>
                                                </td>
                                              );
                                            }
                                          )}
                                          <td className="text-center py-1.5 px-2">
                                            <span
                                              className={`text-[12px] font-semibold ${
                                                studentAvg !== null
                                                  ? studentAvg >= 70
                                                    ? "text-[#16a34a]"
                                                    : studentAvg >= 50
                                                      ? "text-[#b45309]"
                                                      : "text-[#dc2626]"
                                                  : "text-muted-foreground"
                                              }`}
                                            >
                                              {studentAvg !== null
                                                ? `${studentAvg}%`
                                                : "-"}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* ── Timetable sub-tab ── */}
              <TabsContent value="timetable" className="px-4 pb-4 mt-0">
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold">
                      Timetable ({unitOccurrences.length} slots)
                    </h3>
                    <Button size="sm" variant="outline" onClick={handleAutoFill}>
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      Auto-fill Sequence
                    </Button>
                  </div>

                  <p className="text-[12px] text-muted-foreground">
                    {format(parseISO(selectedUnit.startDate), "MMM d, yyyy")} —{" "}
                    {format(parseISO(selectedUnit.endDate), "MMM d, yyyy")}
                  </p>

                  {unitOccurrences.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground italic py-4 text-center">
                      No timetable slots found in this date range.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {unitOccurrences.map((occ) => {
                        const assignment = unitAssignments.find(
                          (a) =>
                            a.date === occ.date &&
                            a.slotStartTime === occ.slotStartTime
                        );
                        const assignedLesson = assignment
                          ? unitLessonPlans.find(
                              (lp) => lp.id === assignment.lessonPlanId
                            )
                          : null;

                        return (
                          <div
                            key={`${occ.date}-${occ.slotStartTime}`}
                            className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                              assignment
                                ? "border-[#ffc1b7] bg-[#fff2f0]"
                                : "border-border"
                            }`}
                          >
                            <div className="w-[100px] shrink-0">
                              <p className="text-[12px] font-medium">
                                {dayLabels[occ.slotDay]},{" "}
                                {format(parseISO(occ.date), "MMM d")}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {occ.slotStartTime} – {occ.slotEndTime}
                              </p>
                            </div>
                            {occ.room && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {occ.room}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              {assignedLesson ? (
                                <button
                                  onClick={() => handleOpenLesson(assignedLesson.id)}
                                  className="text-[12px] font-medium text-[#c24e3f] hover:underline truncate block"
                                >
                                  #{assignedLesson.sequence} {assignedLesson.title}
                                </button>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">
                                  No lesson assigned
                                </span>
                              )}
                            </div>
                            {assignment ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[11px] h-7 shrink-0"
                                onClick={() => {
                                  unassignLessonFromSlot(assignment.lessonPlanId);
                                  toast.success("Lesson unassigned");
                                }}
                              >
                                Unassign
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[11px] h-7 shrink-0"
                                onClick={() => {
                                  setAssignOccurrence(occ);
                                  setAssignDialogOpen(true);
                                }}
                              >
                                Assign
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>

      {/* ── Drawers & dialogs ── */}
      {selectedUnit && (
        <StrategyEditDrawer
          open={strategyDrawerOpen}
          onOpenChange={setStrategyDrawerOpen}
          strategy={selectedUnit.strategy}
          programme={selectedUnit.programme}
          learningGoals={learningGoals}
          onSave={(strategy) => {
            updateUnitPlan(selectedUnit.id, {
              strategy,
              updatedAt: new Date().toISOString(),
            });
            toast.success("Strategy updated");
          }}
        />
      )}

      <LessonPlanDrawer
        open={lessonDrawerOpen}
        onOpenChange={setLessonDrawerOpen}
        lessonPlan={
          selectedLessonId
            ? lessonPlans.find((lp) => lp.id === selectedLessonId) ?? null
            : null
        }
        learningGoals={learningGoals}
        assignment={
          selectedLessonId
            ? unitAssignments.find((a) => a.lessonPlanId === selectedLessonId)
            : undefined
        }
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
        assessments={assessments.filter(
          (a) => a.classId === classId && !a.unitId
        )}
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
