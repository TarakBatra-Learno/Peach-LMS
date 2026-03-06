"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { generateId } from "@/services/mock-service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Calendar,
  Users,
  ClipboardCheck,
  Send,
  Archive,
  FileText,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Mic,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import type { GradeRecord } from "@/types/gradebook";
import type { Student } from "@/types/student";
import type { SimpleCriterion } from "@/types/assessment";
import { MYP_LEVEL_DESCRIPTORS } from "@/lib/myp-descriptors";

const GRADING_MODE_LABELS: Record<string, string> = {
  score: "Score",
  rubric: "Rubric",
  standards: "Standards",
  myp_criteria: "MYP Criteria",
  dp_scale: "DP Scale (1-7)",
};

const MYP_CRITERIA_LABELS = ["A", "B", "C", "D"] as const;

const GOAL_CATEGORY_LABELS: Record<string, string> = {
  standard: "Standards",
  atl_skill: "ATL Skills",
  learner_profile: "Learner Profile",
};

function getGradeDisplay(grade: GradeRecord): string {
  if (grade.isMissing) return "Missing";
  if (grade.score != null && grade.totalPoints != null)
    return `${grade.score}/${grade.totalPoints}`;
  if (grade.score != null) return `${grade.score}%`;
  if (grade.dpGrade != null) return `${grade.dpGrade}/7`;
  if (grade.mypCriteriaScores?.length) {
    const assessed = grade.mypCriteriaScores.filter((c) => c.level > 0);
    if (assessed.length === 0) return "N/A";
    // Show per-criterion breakdown instead of averaged score (#18)
    return assessed.map((c) => `${c.criterion}:${c.level}`).join(" ");
  }
  return "-";
}

function getGradeTotal(grade: GradeRecord): string | null {
  if (!grade.mypCriteriaScores?.length) return null;
  const assessed = grade.mypCriteriaScores.filter((c) => c.level > 0);
  if (assessed.length === 0) return null;
  const total = assessed.reduce((s, c) => s + c.level, 0);
  const max = assessed.length * 8;
  return `= ${total}/${max}`;
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlStudentId = searchParams.get("studentId");
  const assessmentId = params.assessmentId as string;
  const loading = useMockLoading([assessmentId]);

  const assessments = useStore((s) => s.assessments);
  const updateAssessment = useStore((s) => s.updateAssessment);
  const deleteAssessment = useStore((s) => s.deleteAssessment);
  const addAssessment = useStore((s) => s.addAssessment);
  const reports = useStore((s) => s.reports);
  const reportCycles = useStore((s) => s.reportCycles);
  const getClassById = useStore((s) => s.getClassById);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const getGradesByAssessment = useStore((s) => s.getGradesByAssessment);
  const addGrade = useStore((s) => s.addGrade);
  const updateGrade = useStore((s) => s.updateGrade);
  const addAnnouncement = useStore((s) => s.addAnnouncement);
  const channels = useStore((s) => s.channels);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const deleteCalendarEvent = useStore((s) => s.deleteCalendarEvent);
  const learningGoals = useStore((s) => s.learningGoals);

  const assessment = assessments.find((a) => a.id === assessmentId);
  const cls = assessment ? getClassById(assessment.classId) : undefined;
  const students = assessment
    ? getStudentsByClassId(assessment.classId)
    : [];
  const grades = getGradesByAssessment(assessmentId);

  // Resolve assessment learning goals
  const assessmentGoals = useMemo(() => {
    if (!assessment?.learningGoalIds?.length) return [];
    return assessment.learningGoalIds
      .map((id) => learningGoals.find((g) => g.id === id))
      .filter(Boolean);
  }, [assessment?.learningGoalIds, learningGoals]);

  // Group resolved goals by category for display
  const goalsByCategory = useMemo(() => {
    const grouped: Record<string, typeof assessmentGoals> = {};
    for (const goal of assessmentGoals) {
      if (!goal) continue;
      const cat = goal.category || "standard";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(goal);
    }
    return grouped;
  }, [assessmentGoals]);

  // Grading sheet state
  const [gradingOpen, setGradingOpen] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
  const [gradingScore, setGradingScore] = useState("");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingIsMissing, setGradingIsMissing] = useState(false);
  const [gradingMypScores, setGradingMypScores] = useState<
    Record<string, number>
  >({});
  const [gradingDpGrade, setGradingDpGrade] = useState("4");

  // Confirm dialogs
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Edit & Duplicate (#15)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  // Announcement preview (#17)
  const [announcePreviewOpen, setAnnouncePreviewOpen] = useState(false);
  const [announceDraft, setAnnounceDraft] = useState("");

  // Grading filter (#8)
  const [gradingFilter, setGradingFilter] = useState<"all" | "pending" | "completed" | "missing">("all");

  // Rubric criteria builder state
  const [rubricCriteria, setRubricCriteria] = useState<SimpleCriterion[]>(
    () => assessment?.rubricCriteria ?? []
  );

  const addCriterion = () => {
    setRubricCriteria((prev) => [
      ...prev,
      {
        id: generateId("crit"),
        name: "",
        description: "",
        maxScore: assessment?.gradingMode === "myp_criteria" ? 8 : 10,
      },
    ]);
  };

  const updateCriterion = (
    id: string,
    field: keyof Omit<SimpleCriterion, "id">,
    value: string | number
  ) => {
    setRubricCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeCriterion = (id: string) => {
    setRubricCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const moveCriterion = (index: number, direction: "up" | "down") => {
    setRubricCriteria((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const saveRubricCriteria = () => {
    if (!assessment) return;
    updateAssessment(assessmentId, { rubricCriteria });
    toast.success("Rubric saved");
  };

  const gradedCount = grades.filter((g) => !g.isMissing).length;
  const missingCount = grades.filter((g) => g.isMissing).length;
  const ungradedCount = students.length - grades.length;

  const classAvg = useMemo(() => {
    if (!assessment) return "N/A";
    const validGrades = grades.filter((g) => !g.isMissing);
    if (validGrades.length === 0) return "N/A";

    if (assessment.gradingMode === "score") {
      const avg =
        validGrades.reduce((sum, g) => sum + (g.score || 0), 0) /
        validGrades.length;
      return assessment.totalPoints
        ? `${Math.round(avg)}/${assessment.totalPoints}`
        : `${Math.round(avg)}%`;
    }
    if (assessment.gradingMode === "dp_scale") {
      const avg =
        validGrades.reduce((sum, g) => sum + (g.dpGrade || 0), 0) /
        validGrades.length;
      return `${avg.toFixed(1)}/7`;
    }
    if (assessment.gradingMode === "myp_criteria") {
      const allLevels = validGrades.flatMap((g) => g.mypCriteriaScores || []);
      if (allLevels.length === 0) return "N/A";
      const avg =
        allLevels.reduce((s, c) => s + c.level, 0) / allLevels.length;
      return `${avg.toFixed(1)}/8`;
    }
    return `${validGrades.length} graded`;
  }, [assessment, grades]);

  const openGradingSheet = (student: Student) => {
    if (!assessment) return;
    const existingGrade = grades.find((g) => g.studentId === student.id);
    setGradingStudent(student);
    setGradingIsMissing(existingGrade?.isMissing ?? false);
    setGradingFeedback(existingGrade?.feedback ?? "");

    if (assessment.gradingMode === "score") {
      setGradingScore(existingGrade?.score?.toString() ?? "");
    } else if (assessment.gradingMode === "dp_scale") {
      setGradingDpGrade(existingGrade?.dpGrade?.toString() ?? "4");
    } else if (assessment.gradingMode === "myp_criteria") {
      const existing: Record<string, number> = {};
      existingGrade?.mypCriteriaScores?.forEach((c) => {
        existing[c.criterion] = c.level;
      });
      setGradingMypScores(existing);
    }

    setGradingOpen(true);
  };

  // Auto-open grading sheet when arriving from a student profile link
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (urlStudentId && assessment && students.length > 0 && !autoOpenedRef.current) {
      const student = students.find((s) => s.id === urlStudentId);
      if (student) {
        autoOpenedRef.current = true;
        openGradingSheet(student);
      }
    }
  }, [urlStudentId, assessment?.id, students.length]);

  const handleSaveGrade = () => {
    if (!assessment || !gradingStudent) return;

    const existingGrade = grades.find(
      (g) => g.studentId === gradingStudent.id
    );
    const now = new Date().toISOString();

    const baseGrade: Partial<GradeRecord> = {
      assessmentId: assessment.id,
      studentId: gradingStudent.id,
      classId: assessment.classId,
      gradingMode: assessment.gradingMode,
      feedback: gradingFeedback.trim() || undefined,
      isMissing: gradingIsMissing,
      gradedAt: now,
    };

    if (!gradingIsMissing) {
      if (assessment.gradingMode === "score") {
        baseGrade.score = parseInt(gradingScore) || 0;
        baseGrade.totalPoints = assessment.totalPoints;
      } else if (assessment.gradingMode === "dp_scale") {
        baseGrade.dpGrade = parseInt(gradingDpGrade) || 4;
      } else if (assessment.gradingMode === "myp_criteria") {
        baseGrade.mypCriteriaScores = MYP_CRITERIA_LABELS.map((c) => ({
          criterionId: `crit_${c}`,
          criterion: c,
          level: gradingMypScores[c] ?? 0,
        }));
      }
    }

    if (existingGrade) {
      updateGrade(existingGrade.id, { ...baseGrade, updatedAt: now });
      toast.success(
        `Grade updated for ${gradingStudent.firstName} ${gradingStudent.lastName}`
      );
    } else {
      addGrade({
        id: generateId("grade"),
        ...baseGrade,
      } as GradeRecord);
      toast.success(
        `Grade saved for ${gradingStudent.firstName} ${gradingStudent.lastName}`
      );
    }

    setGradingOpen(false);
    setGradingStudent(null);
  };

  // Save & Next (#7) — saves grade and advances to next student
  const handleSaveAndNext = () => {
    if (!assessment || !gradingStudent) return;
    const sortedStudents = [...students].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    );
    const currentIdx = sortedStudents.findIndex((s) => s.id === gradingStudent.id);

    // Save current grade first (reuse handleSaveGrade logic inline)
    const existingGrade = grades.find((g) => g.studentId === gradingStudent.id);
    const now = new Date().toISOString();
    const baseGrade: Partial<GradeRecord> = {
      assessmentId: assessment.id,
      studentId: gradingStudent.id,
      classId: assessment.classId,
      gradingMode: assessment.gradingMode,
      feedback: gradingFeedback.trim() || undefined,
      isMissing: gradingIsMissing,
      gradedAt: now,
    };
    if (!gradingIsMissing) {
      if (assessment.gradingMode === "score") {
        baseGrade.score = parseInt(gradingScore) || 0;
        baseGrade.totalPoints = assessment.totalPoints;
      } else if (assessment.gradingMode === "dp_scale") {
        baseGrade.dpGrade = parseInt(gradingDpGrade) || 4;
      } else if (assessment.gradingMode === "myp_criteria") {
        baseGrade.mypCriteriaScores = MYP_CRITERIA_LABELS.map((c) => ({
          criterionId: `crit_${c}`,
          criterion: c,
          level: gradingMypScores[c] ?? 0,
        }));
      }
    }
    if (existingGrade) {
      updateGrade(existingGrade.id, { ...baseGrade, updatedAt: now });
    } else {
      addGrade({ id: generateId("grade"), ...baseGrade } as GradeRecord);
    }
    toast.success(`Grade saved for ${gradingStudent.firstName} ${gradingStudent.lastName}`);

    // Advance to next student
    if (currentIdx < sortedStudents.length - 1) {
      openGradingSheet(sortedStudents[currentIdx + 1]);
    } else {
      setGradingOpen(false);
      setGradingStudent(null);
      toast.success("All students graded!");
    }
  };

  // Navigate to prev/next student in grading panel (#7)
  const navigateGrading = (direction: "prev" | "next") => {
    if (!gradingStudent) return;
    const sortedStudents = [...students].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    );
    const currentIdx = sortedStudents.findIndex((s) => s.id === gradingStudent.id);
    const newIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
    if (newIdx >= 0 && newIdx < sortedStudents.length) {
      openGradingSheet(sortedStudents[newIdx]);
    }
  };

  // Edit details handler (#15)
  const handleOpenEdit = () => {
    if (!assessment) return;
    setEditTitle(assessment.title);
    setEditDescription(assessment.description);
    setEditDueDate(assessment.dueDate.split("T")[0]);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    updateAssessment(assessmentId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      dueDate: new Date(editDueDate).toISOString(),
    });
    setEditDialogOpen(false);
    toast.success("Assessment updated");
  };

  // Duplicate handler (#15)
  const handleDuplicate = () => {
    if (!assessment) return;
    const newId = generateId("asmt");
    addAssessment({
      ...assessment,
      id: newId,
      title: `Copy of ${assessment.title}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      distributedAt: undefined,
      linkedAnnouncementId: undefined,
    });
    toast.success("Assessment duplicated", {
      description: `"Copy of ${assessment.title}" created as draft.`,
    });
  };

  // Find student's report for this class in current open cycle (for "View in report" link)
  const openCycle = reportCycles.find((c) => c.status === "open");
  const getStudentReportId = (studentId: string): string | null => {
    if (!openCycle || !assessment) return null;
    const report = reports.find(
      (r) => r.studentId === studentId && r.classId === assessment.classId && r.cycleId === openCycle.id
    );
    return report?.id ?? null;
  };

  // Publish with announcement preview (#17)
  const handlePublish = () => {
    if (!assessment || !cls) return;
    const draft = `A new assessment "${assessment.title}" has been published for ${cls.name}. Due date: ${format(parseISO(assessment.dueDate), "MMMM d, yyyy")}.${assessment.description ? ` Description: ${assessment.description}` : ""}`;
    setAnnounceDraft(draft);
    setAnnouncePreviewOpen(true);
  };

  const confirmPublishWithAnnouncement = () => {
    if (!assessment || !cls) return;
    const now = new Date().toISOString();

    // Create a linked announcement with the (possibly edited) text
    const announcementId = generateId("ann");
    const assignmentChannel = channels.find(
      (ch) => ch.classId === cls.id && ch.type === "announcements"
    );

    addAnnouncement({
      id: announcementId,
      channelId: assignmentChannel?.id ?? "",
      classId: cls.id,
      title: `New assessment: ${assessment.title}`,
      body: announceDraft,
      attachments: [
        {
          id: generateId("attach"),
          type: "assessment",
          referenceId: assessment.id,
          label: assessment.title,
        },
      ],
      status: "sent",
      sentAt: now,
      createdAt: now,
      threadReplies: [],
    });

    // Create a calendar deadline event if one doesn't already exist for this assessment
    const existingCalEvent = calendarEvents.find(
      (e) => e.linkedAssessmentId === assessmentId
    );
    if (!existingCalEvent) {
      const dueDateStr = assessment.dueDate.split("T")[0];
      addCalendarEvent({
        id: generateId("cal"),
        title: `Due: ${assessment.title}`,
        description: `Assessment deadline for ${cls.name}`,
        type: "deadline",
        startTime: new Date(dueDateStr + "T23:59:00").toISOString(),
        endTime: new Date(dueDateStr + "T23:59:00").toISOString(),
        isAllDay: true,
        classId: assessment.classId,
        linkedAssessmentId: assessmentId,
      });
    }

    updateAssessment(assessmentId, {
      status: "published",
      distributedAt: now,
      linkedAnnouncementId: announcementId,
    });
    setAnnouncePreviewOpen(false);
    toast.success("Assessment published", {
      description: `Announcement sent to ${cls?.name || "class channel"}.`,
    });
  };

  const handleArchive = () => {
    updateAssessment(assessmentId, { status: "archived" });
    toast.success("Assessment archived");
  };

  const handleDelete = () => {
    // Delete linked calendar event before deleting the assessment
    const linkedCalEvent = calendarEvents.find(
      (e) => e.linkedAssessmentId === assessmentId
    );
    if (linkedCalEvent) {
      deleteCalendarEvent(linkedCalEvent.id);
    }

    deleteAssessment(assessmentId);
    toast.success("Assessment deleted");
    window.history.back();
  };

  if (loading) return <DetailSkeleton />;

  if (!assessment)
    return (
      <EmptyState
        icon={AlertCircle}
        title="Assessment not found"
        description="This assessment does not exist or has been removed."
      />
    );

  return (
    <div>
      <PageHeader
        title={assessment.title}
        description={`${cls?.name ?? "Unknown class"} \u00B7 Due ${format(parseISO(assessment.dueDate), "MMM d, yyyy")} \u00B7 ${GRADING_MODE_LABELS[assessment.gradingMode]}`}
        secondaryActions={
          assessment.status !== "archived"
            ? [
                {
                  label: "Edit details",
                  onClick: handleOpenEdit,
                  icon: FileText,
                },
                {
                  label: "Duplicate",
                  onClick: handleDuplicate,
                },
                ...(assessment.status === "draft"
                  ? [
                      {
                        label: "Publish",
                        onClick: handlePublish,
                        icon: Send,
                      },
                    ]
                  : []),
                ...(assessment.status === "published"
                  ? [
                      {
                        label: "Archive",
                        onClick: () => setArchiveConfirm(true),
                        icon: Archive,
                      },
                    ]
                  : []),
                {
                  label: "Delete",
                  onClick: () => setDeleteConfirm(true),
                  variant: "destructive" as const,
                },
              ]
            : undefined
        }
      >
        <div className="flex gap-2 mt-2">
          <StatusBadge status={assessment.status} />
          {assessment.gradingMode === "score" && assessment.totalPoints && (
            <Badge variant="secondary" className="text-[11px]">
              {assessment.totalPoints} points
            </Badge>
          )}
        </div>
      </PageHeader>

      <Tabs defaultValue={urlStudentId ? "students" : "details"} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="students">
            Students ({students.length})
          </TabsTrigger>
          {(assessment.gradingMode === "rubric" ||
            assessment.gradingMode === "myp_criteria") && (
            <TabsTrigger value="rubric-builder">Rubric Builder</TabsTrigger>
          )}
          {assessment.gradingMode === "rubric" && assessment.rubric && (
            <TabsTrigger value="rubric">Rubric</TabsTrigger>
          )}
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Students"
              value={students.length}
              icon={Users}
            />
            <StatCard
              label="Graded"
              value={gradedCount}
              icon={CheckCircle2}
            />
            <StatCard
              label="Missing"
              value={missingCount}
              icon={XCircle}
            />
            <StatCard
              label="Class average"
              value={classAvg}
              icon={BarChart3}
            />
          </div>

          <Card className="p-5 gap-0">
            <h3 className="text-[16px] font-semibold mb-4">
              Assessment details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Title
                </p>
                <p className="text-[14px]">{assessment.title}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Class
                </p>
                <p className="text-[14px]">
                  {cls ? (
                    <Link
                      href={`/classes/${cls.id}`}
                      className="text-[#c24e3f] hover:underline"
                    >
                      {cls.name}
                    </Link>
                  ) : (
                    "Unknown"
                  )}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Due date
                </p>
                <p className="text-[14px] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {format(parseISO(assessment.dueDate), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Grading mode
                </p>
                <p className="text-[14px]">
                  {GRADING_MODE_LABELS[assessment.gradingMode]}
                </p>
              </div>
              {assessment.description && (
                <div className="sm:col-span-2">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-[14px] text-muted-foreground">
                    {assessment.description}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Created
                </p>
                <p className="text-[14px]">
                  {format(parseISO(assessment.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              {assessment.distributedAt && (
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Published
                  </p>
                  <p className="text-[14px]">
                    {format(
                      parseISO(assessment.distributedAt),
                      "MMM d, yyyy"
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Learning goals section */}
            {assessmentGoals.length > 0 && (
              <>
                <Separator className="my-5" />
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Learning goals
                  </p>
                  <div className="space-y-2">
                    {(["standard", "atl_skill", "learner_profile"] as const).map(
                      (category) =>
                        goalsByCategory[category] &&
                        goalsByCategory[category].length > 0 && (
                          <div key={category}>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              {GOAL_CATEGORY_LABELS[category]}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {goalsByCategory[category].map((goal) =>
                                goal ? (
                                  <Badge
                                    key={goal.id}
                                    className="text-[11px] bg-[#c24e3f] text-white hover:bg-[#c24e3f]/90"
                                  >
                                    {goal.title}
                                  </Badge>
                                ) : null
                              )}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>
              </>
            )}

            {assessment.status === "draft" && (
              <>
                <Separator className="my-5" />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handlePublish}
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Publish assessment
                  </Button>
                </div>
              </>
            )}

            {assessment.status === "published" && (
              <>
                <Separator className="my-5" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArchiveConfirm(true)}
                  >
                    <Archive className="h-4 w-4 mr-1.5" />
                    Archive assessment
                  </Button>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          {students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students"
              description="No students are enrolled in this class."
            />
          ) : (
            <div className="space-y-4">
              {/* Progress indicator (#8) */}
              <Card className="p-4 gap-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium">
                    {gradedCount} of {students.length} graded ({Math.round((gradedCount / students.length) * 100)}%)
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {missingCount > 0 && `${missingCount} missing · `}
                    {students.length - gradedCount - missingCount} pending
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c24e3f] rounded-full transition-all"
                    style={{ width: `${(gradedCount / students.length) * 100}%` }}
                  />
                </div>
                {/* Filter tabs */}
                <div className="flex gap-1 mt-3">
                  {(["all", "pending", "completed", "missing"] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={gradingFilter === filter ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-[11px] capitalize"
                      onClick={() => setGradingFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="p-0 gap-0 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px] font-medium">
                        Student
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Grade
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Status
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Feedback
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students
                      .filter((student) => {
                        if (gradingFilter === "all") return true;
                        const grade = grades.find((g) => g.studentId === student.id);
                        if (gradingFilter === "pending") return !grade;
                        if (gradingFilter === "completed") return grade && !grade.isMissing;
                        if (gradingFilter === "missing") return grade?.isMissing;
                        return true;
                      })
                      .map((student) => {
                      const grade = grades.find(
                        (g) => g.studentId === student.id
                      );
                      const reportId = getStudentReportId(student.id);
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-[#c24e3f]/10 flex items-center justify-center text-[11px] font-semibold text-[#c24e3f]">
                                {student.firstName[0]}
                                {student.lastName[0]}
                              </div>
                              <div>
                                <Link
                                  href={`/students/${student.id}?classId=${assessment.classId}`}
                                  className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors block"
                                >
                                  {student.firstName} {student.lastName}
                                </Link>
                                {/* "View in report" link (#1) */}
                                {grade && reportId && (
                                  <Link
                                    href={`/reports/${reportId}`}
                                    className="text-[11px] text-[#c24e3f] hover:underline"
                                  >
                                    View in report &rarr;
                                  </Link>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`text-[13px] font-medium ${
                                  grade?.isMissing
                                    ? "text-[#dc2626]"
                                    : grade
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {grade ? getGradeDisplay(grade) : "Not graded"}
                              </span>
                              {grade && getGradeTotal(grade) && (
                                <span className="text-[11px] text-muted-foreground">
                                  {getGradeTotal(grade)}
                                </span>
                              )}
                              {grade?.updatedAt && (
                                <span
                                  className="flex items-center gap-0.5 text-[11px] text-muted-foreground"
                                  title={`Updated ${format(parseISO(grade.updatedAt), "MMM d, yyyy h:mm a")}`}
                                >
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(parseISO(grade.updatedAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {grade ? (
                              grade.isMissing ? (
                                <StatusBadge status="missing" />
                              ) : (
                                <StatusBadge status="completed" />
                              )
                            ) : (
                              <StatusBadge status="pending" />
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-[12px] text-muted-foreground truncate max-w-[150px] block">
                              {grade?.feedback || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[12px]"
                              onClick={() => openGradingSheet(student)}
                            >
                              {grade ? "Edit grade" : "Grade"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Rubric Builder Tab */}
        {(assessment.gradingMode === "rubric" ||
          assessment.gradingMode === "myp_criteria") && (
          <TabsContent value="rubric-builder">
            <Card className="p-5 gap-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold">Rubric criteria</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[12px]"
                    onClick={addCriterion}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add criterion
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-[12px]"
                    onClick={saveRubricCriteria}
                  >
                    Save rubric
                  </Button>
                </div>
              </div>

              {rubricCriteria.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] text-muted-foreground mb-3">
                    No criteria defined yet. Add your first criterion to build
                    the rubric.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCriterion}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add criterion
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rubricCriteria.map((criterion, index) => (
                    <div
                      key={criterion.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex flex-col gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={index === 0}
                          onClick={() => moveCriterion(index, "up")}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={index === rubricCriteria.length - 1}
                          onClick={() => moveCriterion(index, "down")}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px] gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Name
                          </Label>
                          <Input
                            value={criterion.name}
                            onChange={(e) =>
                              updateCriterion(
                                criterion.id,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Criterion name"
                            className="h-8 text-[13px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Description
                          </Label>
                          <Input
                            value={criterion.description}
                            onChange={(e) =>
                              updateCriterion(
                                criterion.id,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Brief description"
                            className="h-8 text-[13px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Max score
                          </Label>
                          <Input
                            type="number"
                            value={criterion.maxScore}
                            onChange={(e) =>
                              updateCriterion(
                                criterion.id,
                                "maxScore",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={1}
                            className="h-8 text-[13px]"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 mt-5"
                        onClick={() => removeCriterion(criterion.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        )}

        {/* Rubric Tab (only for rubric mode) */}
        {assessment.gradingMode === "rubric" && assessment.rubric && (
          <TabsContent value="rubric">
            <div className="space-y-4">
              {assessment.rubric.map((criterion) => (
                <Card key={criterion.id} className="p-5 gap-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[14px] font-semibold">
                      {criterion.title}
                    </h4>
                    <Badge variant="secondary" className="text-[11px]">
                      Weight: {criterion.weight}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {criterion.levels.map((level) => (
                      <div
                        key={level.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold">
                            {level.label}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5"
                          >
                            {level.points} pts
                          </Badge>
                        </div>
                        <p className="text-[12px] text-muted-foreground">
                          {level.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Grading Sheet */}
      <Sheet open={gradingOpen} onOpenChange={setGradingOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            {/* Next/prev navigation (#7) */}
            {gradingStudent && (() => {
              const sorted = [...students].sort((a, b) =>
                `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
              );
              const idx = sorted.findIndex((s) => s.id === gradingStudent.id);
              return (
                <div className="flex items-center justify-between mb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[12px]"
                    disabled={idx <= 0}
                    onClick={() => navigateGrading("prev")}
                  >
                    <ArrowUp className="h-3.5 w-3.5 mr-1" />
                    Prev
                  </Button>
                  <span className="text-[12px] text-muted-foreground">
                    Student {idx + 1} of {sorted.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[12px]"
                    disabled={idx >= sorted.length - 1}
                    onClick={() => navigateGrading("next")}
                  >
                    Next
                    <ArrowDown className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              );
            })()}
            <SheetTitle className="text-[16px]">
              Grade: {gradingStudent?.firstName} {gradingStudent?.lastName}
            </SheetTitle>
            <SheetDescription className="text-[13px]">
              {assessment.title} &middot;{" "}
              {GRADING_MODE_LABELS[assessment.gradingMode]}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            {/* Mark as missing */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[13px] font-medium">
                  Mark as missing
                </Label>
                <p className="text-[12px] text-muted-foreground">
                  Student did not submit this assessment
                </p>
              </div>
              <Switch
                checked={gradingIsMissing}
                onCheckedChange={setGradingIsMissing}
              />
            </div>

            <Separator />

            {/* Score mode */}
            {assessment.gradingMode === "score" && !gradingIsMissing && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">
                  Score{" "}
                  {assessment.totalPoints &&
                    `(out of ${assessment.totalPoints})`}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={gradingScore}
                    onChange={(e) => setGradingScore(e.target.value)}
                    placeholder="0"
                    min={0}
                    max={assessment.totalPoints}
                    className="h-9 text-[13px] w-24"
                  />
                  {assessment.totalPoints && (
                    <span className="text-[13px] text-muted-foreground">
                      / {assessment.totalPoints}
                    </span>
                  )}
                </div>
                {assessment.totalPoints &&
                  gradingScore &&
                  parseInt(gradingScore) > 0 && (
                    <p className="text-[12px] text-muted-foreground">
                      {Math.round(
                        (parseInt(gradingScore) / assessment.totalPoints) * 100
                      )}
                      %
                    </p>
                  )}
              </div>
            )}

            {/* MYP Criteria mode */}
            {assessment.gradingMode === "myp_criteria" && !gradingIsMissing && (
              <div className="space-y-4">
                <Label className="text-[13px] font-medium">
                  MYP Criteria levels (1-8)
                </Label>
                {MYP_CRITERIA_LABELS.map((criterion) => {
                  const mypCrit = assessment.mypCriteria?.find(
                    (c) => c.criterion === criterion
                  );
                  return (
                    <div key={criterion} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[13px]">
                          Criterion {criterion}
                          {mypCrit ? `: ${mypCrit.title}` : ""}
                        </Label>
                        <Badge variant="outline" className="text-[11px]">
                          Level {gradingMypScores[criterion] ?? 0}
                        </Badge>
                      </div>
                      <Select
                        value={
                          (gradingMypScores[criterion] ?? 0).toString()
                        }
                        onValueChange={(v) =>
                          setGradingMypScores((prev) => ({
                            ...prev,
                            [criterion]: parseInt(v),
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 9 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i === 0
                                ? "Not assessed (0)"
                                : `Level ${i}${MYP_LEVEL_DESCRIPTORS[criterion]?.[i] ? ` \u2014 ${MYP_LEVEL_DESCRIPTORS[criterion][i]}` : ""}`
                              }
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DP Scale mode */}
            {assessment.gradingMode === "dp_scale" && !gradingIsMissing && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">DP Grade (1-7)</Label>
                <Select
                  value={gradingDpGrade}
                  onValueChange={setGradingDpGrade}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} -{" "}
                        {
                          [
                            "",
                            "Very poor",
                            "Poor",
                            "Mediocre",
                            "Satisfactory",
                            "Good",
                            "Very good",
                            "Excellent",
                          ][n]
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Feedback */}
            <div className="space-y-1.5">
              <Label className="text-[13px]">Feedback</Label>
              <Textarea
                value={gradingFeedback}
                onChange={(e) => setGradingFeedback(e.target.value)}
                placeholder="Add feedback for the student..."
                className="text-[13px] min-h-[100px]"
              />
              <Button
                variant="outline"
                size="sm"
                className="text-[12px] gap-1.5"
                onClick={() => toast.info("Audio recording coming soon — this feature is on the roadmap.")}
              >
                <Mic className="h-3.5 w-3.5" />
                Record audio feedback
              </Button>
            </div>

            {/* Save buttons (#7) */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGradingOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleSaveGrade}>
                Save grade
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSaveAndNext}>
                Save &amp; Next
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={archiveConfirm}
        onOpenChange={setArchiveConfirm}
        title="Archive assessment"
        description={`Are you sure you want to archive "${assessment.title}"? Archived assessments will no longer be visible to students.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Delete assessment"
        description={`This will permanently delete "${assessment.title}" and all associated grades. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />

      {/* Announcement Preview Dialog (#17) */}
      <Dialog open={announcePreviewOpen} onOpenChange={setAnnouncePreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish & Send Announcement</DialogTitle>
            <DialogDescription>
              Review and edit the announcement before publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto min-h-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[11px]">Announcements channel</Badge>
                <Badge variant="outline" className="text-[11px]">{cls?.name}</Badge>
              </div>
              <Label className="text-[13px]">Announcement message</Label>
              <Textarea
                value={announceDraft}
                onChange={(e) => setAnnounceDraft(e.target.value)}
                rows={4}
                className="mt-1.5 text-[13px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAnnouncePreviewOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmPublishWithAnnouncement}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Publish & send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog (#15) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assessment Details</DialogTitle>
            <DialogDescription>Update the assessment title, description, or due date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto min-h-0">
            <div>
              <Label className="text-[13px]">Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-[13px]">Description</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="mt-1 text-[13px]" />
            </div>
            <div>
              <Label className="text-[13px]">Due date</Label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={!editTitle.trim()}>Save changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
