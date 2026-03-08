"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { generateId } from "@/services/mock-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AssessmentListItem } from "@/components/shared/assessment-list-item";
import { ClipboardCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import type { GradingMode, Status } from "@/types/common";
import type { ChecklistResponseStyle, ChecklistOutcomeModel } from "@/types/assessment";
import { RUBRIC_TEMPLATES } from "@/lib/constants";
import { MYP_DEFAULT_CRITERIA } from "@/lib/myp-descriptors";

const GRADING_MODE_LABELS: Record<GradingMode, string> = {
  score: "Score",
  rubric: "Rubric",
  standards: "Standards",
  myp_criteria: "MYP Criteria",
  dp_scale: "DP Scale (1-7)",
  checklist: "Checklist",
};

const GRADING_MODE_DESCRIPTIONS: Record<GradingMode, string> = {
  score: "Numerical points out of a total (e.g. 85/100)",
  rubric: "Criterion-based scoring with multiple rubric rows",
  standards: "Mastery levels mapped to learning standards",
  myp_criteria: "IB MYP criteria A-D, levels 1-8 per criterion",
  dp_scale: "IB DP 1-7 scale for final grades",
  checklist: "Toggle-based checklist with Met/Not yet or Yes/Partly/No responses",
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const GRADING_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All modes" },
  ...Object.entries(GRADING_MODE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const DUE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const GOAL_CATEGORY_LABELS: Record<string, string> = {
  standard: "Standards",
  atl_skill: "ATL Skills",
  learner_profile: "Learner Profile",
};

export default function AssessmentsPage() {
  const loading = useMockLoading();
  const searchParams = useSearchParams();
  const createForClassId = searchParams.get("createFor");
  const createForUnitId = searchParams.get("unitId");

  const classes = useStore((s) => s.classes);
  const assessments = useStore((s) => s.assessments);
  const addAssessment = useStore((s) => s.addAssessment);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const getClassById = useStore((s) => s.getClassById);
  const grades = useStore((s) => s.grades);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const learningGoals = useStore((s) => s.learningGoals);
  const linkAssessmentToUnit = useStore((s) => s.linkAssessmentToUnit);
  const unitPlans = useStore((s) => s.unitPlans);

  const activeClassId = useStore((s) => s.ui.activeClassId);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradingModeFilter, setGradingModeFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newClassId, setNewClassId] = useState("");
  const [newGradingMode, setNewGradingMode] = useState<GradingMode>("score");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTotalPoints, setNewTotalPoints] = useState("100");
  const [formGoalIds, setFormGoalIds] = useState<string[]>([]);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [selectedRubricTemplateId, setSelectedRubricTemplateId] = useState("custom");
  const [newChecklistResponseStyle, setNewChecklistResponseStyle] = useState<ChecklistResponseStyle>("binary");
  const [newChecklistOutcomeModel, setNewChecklistOutcomeModel] = useState<ChecklistOutcomeModel>("feedback_only");

  // Students for the selected class in create form
  const classStudents = useMemo(
    () => (newClassId ? getStudentsByClassId(newClassId) : []),
    [newClassId, getStudentsByClassId]
  );

  // Auto-select all students when class changes
  useEffect(() => {
    if (newClassId) {
      const students = getStudentsByClassId(newClassId);
      setAssignedStudentIds(students.map((s) => s.id));
    } else {
      setAssignedStudentIds([]);
    }
  }, [newClassId, getStudentsByClassId]);

  // Auto-open create dialog when navigated from Unit Plans with createFor param
  useEffect(() => {
    if (createForClassId) {
      setNewClassId(createForClassId);
      setCreateOpen(true);
    }
  }, [createForClassId]);

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  // Build unit filter options dynamically based on available units
  const unitFilterOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "all", label: "All units" },
      { value: "none", label: "No unit" },
    ];
    // Show units that belong to the active class (if one is selected), otherwise all
    const relevantUnits = activeClassId
      ? unitPlans.filter((u) => u.classId === activeClassId)
      : unitPlans;
    for (const unit of relevantUnits) {
      opts.push({ value: unit.id, label: unit.title });
    }
    return opts;
  }, [unitPlans, activeClassId]);

  const filtered = useMemo(() => {
    let result = assessments;
    if (activeClassId) {
      result = result.filter((a) => a.classId === activeClassId);
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (gradingModeFilter !== "all") {
      result = result.filter((a) => a.gradingMode === gradingModeFilter);
    }
    if (unitFilter !== "all") {
      if (unitFilter === "none") {
        result = result.filter((a) => !a.unitId);
      } else {
        result = result.filter((a) => a.unitId === unitFilter);
      }
    }
    if (dueFilter !== "all") {
      const now = new Date();
      result = result.filter((a) => {
        const due = new Date(a.dueDate);
        return dueFilter === "upcoming" ? due > now : due <= now;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }
    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [assessments, activeClassId, statusFilter, gradingModeFilter, unitFilter, dueFilter, search]);

  // Group learning goals by category
  const goalsByCategory = useMemo(() => {
    const grouped: Record<string, typeof learningGoals> = {};
    for (const goal of learningGoals) {
      const cat = goal.category || "standard";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(goal);
    }
    return grouped;
  }, [learningGoals]);

  const toggleGoalId = (goalId: string) => {
    setFormGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const resetCreateForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewClassId("");
    setNewGradingMode("score");
    setNewDueDate("");
    setNewTotalPoints("100");
    setFormGoalIds([]);
    setAssignedStudentIds([]);
    setSelectedRubricTemplateId("custom");
    setNewChecklistResponseStyle("binary");
    setNewChecklistOutcomeModel("feedback_only");
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newClassId || !newDueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const now = new Date().toISOString();
    const newAssessmentId = generateId("asmt");
    const selectedClass = getClassById(newClassId);

    // Resolve rubric template if rubric mode is selected
    const rubricTemplate =
      newGradingMode === "rubric" && selectedRubricTemplateId !== "custom"
        ? RUBRIC_TEMPLATES.find((t) => t.id === selectedRubricTemplateId)
        : undefined;

    // Pre-populate MYP criteria when MYP Criteria mode is selected (#6)
    const mypCriteria =
      newGradingMode === "myp_criteria"
        ? MYP_DEFAULT_CRITERIA.map((c) => ({
            id: generateId("mypc"),
            criterion: c.criterion,
            title: c.title,
            maxLevel: c.maxLevel,
            strandDescriptors: [],
          }))
        : undefined;

    addAssessment({
      id: newAssessmentId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      classId: newClassId,
      gradingMode: newGradingMode,
      status: "draft",
      dueDate: new Date(newDueDate).toISOString(),
      createdAt: now,
      totalPoints:
        newGradingMode === "score" ? parseInt(newTotalPoints) || 100 : undefined,
      learningGoalIds: formGoalIds,
      assignedStudentIds:
        assignedStudentIds.length === classStudents.length
          ? undefined
          : assignedStudentIds,
      rubricCriteria: rubricTemplate?.rubricCriteria,
      rubric: rubricTemplate?.rubric,
      mypCriteria,
      checklistResponseStyle:
        newGradingMode === "checklist" ? newChecklistResponseStyle : undefined,
      checklistOutcomeModel:
        newGradingMode === "checklist" ? newChecklistOutcomeModel : undefined,
      unitId: createForUnitId || undefined,
    });

    // If created from a unit context, link the assessment to the unit
    if (createForUnitId) {
      linkAssessmentToUnit(newAssessmentId, createForUnitId);
    }

    addCalendarEvent({
      id: generateId("cal"),
      title: `Due: ${newTitle.trim()}`,
      description: `Assessment deadline for ${selectedClass?.name || "class"}`,
      type: "deadline",
      startTime: new Date(newDueDate + "T23:59:00").toISOString(),
      endTime: new Date(newDueDate + "T23:59:00").toISOString(),
      isAllDay: true,
      classId: newClassId,
      linkedAssessmentId: newAssessmentId,
    });

    toast.success("Assessment created successfully");
    setCreateOpen(false);
    resetCreateForm();
  };

  if (loading)
    return (
      <>
        <PageHeader title="Assessments" />
        <CardGridSkeleton count={6} />
      </>
    );

  return (
    <div>
      <PageHeader
        title="Assessments"
        description="Create and manage assessments across your classes"
        primaryAction={{
          label: "Create assessment",
          onClick: () => setCreateOpen(true),
          icon: Plus,
        }}
      />

      <FilterBar
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "gradingMode",
            label: "Grading mode",
            options: GRADING_MODE_OPTIONS,
            value: gradingModeFilter,
            onChange: setGradingModeFilter,
          },
          {
            key: "unit",
            label: "Unit",
            options: unitFilterOptions,
            value: unitFilter,
            onChange: setUnitFilter,
          },
          {
            key: "due",
            label: "Due date",
            options: DUE_OPTIONS,
            value: dueFilter,
            onChange: setDueFilter,
          },
        ]}
        onSearch={handleSearch}
        searchPlaceholder="Search assessments..."
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments found"
          description={
            assessments.length === 0
              ? "Create your first assessment to get started."
              : "No assessments match your current filters."
          }
          action={
            assessments.length === 0
              ? { label: "Create assessment", onClick: () => setCreateOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asmt) => {
            const cls = getClassById(asmt.classId);
            const studentIds = cls?.studentIds ?? [];
            const asmtGrades = grades.filter((g) => g.assessmentId === asmt.id);
            return (
              <AssessmentListItem
                key={asmt.id}
                assessment={asmt}
                grades={asmtGrades}
                studentIds={studentIds}
                className={cls?.name}
                variant="card"
                unitTitle={asmt.unitId ? unitPlans.find((u) => u.id === asmt.unitId)?.title : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Create Assessment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create assessment</DialogTitle>
            <DialogDescription>
              Add a new assessment for one of your classes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto min-h-0">
            {createForUnitId && (() => {
              const linkedUnit = unitPlans.find((u) => u.id === createForUnitId);
              return linkedUnit ? (
                <div className="rounded-lg border bg-muted/30 p-2.5 text-[12px] text-muted-foreground">
                  Creating for unit: <span className="font-medium text-foreground">{linkedUnit.title}</span>
                </div>
              ) : null;
            })()}
            <div className="space-y-1.5">
              <Label className="text-[13px]">Title *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Unit 3 Quiz"
                className="h-9 text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description of this assessment..."
                className="text-[13px] min-h-[72px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Class *</Label>
                <Select value={newClassId} onValueChange={setNewClassId}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px]">Grading mode *</Label>
                <Select
                  value={newGradingMode}
                  onValueChange={(v) => setNewGradingMode(v as GradingMode)}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(GRADING_MODE_LABELS) as [
                        GradingMode,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        title={GRADING_MODE_DESCRIPTIONS[value]}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Due date *</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-9 text-[13px]"
                />
              </div>

              {newGradingMode === "score" && (
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Total points</Label>
                  <Input
                    type="number"
                    value={newTotalPoints}
                    onChange={(e) => setNewTotalPoints(e.target.value)}
                    placeholder="100"
                    min={1}
                    className="h-9 text-[13px]"
                  />
                </div>
              )}
            </div>

            {/* Rubric template selector */}
            {newGradingMode === "rubric" && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">Rubric template</Label>
                <Select
                  value={selectedRubricTemplateId}
                  onValueChange={setSelectedRubricTemplateId}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {RUBRIC_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id} title={t.description}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRubricTemplateId !== "custom" && (
                  <div className="text-[12px] text-muted-foreground bg-muted/50 rounded-md p-3 mt-1">
                    <p className="font-medium mb-1.5">Criteria preview:</p>
                    <div className="space-y-1">
                      {RUBRIC_TEMPLATES.find(
                        (t) => t.id === selectedRubricTemplateId
                      )?.rubricCriteria.map((c) => (
                        <p key={c.id} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#c24e3f] shrink-0" />
                          {c.name}{" "}
                          <span className="text-[11px] text-muted-foreground/70">
                            (max {c.maxScore} pts)
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRubricTemplateId === "custom" && (
                  <p className="text-[11px] text-muted-foreground">
                    You can configure rubric criteria on the assessment detail
                    page after creation.
                  </p>
                )}
              </div>
            )}

            {newGradingMode === "standards" && (
              <p className="text-[12px] text-muted-foreground bg-muted/50 rounded-md p-3">
                Configure standards mapping on the assessment detail page after
                creation.
              </p>
            )}

            {newGradingMode === "checklist" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Response style</Label>
                  <Select
                    value={newChecklistResponseStyle}
                    onValueChange={(v) =>
                      setNewChecklistResponseStyle(v as ChecklistResponseStyle)
                    }
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="binary">
                        Met / Not yet (binary)
                      </SelectItem>
                      <SelectItem value="ternary">
                        Yes / Partly / No (ternary)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Outcome model</Label>
                  <Select
                    value={newChecklistOutcomeModel}
                    onValueChange={(v) =>
                      setNewChecklistOutcomeModel(v as ChecklistOutcomeModel)
                    }
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feedback_only">
                        Feedback only (no numeric score)
                      </SelectItem>
                      <SelectItem value="score_contributing">
                        Score-contributing (items map to points)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[12px] text-muted-foreground bg-muted/50 rounded-md p-3">
                  Configure checklist items on the assessment detail page after
                  creation.
                </p>
              </div>
            )}

            {/* Assign to students */}
            {newClassId && classStudents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px]">Assign to</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() =>
                        setAssignedStudentIds(classStudents.map((s) => s.id))
                      }
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() => setAssignedStudentIds([])}
                    >
                      Deselect all
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md max-h-[140px] overflow-y-auto p-2 space-y-1">
                  {classStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={assignedStudentIds.includes(student.id)}
                        onCheckedChange={(checked) => {
                          setAssignedStudentIds((prev) =>
                            checked
                              ? [...prev, student.id]
                              : prev.filter((id) => id !== student.id)
                          );
                        }}
                      />
                      <span className="text-[13px]">
                        {student.firstName} {student.lastName}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {assignedStudentIds.length} of {classStudents.length} students
                  selected
                </p>
              </div>
            )}

            {/* Learning goals picker */}
            <div className="space-y-2">
              <Label className="text-[13px]">Learning goals</Label>
              {(["standard", "atl_skill", "learner_profile"] as const).map(
                (category) =>
                  goalsByCategory[category] &&
                  goalsByCategory[category].length > 0 && (
                    <div key={category}>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {GOAL_CATEGORY_LABELS[category]}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {goalsByCategory[category].map((goal) => (
                          <Badge
                            key={goal.id}
                            variant={
                              formGoalIds.includes(goal.id)
                                ? "default"
                                : "outline"
                            }
                            className={`text-[11px] cursor-pointer transition-colors ${
                              formGoalIds.includes(goal.id)
                                ? "bg-[#c24e3f] text-white hover:bg-[#c24e3f]/90"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => toggleGoalId(goal.id)}
                          >
                            {goal.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create assessment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
