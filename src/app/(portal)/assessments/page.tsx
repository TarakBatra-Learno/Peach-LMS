"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { generateId } from "@/services/mock-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AssessmentListItem } from "@/components/shared/assessment-list-item";
import { ClipboardCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { isGradeComplete, GRADING_MODE_LABELS } from "@/lib/grade-helpers";
import type { GradingMode, AssessmentStatus } from "@/types/common";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "live", label: "Live" },
  { value: "closed", label: "Closed" },
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

export default function AssessmentsPage() {
  const loading = useMockLoading();
  const router = useRouter();
  const searchParams = useSearchParams();
  const createForClassId = searchParams.get("createFor");
  const createForUnitId = searchParams.get("unitId");

  const classes = useStore((s) => s.classes);
  const assessments = useStore((s) => s.assessments);
  const addAssessment = useStore((s) => s.addAssessment);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const getClassById = useStore((s) => s.getClassById);
  const grades = useStore((s) => s.grades);
  const linkAssessmentToUnit = useStore((s) => s.linkAssessmentToUnit);
  const unitPlans = useStore((s) => s.unitPlans);

  const activeClassId = useStore((s) => s.ui.activeClassId);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradingModeFilter, setGradingModeFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Simplified create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClassId, setNewClassId] = useState("");
  const [newGradingMode, setNewGradingMode] = useState<GradingMode>("score");
  const [newDueDate, setNewDueDate] = useState("");

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
      // Handle legacy statuses: "published" maps to "live", "archived" maps to "closed"
      result = result.filter((a) => {
        if (statusFilter === "live") return a.status === "live" || a.status === "published";
        if (statusFilter === "closed") return a.status === "closed" || a.status === "archived";
        return a.status === statusFilter;
      });
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

  const resetCreateForm = () => {
    setNewTitle("");
    setNewClassId("");
    setNewGradingMode("score");
    setNewDueDate("");
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newClassId || !newDueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const now = new Date().toISOString();
    const newAssessmentId = generateId("asmt");
    const selectedClass = getClassById(newClassId);

    addAssessment({
      id: newAssessmentId,
      title: newTitle.trim(),
      description: "",
      classId: newClassId,
      gradingMode: newGradingMode,
      status: "draft",
      dueDate: new Date(newDueDate).toISOString(),
      createdAt: now,
      totalPoints: newGradingMode === "score" ? 100 : undefined,
      learningGoalIds: [],
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

    toast.success("Assessment created — opening builder");
    setCreateOpen(false);
    resetCreateForm();
    router.push(`/assessments/${newAssessmentId}`);
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
            const gradedCount = studentIds.filter((sid) => {
              const grade = asmtGrades.find((g) => g.studentId === sid);
              return grade ? isGradeComplete(grade, asmt) : false;
            }).length;
            return (
              <AssessmentListItem
                key={asmt.id}
                assessment={asmt}
                grades={asmtGrades}
                studentIds={studentIds}
                className={cls?.name}
                variant="card"
                unitTitle={asmt.unitId ? unitPlans.find((u) => u.id === asmt.unitId)?.title : undefined}
                gradedCount={gradedCount}
                totalStudents={studentIds.length}
              />
            );
          })}
        </div>
      )}

      {/* Simplified Create Assessment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Create assessment</DialogTitle>
            <DialogDescription>
              Create a draft assessment. You can configure all details on the builder page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Due date *</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="h-9 text-[13px]"
              />
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
            <Button onClick={handleCreate}>Create &amp; open builder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
