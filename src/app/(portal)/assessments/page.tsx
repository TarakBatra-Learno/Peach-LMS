"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { StatCard } from "@/components/shared/stat-card";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { generateId } from "@/services/mock-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { OffPlatformFields } from "@/components/assessment-types/off-platform-fields";
import { QuizFields } from "@/components/assessment-types/quiz-fields";
import { ChatFields } from "@/components/assessment-types/chat-fields";
import { EssayFields } from "@/components/assessment-types/essay-fields";
import {
  createDefaultChatConfig,
  createDefaultEssayConfig,
  createDefaultOffPlatformConfig,
  createDefaultQuizConfig,
  getAssessmentIntentLabel,
  getAssessmentTypeLabel,
} from "@/lib/assessment-labels";
import { getDemoNow } from "@/lib/demo-time";
import { ClipboardCheck, Eye, Hourglass, Plus, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { isGradeComplete, GRADING_MODE_LABELS } from "@/lib/grade-helpers";
import type { GradingMode } from "@/types/common";
import type {
  AssessmentIntent,
  AssessmentType,
  ChatAssessmentConfig,
  EssayAssessmentConfig,
  OffPlatformAssessmentConfig,
  QuizAssessmentConfig,
} from "@/types/assessment";

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

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "off_platform", label: "Off-platform" },
  { value: "quiz", label: "Quiz" },
  { value: "chat", label: "Chat" },
  { value: "essay", label: "Essay" },
];

const INTENT_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All intents" },
  { value: "formative", label: "Formative" },
  { value: "summative", label: "Summative" },
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
  const assessmentReports = useStore((s) => s.assessmentReports);

  // Filters
  const [classFilter, setClassFilter] = useState(createForClassId || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradingModeFilter, setGradingModeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Simplified create dialog state
  const [createOpen, setCreateOpen] = useState(Boolean(createForClassId));
  const [newTitle, setNewTitle] = useState("");
  const [newClassId, setNewClassId] = useState(createForClassId ?? "");
  const [newUnitId, setNewUnitId] = useState(createForUnitId ?? "none");
  const [newAssessmentType, setNewAssessmentType] = useState<AssessmentType>("off_platform");
  const [newAssessmentIntent, setNewAssessmentIntent] = useState<AssessmentIntent>("summative");
  const [newGradingMode, setNewGradingMode] = useState<GradingMode>("score");
  const [newDueDate, setNewDueDate] = useState("");
  const [newOffPlatformConfig, setNewOffPlatformConfig] = useState<OffPlatformAssessmentConfig>(
    createDefaultOffPlatformConfig()
  );
  const [newQuizConfig, setNewQuizConfig] = useState<QuizAssessmentConfig>(
    createDefaultQuizConfig()
  );
  const [newChatConfig, setNewChatConfig] = useState<ChatAssessmentConfig>(
    createDefaultChatConfig()
  );
  const [newEssayConfig, setNewEssayConfig] = useState<EssayAssessmentConfig>(
    createDefaultEssayConfig()
  );

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  // Build unit filter options dynamically based on available units
  const unitFilterOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "all", label: "All units" },
      { value: "none", label: "No unit" },
    ];
    const relevantUnits = classFilter !== "all"
      ? unitPlans.filter((u) => u.classId === classFilter)
      : unitPlans;
    for (const unit of relevantUnits) {
      opts.push({ value: unit.id, label: unit.title });
    }
    return opts;
  }, [unitPlans, classFilter]);

  const classFilterOptions = useMemo(
    () => [
      { value: "all", label: "All classes" },
      ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
    ],
    [classes]
  );

  const createUnitOptions = useMemo(() => {
    if (!newClassId) {
      return [{ value: "none", label: "Leave standalone" }];
    }

    return [
      { value: "none", label: "Leave standalone" },
      ...unitPlans
        .filter((entry) => entry.classId === newClassId)
        .map((entry) => ({ value: entry.id, label: entry.title })),
    ];
  }, [newClassId, unitPlans]);

  const handleCreateClassChange = (classId: string) => {
    setNewClassId(classId);
    setNewUnitId((current) => {
      if (current === "none") return "none";
      return unitPlans.some((entry) => entry.classId === classId && entry.id === current)
        ? current
        : "none";
    });
  };

  const filtered = useMemo(() => {
    let result = assessments;
    if (classFilter !== "all") {
      result = result.filter((a) => a.classId === classFilter);
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
    if (typeFilter !== "all") {
      result = result.filter((a) => (a.assessmentType ?? "off_platform") === typeFilter);
    }
    if (intentFilter !== "all") {
      result = result.filter((a) => a.assessmentIntent === intentFilter);
    }
    if (unitFilter !== "all") {
      if (unitFilter === "none") {
        result = result.filter((a) => !a.unitId);
      } else {
        result = result.filter((a) => a.unitId === unitFilter);
      }
    }
    if (dueFilter !== "all") {
      const now = getDemoNow();
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
  }, [assessments, classFilter, statusFilter, gradingModeFilter, typeFilter, intentFilter, unitFilter, dueFilter, search]);

  const assessmentMetrics = useMemo(() => {
    const metrics = new Map<string, { unreleasedCount: number; hasReleasedReport: boolean }>();
    for (const assessment of assessments) {
      const classEntry = classes.find((entry) => entry.id === assessment.classId);
      const studentIds = classEntry?.studentIds ?? [];
      const assessmentGrades = grades.filter((grade) => grade.assessmentId === assessment.id);
      const unreleasedCount = studentIds.filter((studentId) => {
        const grade = assessmentGrades.find((entry) => entry.studentId === studentId);
        return grade ? isGradeComplete(grade, assessment) && !grade.releasedAt : false;
      }).length;
      const hasReleasedReport = assessmentReports.some(
        (report) => report.assessmentId === assessment.id && Boolean(report.releasedAt)
      );
      metrics.set(assessment.id, { unreleasedCount, hasReleasedReport });
    }
    return metrics;
  }, [assessments, assessmentReports, classes, grades]);

  const queueGroups = useMemo(() => {
    const now = getDemoNow();
    const groups = [
      {
        key: "attention",
        title: "Needs attention",
        description: "Assessments with unreleased grading or activity that needs follow-up.",
        items: filtered.filter((assessment) => {
          const metrics = assessmentMetrics.get(assessment.id);
          return assessment.status === "live" && ((metrics?.unreleasedCount ?? 0) > 0 || new Date(assessment.dueDate) <= now);
        }),
      },
      {
        key: "active",
        title: "Active queue",
        description: "Live assessments across classes, including typed formats and off-platform work.",
        items: filtered.filter((assessment) => {
          const metrics = assessmentMetrics.get(assessment.id);
          return assessment.status === "live" && !(((metrics?.unreleasedCount ?? 0) > 0) || new Date(assessment.dueDate) <= now);
        }),
      },
      {
        key: "drafts",
        title: "Drafts",
        description: "Unpublished work still being configured.",
        items: filtered.filter((assessment) => assessment.status === "draft"),
      },
      {
        key: "closed",
        title: "Closed and released",
        description: "Recently closed assessments with released outcomes or reports.",
        items: filtered.filter((assessment) => assessment.status === "closed" || assessment.status === "archived"),
      },
    ] as const;

    return groups.filter((group) => group.items.length > 0);
  }, [assessmentMetrics, filtered]);

  const queueSummary = useMemo(() => {
    const typedCount = filtered.filter((assessment) => assessment.assessmentType && assessment.assessmentType !== "off_platform").length;
    const unreleasedCount = filtered.reduce(
      (total, assessment) => total + (assessmentMetrics.get(assessment.id)?.unreleasedCount ?? 0),
      0
    );
    const releasedReportCount = filtered.filter(
      (assessment) => assessmentMetrics.get(assessment.id)?.hasReleasedReport
    ).length;
    return {
      live: filtered.filter((assessment) => assessment.status === "live").length,
      unreleasedCount,
      typedCount,
      releasedReportCount,
    };
  }, [assessmentMetrics, filtered]);

  const resetCreateForm = () => {
    setNewTitle("");
    setNewClassId(createForClassId ?? "");
    setNewUnitId(createForUnitId ?? "none");
    setNewAssessmentType("off_platform");
    setNewAssessmentIntent("summative");
    setNewGradingMode("score");
    setNewDueDate("");
    setNewOffPlatformConfig(createDefaultOffPlatformConfig());
    setNewQuizConfig(createDefaultQuizConfig());
    setNewChatConfig(createDefaultChatConfig());
    setNewEssayConfig(createDefaultEssayConfig());
  };

  const handleOpenCreate = () => {
    setNewClassId(createForClassId ?? (classFilter !== "all" ? classFilter : ""));
    setNewUnitId(createForUnitId ?? "none");
    setCreateOpen(true);
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newClassId || !newDueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const now = getDemoNow().toISOString();
    const newAssessmentId = generateId("asmt");
    const selectedClass = getClassById(newClassId);

    addAssessment({
      id: newAssessmentId,
      title: newTitle.trim(),
      description: "",
      classId: newClassId,
      assessmentType: newAssessmentType,
      assessmentIntent: newAssessmentIntent,
      offPlatformConfig:
        newAssessmentType === "off_platform" ? newOffPlatformConfig : undefined,
      quizConfig: newAssessmentType === "quiz" ? newQuizConfig : undefined,
      chatConfig: newAssessmentType === "chat" ? newChatConfig : undefined,
      essayConfig: newAssessmentType === "essay" ? newEssayConfig : undefined,
      gradingMode: newGradingMode,
      status: "draft",
      dueDate: new Date(newDueDate).toISOString(),
      createdAt: now,
      totalPoints: newGradingMode === "score" ? 100 : undefined,
      learningGoalIds: [],
      unitId: newUnitId !== "none" ? newUnitId : undefined,
    });

    if (newUnitId !== "none") {
      linkAssessmentToUnit(newAssessmentId, newUnitId);
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
        description="Manage typed and off-platform assessments across every linked class"
        primaryAction={{
          label: "Create assessment",
          onClick: handleOpenCreate,
          icon: Plus,
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Live queue" value={queueSummary.live} icon={Hourglass} />
        <StatCard label="Ready to release" value={queueSummary.unreleasedCount} icon={Send} />
        <StatCard label="Typed formats" value={queueSummary.typedCount} icon={Sparkles} />
        <StatCard label="Released reports" value={queueSummary.releasedReportCount} icon={Eye} />
      </div>

      <Card className="mb-6 p-5 gap-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[16px] font-semibold">Cross-class work queue</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Track live work, release pressure, and typed assessment formats across every linked class without leaving the teacher shell.
            </p>
          </div>
          <Badge variant="outline" className="text-[11px]">
            {queueGroups.length} active sections
          </Badge>
        </div>
      </Card>

      <FilterBar
        filters={[
          {
            key: "class",
            label: "Class",
            options: classFilterOptions,
            value: classFilter,
            onChange: setClassFilter,
          },
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
            key: "type",
            label: "Type",
            options: TYPE_OPTIONS,
            value: typeFilter,
            onChange: setTypeFilter,
          },
          {
            key: "intent",
            label: "Intent",
            options: INTENT_OPTIONS,
            value: intentFilter,
            onChange: setIntentFilter,
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
              ? { label: "Create assessment", onClick: handleOpenCreate }
              : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {queueGroups.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold">{group.title}</h2>
                  <p className="text-[13px] text-muted-foreground">{group.description}</p>
                </div>
                <Badge variant="secondary" className="text-[11px]">
                  {group.items.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.items.map((asmt) => {
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
            </section>
          ))}
        </div>
      )}

      {/* Simplified Create Assessment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[440px] max-h-[min(92vh,820px)] overflow-hidden p-0">
          <div className="flex max-h-[min(92vh,820px)] flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Create assessment</DialogTitle>
            <DialogDescription>
              Create a draft assessment. You can configure all details on the builder page.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-3">
            {newUnitId !== "none" && (() => {
              const linkedUnit = unitPlans.find((u) => u.id === newUnitId);
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
                <Select value={newClassId} onValueChange={handleCreateClassChange}>
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

              <div className="space-y-1.5 col-span-2">
                <Label className="text-[13px]">Linked unit</Label>
                <Select value={newUnitId} onValueChange={setNewUnitId} disabled={!newClassId}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Leave standalone" />
                  </SelectTrigger>
                  <SelectContent>
                    {createUnitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[12px] text-muted-foreground">
                  Link this draft to a unit now, or leave it standalone and connect it later.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px]">Type *</Label>
                <Select
                  value={newAssessmentType}
                  onValueChange={(value) => setNewAssessmentType(value as AssessmentType)}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off_platform">Off-platform</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px]">Intent *</Label>
                <Select
                  value={newAssessmentIntent}
                  onValueChange={(value) => setNewAssessmentIntent(value as AssessmentIntent)}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Select intent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formative">Formative</SelectItem>
                    <SelectItem value="summative">Summative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
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

            <div className="space-y-2">
              <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                Type-specific setup
              </p>
              {newAssessmentType === "off_platform" && (
                <OffPlatformFields
                  value={newOffPlatformConfig}
                  onChange={(updates) =>
                    setNewOffPlatformConfig((current) => ({ ...current, ...updates }))
                  }
                />
              )}
              {newAssessmentType === "quiz" && (
                <QuizFields
                  value={newQuizConfig}
                  onChange={(updates) =>
                    setNewQuizConfig((current) => ({ ...current, ...updates }))
                  }
                />
              )}
              {newAssessmentType === "chat" && (
                <ChatFields
                  value={newChatConfig}
                  onChange={(updates) =>
                    setNewChatConfig((current) => ({ ...current, ...updates }))
                  }
                />
              )}
              {newAssessmentType === "essay" && (
                <EssayFields
                  value={newEssayConfig}
                  onChange={(updates) =>
                    setNewEssayConfig((current) => ({ ...current, ...updates }))
                  }
                />
              )}
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-[12px] text-muted-foreground">
                This draft will open in the builder next, where you can refine
                the {` ${getAssessmentTypeLabel(newAssessmentType).toLowerCase()}`} setup and confirm whether it stays standalone or belongs inside a unit.
                {getAssessmentIntentLabel(newAssessmentIntent)
                  ? ` ${getAssessmentIntentLabel(newAssessmentIntent)} intent is saved with the draft.`
                  : ""}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 px-6 py-4 gap-2 sm:gap-0">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
