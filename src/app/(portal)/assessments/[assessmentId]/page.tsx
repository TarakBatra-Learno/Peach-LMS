"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { SubmissionPreviewDrawer } from "@/components/shared/submission-preview-drawer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GradingSheet } from "@/components/shared/grading-sheet";
import { OptionsWindow } from "@/components/shared/options-window";
import type { GradingSheetState } from "@/components/shared/grading-sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import {
  createGradeReleasedNotification,
  createGradeAmendedNotification,
  createStudentExcusedNotification,
} from "@/lib/notification-events";
import { generateId } from "@/services/mock-service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CheckCircle2,
  BarChart3,
  Lock,
  Unlock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import type { GradeRecord, SubmissionStatus, ChecklistResultItem } from "@/types/gradebook";
import type { Student } from "@/types/student";
import type { GradingMode } from "@/types/common";
import {
  isGradeComplete,
  getTeacherReviewStatus,
  getToMarkCount,
  getExcusedCount,
  getGradeCellDisplay,
  getChecklistTotalPoints,
  GRADING_MODE_LABELS,
} from "@/lib/grade-helpers";
import type { TeacherReviewStatus } from "@/lib/grade-helpers";
import { buildGradePayload } from "@/lib/grade-save";
import { computeAssessmentAverage, computeUnreleasedGradesCount } from "@/lib/selectors/grade-selectors";
import { ChecklistBuilder } from "@/components/shared/checklist-builder";
import { RubricTab } from "@/components/assessment-tabs/rubric-tab";
import { RUBRIC_TEMPLATES } from "@/lib/constants";
import type { ChecklistResponseStyle, ChecklistOutcomeModel } from "@/types/assessment";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRADING_MODE_DESCRIPTIONS: Record<GradingMode, string> = {
  score: "Numerical points out of a total (e.g. 85/100)",
  rubric: "Criterion-based scoring with multiple rubric rows",
  standards: "Mastery levels mapped to learning standards",
  myp_criteria: "IB MYP criteria A-D, levels 1-8 per criterion",
  dp_scale: "IB DP 1-7 scale for final grades",
  checklist: "Toggle-based checklist with Met/Not yet or Yes/Partly/No responses",
};

const GOAL_CATEGORY_LABELS: Record<string, string> = {
  standard: "Standards",
  atl_skill: "ATL Skills",
  learner_profile: "Learner Profile",
};

const STUDENT_FILTER_OPTIONS: { value: TeacherReviewStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "late", label: "Late" },
  { value: "to_mark", label: "To Mark" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "released", label: "Released" },
  { value: "excused", label: "Excused" },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AssessmentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlStudentId = searchParams.get("studentId");
  const assessmentId = params.assessmentId as string;
  const loading = useMockLoading([assessmentId]);

  // Store selectors
  const assessments = useStore((s) => s.assessments);
  const updateAssessment = useStore((s) => s.updateAssessment);
  const deleteAssessment = useStore((s) => s.deleteAssessment);
  const addAssessment = useStore((s) => s.addAssessment);
  const getClassById = useStore((s) => s.getClassById);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const getGradesByAssessment = useStore((s) => s.getGradesByAssessment);
  const _gradesRef = useStore((s) => s.grades);
  const addGrade = useStore((s) => s.addGrade);
  const updateGrade = useStore((s) => s.updateGrade);
  const addAnnouncement = useStore((s) => s.addAnnouncement);
  const channels = useStore((s) => s.channels);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const deleteCalendarEvent = useStore((s) => s.deleteCalendarEvent);
  const learningGoals = useStore((s) => s.learningGoals);
  const unitPlans = useStore((s) => s.unitPlans);
  const getSubmissionsByAssessment = useStore((s) => s.getSubmissionsByAssessment);
  const addStudentNotification = useStore((s) => s.addStudentNotification);
  const classes = useStore((s) => s.classes);
  const closeAssessment = useStore((s) => s.closeAssessment);
  const reopenAssessment = useStore((s) => s.reopenAssessment);
  const amendGrade = useStore((s) => s.amendGrade);

  const assessment = assessments.find((a) => a.id === assessmentId);
  const cls = assessment ? getClassById(assessment.classId) : undefined;
  const students = assessment ? getStudentsByClassId(assessment.classId) : [];
  const grades = getGradesByAssessment(assessmentId);
  const allSubmissions = getSubmissionsByAssessment(assessmentId);

  // Determine mode
  const isDraft = assessment?.status === "draft";
  const isLive = assessment?.status === "live" || assessment?.status === "published";
  const isClosed = assessment?.status === "closed" || assessment?.status === "archived";

  // ---------------------------------------------------------------------------
  // Draft builder state
  // ---------------------------------------------------------------------------
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftDueDate, setDraftDueDate] = useState("");
  const [draftStudentInstructions, setDraftStudentInstructions] = useState("");
  const [draftClassId, setDraftClassId] = useState("");
  const [draftGradingMode, setDraftGradingMode] = useState<GradingMode>("score");
  const [draftTotalPoints, setDraftTotalPoints] = useState("100");
  const [draftGoalIds, setDraftGoalIds] = useState<string[]>([]);
  const [selectedRubricTemplateId, setSelectedRubricTemplateId] = useState("custom");
  const [draftChecklistResponseStyle, setDraftChecklistResponseStyle] = useState<ChecklistResponseStyle>("binary");
  const [draftChecklistOutcomeModel, setDraftChecklistOutcomeModel] = useState<ChecklistOutcomeModel>("feedback_only");
  const [draftInitialized, setDraftInitialized] = useState(false);

  // Initialize draft fields from assessment
  useEffect(() => {
    if (assessment && isDraft && !draftInitialized) {
      setDraftTitle(assessment.title);
      setDraftDescription(assessment.description);
      setDraftDueDate(assessment.dueDate.split("T")[0]);
      setDraftStudentInstructions(assessment.studentInstructions ?? "");
      setDraftClassId(assessment.classId);
      setDraftGradingMode(assessment.gradingMode);
      setDraftTotalPoints(assessment.totalPoints?.toString() ?? "100");
      setDraftGoalIds(assessment.learningGoalIds ?? []);
      setDraftChecklistResponseStyle(assessment.checklistResponseStyle ?? "binary");
      setDraftChecklistOutcomeModel(assessment.checklistOutcomeModel ?? "feedback_only");
      setDraftInitialized(true);
    }
  }, [assessment, isDraft, draftInitialized]);

  // ---------------------------------------------------------------------------
  // Published mode state
  // ---------------------------------------------------------------------------
  const [studentFilter, setStudentFilter] = useState<TeacherReviewStatus | "all">("all");

  // Grading sheet state
  const [gradingOpen, setGradingOpen] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
  const [gradingAmend, setGradingAmend] = useState(false);
  const [gradingScore, setGradingScore] = useState("");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingSubmissionStatus, setGradingSubmissionStatus] = useState<SubmissionStatus>("none");
  const [gradingMypScores, setGradingMypScores] = useState<Record<string, number>>({});
  const [gradingDpGrade, setGradingDpGrade] = useState("4");
  const [gradingChecklistResults, setGradingChecklistResults] = useState<Record<string, ChecklistResultItem>>({});
  const [gradingRubricScores, setGradingRubricScores] = useState<Record<string, { criterionId: string; levelId: string; points: number }>>({});
  const [gradingStandardsMastery, setGradingStandardsMastery] = useState<Record<string, string>>({});

  // Options window state
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsStudent, setOptionsStudent] = useState<Student | null>(null);

  // Confirm dialogs
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [forceCloseConfirm, setForceCloseConfirm] = useState(false);

  // Announcement preview
  const [announcePreviewOpen, setAnnouncePreviewOpen] = useState(false);
  const [announceDraft, setAnnounceDraft] = useState("");

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const assessmentGoals = useMemo(() => {
    if (!assessment?.learningGoalIds?.length) return [];
    return assessment.learningGoalIds
      .map((id) => learningGoals.find((g) => g.id === id))
      .filter(Boolean);
  }, [assessment?.learningGoalIds, learningGoals]);

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

  // Draft builder — group learning goals by category for picker
  const allGoalsByCategory = useMemo(() => {
    const grouped: Record<string, typeof learningGoals> = {};
    for (const goal of learningGoals) {
      const cat = goal.category || "standard";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(goal);
    }
    return grouped;
  }, [learningGoals]);

  const gradedCount = assessment
    ? grades.filter(
        (g) => g.submissionStatus !== "excused" && isGradeComplete(g, assessment)
      ).length
    : 0;
  const toMarkCount = assessment
    ? getToMarkCount(students.map((s) => s.id), grades, assessment)
    : 0;
  const excusedCount = assessment
    ? getExcusedCount(students.map((s) => s.id), grades, assessment)
    : 0;
  const expectedCount = students.length - excusedCount;
  const unreleasedCount = computeUnreleasedGradesCount(grades, assessmentId);

  const classAvg = useMemo(() => {
    if (!assessment) return "N/A";
    return computeAssessmentAverage(grades, assessment);
  }, [assessment, grades]);

  // ---------------------------------------------------------------------------
  // Grading sheet helpers
  // ---------------------------------------------------------------------------

  const openGradingSheet = (student: Student, isAmend = false) => {
    if (!assessment) return;
    const existingGrade = grades.find((g) => g.studentId === student.id);
    setGradingStudent(student);
    setGradingAmend(isAmend);
    setGradingSubmissionStatus(existingGrade?.submissionStatus ?? "none");
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
    } else if (assessment.gradingMode === "checklist") {
      const existing: Record<string, ChecklistResultItem> = {};
      existingGrade?.checklistGradeResults?.forEach((r) => {
        existing[r.itemId] = r;
      });
      setGradingChecklistResults(existing);
    } else if (assessment.gradingMode === "rubric") {
      const existing: Record<
        string,
        { criterionId: string; levelId: string; points: number }
      > = {};
      existingGrade?.rubricScores?.forEach((r) => {
        existing[r.criterionId] = r;
      });
      setGradingRubricScores(existing);
    } else if (assessment.gradingMode === "standards") {
      const existing: Record<string, string> = {};
      existingGrade?.standardsMastery?.forEach((s) => {
        existing[s.standardId] = s.level;
      });
      setGradingStandardsMastery(existing);
    }

    setGradingOpen(true);
  };

  // Auto-open grading sheet when arriving from a student profile link
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (
      urlStudentId &&
      assessment &&
      students.length > 0 &&
      !autoOpenedRef.current
    ) {
      const student = students.find((s) => s.id === urlStudentId);
      if (student) {
        autoOpenedRef.current = true;
        openGradingSheet(student);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStudentId, assessment?.id, students.length]);

  const gradingSheetState: GradingSheetState = {
    gradingScore,
    setGradingScore,
    gradingFeedback,
    setGradingFeedback,
    gradingSubmissionStatus,
    setGradingSubmissionStatus,
    gradingMypScores,
    setGradingMypScores,
    gradingDpGrade,
    setGradingDpGrade,
    gradingChecklistResults,
    setGradingChecklistResults,
    gradingRubricScores,
    setGradingRubricScores,
    gradingStandardsMastery,
    setGradingStandardsMastery,
  };

  const handleSaveGrade = () => {
    if (!assessment || !gradingStudent) return;
    const existingGrade = grades.find((g) => g.studentId === gradingStudent.id);
    const payload = buildGradePayload(assessment, gradingStudent.id, {
      score: gradingScore,
      dpGrade: gradingDpGrade,
      mypScores: gradingMypScores,
      checklistResults: gradingChecklistResults,
      rubricScores: gradingRubricScores,
      standardsMastery: gradingStandardsMastery,
      feedback: gradingFeedback,
      submissionStatus: gradingSubmissionStatus,
    });

    if (existingGrade) {
      updateGrade(existingGrade.id, {
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } else {
      addGrade({ id: generateId("grade"), ...payload } as GradeRecord);
    }

    toast.success(
      `Grade saved for ${gradingStudent.firstName} ${gradingStudent.lastName}`
    );
    setGradingOpen(false);
    setGradingStudent(null);
  };

  const handleReleaseGrade = () => {
    if (!assessment || !gradingStudent) return;
    const now = new Date().toISOString();
    const existingGrade = grades.find((g) => g.studentId === gradingStudent.id);
    const payload = buildGradePayload(assessment, gradingStudent.id, {
      score: gradingScore,
      dpGrade: gradingDpGrade,
      mypScores: gradingMypScores,
      checklistResults: gradingChecklistResults,
      rubricScores: gradingRubricScores,
      standardsMastery: gradingStandardsMastery,
      feedback: gradingFeedback,
      submissionStatus: gradingSubmissionStatus,
    });
    payload.releasedAt = now;

    if (existingGrade) {
      updateGrade(existingGrade.id, { ...payload, updatedAt: now });
    } else {
      addGrade({ id: generateId("grade"), ...payload } as GradeRecord);
    }

    if (cls) {
      addStudentNotification(
        createGradeReleasedNotification({
          studentId: gradingStudent.id,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          className: cls.name,
          classId: cls.id,
        })
      );
    }

    toast.success(
      `Grade released for ${gradingStudent.firstName} ${gradingStudent.lastName}`
    );
    setGradingOpen(false);
    setGradingStudent(null);
  };

  const handleAmendUpdate = () => {
    if (!assessment || !gradingStudent) return;
    const now = new Date().toISOString();
    const existingGrade = grades.find((g) => g.studentId === gradingStudent.id);
    if (!existingGrade) return;

    const payload = buildGradePayload(assessment, gradingStudent.id, {
      score: gradingScore,
      dpGrade: gradingDpGrade,
      mypScores: gradingMypScores,
      checklistResults: gradingChecklistResults,
      rubricScores: gradingRubricScores,
      standardsMastery: gradingStandardsMastery,
      feedback: gradingFeedback,
      submissionStatus: gradingSubmissionStatus,
    });

    amendGrade(existingGrade.id, payload);

    if (cls) {
      addStudentNotification(
        createGradeAmendedNotification({
          studentId: gradingStudent.id,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          className: cls.name,
          classId: cls.id,
        })
      );
    }

    toast.success(
      `Grade amended for ${gradingStudent.firstName} ${gradingStudent.lastName}`
    );
    setGradingOpen(false);
    setGradingStudent(null);
  };

  // Release individual grade from the table
  const handleReleaseIndividualGrade = (student: Student) => {
    if (!assessment) return;
    const existingGrade = grades.find(
      (g) => g.studentId === student.id && g.assessmentId === assessment.id
    );
    if (!existingGrade) return;
    const now = new Date().toISOString();
    updateGrade(existingGrade.id, { releasedAt: now, updatedAt: now });
    if (cls) {
      addStudentNotification(
        createGradeReleasedNotification({
          studentId: student.id,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          className: cls.name,
          classId: cls.id,
        })
      );
    }
    toast.success(`Grade released for ${student.firstName} ${student.lastName}`);
  };

  // Release all ready grades
  const handleReleaseAllReady = () => {
    if (!assessment || !cls) return;
    const now = new Date().toISOString();
    let count = 0;
    for (const grade of grades) {
      if (grade.gradingStatus === "ready" && !grade.releasedAt && grade.submissionStatus !== "excused") {
        updateGrade(grade.id, { releasedAt: now, updatedAt: now });
        addStudentNotification(
          createGradeReleasedNotification({
            studentId: grade.studentId,
            assessmentId: assessment.id,
            assessmentTitle: assessment.title,
            className: cls.name,
            classId: cls.id,
          })
        );
        count++;
      }
    }
    if (count > 0) {
      toast.success(`Released ${count} grade${count !== 1 ? "s" : ""}`);
    } else {
      toast.info("No ready grades to release");
    }
  };

  // Excuse a student (from options window)
  const handleExcuseStudent = (studentId: string) => {
    if (!assessment) return;
    const existingGrade = grades.find(
      (g) => g.studentId === studentId && g.assessmentId === assessment.id
    );
    const now = new Date().toISOString();
    const excusedPayload: Partial<GradeRecord> = {
      assessmentId: assessment.id,
      studentId,
      classId: assessment.classId,
      gradingMode: assessment.gradingMode,
      submissionStatus: "excused",
      score: undefined,
      dpGrade: undefined,
      mypCriteriaScores: undefined,
      rubricScores: undefined,
      standardsMastery: undefined,
      checklistGradeResults: undefined,
      checklistResults: undefined,
      feedback: undefined,
      gradingStatus: undefined,
      gradedAt: undefined,
      submittedAt: undefined,
      releasedAt: undefined,
      updatedAt: now,
    };

    if (existingGrade) {
      updateGrade(existingGrade.id, excusedPayload);
    } else {
      addGrade({
        id: generateId("grade"),
        ...excusedPayload,
      } as GradeRecord);
    }

    if (cls) {
      addStudentNotification(
        createStudentExcusedNotification({
          studentId,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          className: cls.name,
          classId: cls.id,
        })
      );
    }

    const student = students.find((s) => s.id === studentId);
    toast.success(`${student?.firstName ?? "Student"} excused`);
  };

  // Revoke excused status
  const handleRevokeExcused = (student: Student) => {
    if (!assessment) return;
    const existingGrade = grades.find(
      (g) => g.studentId === student.id && g.assessmentId === assessment.id
    );
    if (!existingGrade) return;
    updateGrade(existingGrade.id, {
      submissionStatus: "none",
      updatedAt: new Date().toISOString(),
    });
    toast.success(`Excused status revoked for ${student.firstName} ${student.lastName}`);
  };

  // ---------------------------------------------------------------------------
  // Close / Reopen
  // ---------------------------------------------------------------------------

  const handleClose = () => {
    if (!assessment) return;
    // Check if there are non-terminal rows
    const nonTerminalCount = students.filter((s) => {
      const grade = grades.find((g) => g.studentId === s.id);
      const status = getTeacherReviewStatus(grade, assessment);
      return status !== "released" && status !== "excused";
    }).length;

    if (nonTerminalCount > 0) {
      setForceCloseConfirm(true);
    } else {
      closeAssessment(assessmentId);
      toast.success("Assessment closed");
    }
  };

  const handleForceClose = () => {
    closeAssessment(assessmentId, true);
    setForceCloseConfirm(false);
    toast.success("Assessment closed — remaining students excused");
  };

  const handleReopen = () => {
    reopenAssessment(assessmentId);
    toast.success("Assessment reopened");
  };

  // ---------------------------------------------------------------------------
  // Draft builder actions
  // ---------------------------------------------------------------------------

  const handleSaveDraft = () => {
    if (!assessment) return;
    updateAssessment(assessmentId, {
      title: draftTitle.trim() || assessment.title,
      description: draftDescription.trim(),
      dueDate: draftDueDate ? new Date(draftDueDate).toISOString() : assessment.dueDate,
      studentInstructions: draftStudentInstructions.trim() || undefined,
      classId: draftClassId || assessment.classId,
      gradingMode: draftGradingMode,
      totalPoints: draftGradingMode === "score" ? parseInt(draftTotalPoints) || 100 : undefined,
      learningGoalIds: draftGoalIds,
      checklistResponseStyle: draftGradingMode === "checklist" ? draftChecklistResponseStyle : undefined,
      checklistOutcomeModel: draftGradingMode === "checklist" ? draftChecklistOutcomeModel : undefined,
    });
    toast.success("Draft saved");
  };

  // Publish with announcement preview
  const handlePublish = () => {
    if (!assessment || !cls) return;
    // Checklist publish guards
    if (assessment.gradingMode === "checklist") {
      if (!assessment.checklist?.length) {
        toast.error("Add at least one checklist item before publishing");
        return;
      }
      if (
        assessment.checklistOutcomeModel === "score_contributing" &&
        getChecklistTotalPoints(assessment) === 0
      ) {
        toast.error("Assign points to at least one item before publishing");
        return;
      }
    }
    const draft = `A new assessment "${draftTitle || assessment.title}" has been published for ${cls.name}. Due date: ${format(parseISO(assessment.dueDate), "MMMM d, yyyy")}.${assessment.description ? ` Description: ${assessment.description}` : ""}`;
    setAnnounceDraft(draft);
    setAnnouncePreviewOpen(true);
  };

  const confirmPublishWithAnnouncement = () => {
    if (!assessment || !cls) return;
    const now = new Date().toISOString();

    // Save any pending draft changes first
    handleSaveDraft();

    const announcementId = generateId("ann");
    const assignmentChannel = channels.find(
      (ch) => ch.classId === cls.id && ch.type === "announcements"
    );

    addAnnouncement({
      id: announcementId,
      channelId: assignmentChannel?.id ?? "",
      classId: cls.id,
      title: `New assessment: ${draftTitle || assessment.title}`,
      body: announceDraft,
      attachments: [
        {
          id: generateId("attach"),
          type: "assessment",
          referenceId: assessment.id,
          label: draftTitle || assessment.title,
        },
      ],
      status: "sent",
      sentAt: now,
      createdAt: now,
      threadReplies: [],
    });

    // Create calendar event if one doesn't exist
    const existingCalEvent = calendarEvents.find(
      (e) => e.linkedAssessmentId === assessmentId
    );
    if (!existingCalEvent) {
      const dueDateStr = assessment.dueDate.split("T")[0];
      addCalendarEvent({
        id: generateId("cal"),
        title: `Due: ${draftTitle || assessment.title}`,
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
      status: "live",
      distributedAt: now,
      linkedAnnouncementId: announcementId,
    });
    setAnnouncePreviewOpen(false);
    toast.success("Assessment published", {
      description: `Announcement sent to ${cls.name}.`,
    });
  };

  const handleDelete = () => {
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) return <DetailSkeleton />;

  if (!assessment)
    return (
      <EmptyState
        icon={AlertCircle}
        title="Assessment not found"
        description="This assessment does not exist or has been removed."
      />
    );

  // ===========================
  // DRAFT MODE (Assessment Builder)
  // ===========================
  if (isDraft) {
    return (
      <div>
        <PageHeader
          title={draftTitle || assessment.title}
          description="Draft — configure your assessment before publishing"
          secondaryActions={[
            { label: "Duplicate", onClick: handleDuplicate },
            {
              label: "Delete",
              onClick: () => setDeleteConfirm(true),
              variant: "destructive" as const,
            },
          ]}
        >
          <div className="flex gap-2 mt-2">
            <StatusBadge status="draft" />
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column — core fields */}
          <div className="space-y-4">
            <Card className="p-5 gap-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Title</Label>
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="h-9 text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Class</Label>
                  <Select value={draftClassId} onValueChange={setDraftClassId}>
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
                  <Label className="text-[13px]">Due date</Label>
                  <Input
                    type="date"
                    value={draftDueDate}
                    onChange={(e) => setDraftDueDate(e.target.value)}
                    className="h-9 text-[13px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px]">Description</Label>
                <Textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Brief description of this assessment..."
                  className="text-[13px] min-h-[72px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px]">Student instructions</Label>
                <Textarea
                  value={draftStudentInstructions}
                  onChange={(e) => setDraftStudentInstructions(e.target.value)}
                  placeholder="Instructions visible to students..."
                  className="text-[13px] min-h-[72px]"
                />
              </div>

              {/* Learning goals picker */}
              <div className="space-y-2">
                <Label className="text-[13px]">Learning goals</Label>
                {(["standard", "atl_skill", "learner_profile"] as const).map(
                  (category) =>
                    allGoalsByCategory[category] &&
                    allGoalsByCategory[category].length > 0 && (
                      <div key={category}>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          {GOAL_CATEGORY_LABELS[category]}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {allGoalsByCategory[category].map((goal) => (
                            <Badge
                              key={goal.id}
                              variant={
                                draftGoalIds.includes(goal.id)
                                  ? "default"
                                  : "outline"
                              }
                              className={`text-[11px] cursor-pointer transition-colors ${
                                draftGoalIds.includes(goal.id)
                                  ? "bg-[#c24e3f] text-white hover:bg-[#c24e3f]/90"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() =>
                                setDraftGoalIds((prev) =>
                                  prev.includes(goal.id)
                                    ? prev.filter((id) => id !== goal.id)
                                    : [...prev, goal.id]
                                )
                              }
                            >
                              {goal.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </Card>
          </div>

          {/* Right column — grading type config */}
          <div className="space-y-4">
            <Card className="p-5 gap-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium">Grading type</Label>
                <Select
                  value={draftGradingMode}
                  onValueChange={(v) => setDraftGradingMode(v as GradingMode)}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(GRADING_MODE_LABELS) as [GradingMode, string][]
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
                <p className="text-[12px] text-muted-foreground">
                  {GRADING_MODE_DESCRIPTIONS[draftGradingMode]}
                </p>
              </div>

              {/* Score config */}
              {draftGradingMode === "score" && (
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Total points</Label>
                  <Input
                    type="number"
                    value={draftTotalPoints}
                    onChange={(e) => setDraftTotalPoints(e.target.value)}
                    placeholder="100"
                    min={1}
                    className="h-9 text-[13px] w-32"
                  />
                </div>
              )}

              {/* Rubric template selector */}
              {draftGradingMode === "rubric" && (
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Rubric template</Label>
                  <Select
                    value={selectedRubricTemplateId}
                    onValueChange={(v) => {
                      setSelectedRubricTemplateId(v);
                      if (v !== "custom") {
                        const template = RUBRIC_TEMPLATES.find((t) => t.id === v);
                        if (template) {
                          updateAssessment(assessmentId, {
                            rubricCriteria: template.rubricCriteria,
                            rubric: template.rubric,
                          });
                        }
                      }
                    }}
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
                  <p className="text-[11px] text-muted-foreground">
                    Configure rubric criteria in the Rubric tab below after saving.
                  </p>
                </div>
              )}

              {/* Checklist config */}
              {draftGradingMode === "checklist" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Response style</Label>
                    <Select
                      value={draftChecklistResponseStyle}
                      onValueChange={(v) =>
                        setDraftChecklistResponseStyle(v as ChecklistResponseStyle)
                      }
                    >
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="binary">Met / Not yet (binary)</SelectItem>
                        <SelectItem value="ternary">Yes / Partly / No (ternary)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Outcome model</Label>
                    <Select
                      value={draftChecklistOutcomeModel}
                      onValueChange={(v) =>
                        setDraftChecklistOutcomeModel(v as ChecklistOutcomeModel)
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
                </div>
              )}

              {draftGradingMode === "standards" && (
                <p className="text-[12px] text-muted-foreground bg-muted/50 rounded-md p-3">
                  Standards mapping is configured via learning goals above.
                </p>
              )}
            </Card>

            {/* Draft action buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save draft
              </Button>
              <Button onClick={handlePublish}>
                <Send className="h-4 w-4 mr-1.5" />
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Checklist builder for draft mode */}
        {draftGradingMode === "checklist" && (
          <div className="mt-6">
            <h3 className="text-[16px] font-semibold mb-3">Checklist items</h3>
            <ChecklistBuilder
              items={assessment.checklist ?? []}
              sections={assessment.checklistSections ?? []}
              outcomeModel={assessment.checklistOutcomeModel ?? "feedback_only"}
              onSave={(items, sections) => {
                updateAssessment(assessmentId, {
                  checklist: items,
                  checklistSections: sections,
                });
                toast.success("Checklist saved");
              }}
            />
          </div>
        )}

        {/* Rubric tab for draft mode */}
        {(draftGradingMode === "rubric" || draftGradingMode === "myp_criteria") && (
          <div className="mt-6">
            <h3 className="text-[16px] font-semibold mb-3">Rubric configuration</h3>
            <RubricTab
              assessment={assessment}
              onUpdateAssessment={updateAssessment}
            />
          </div>
        )}

        {/* Confirm Dialogs */}
        <ConfirmDialog
          open={deleteConfirm}
          onOpenChange={setDeleteConfirm}
          title="Delete assessment"
          description={`This will permanently delete "${assessment.title}" and all associated grades. This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          destructive
        />

        {/* Announcement Preview Dialog */}
        <Dialog open={announcePreviewOpen} onOpenChange={setAnnouncePreviewOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish &amp; Send Announcement</DialogTitle>
              <DialogDescription>
                Review and edit the announcement before publishing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 overflow-y-auto min-h-0">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[11px]">
                    Announcements channel
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    {cls?.name}
                  </Badge>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnnouncePreviewOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={confirmPublishWithAnnouncement}>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Publish &amp; send
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ===========================
  // PUBLISHED MODE (Live / Closed)
  // ===========================

  const readyCount = grades.filter(
    (g) => g.gradingStatus === "ready" && !g.releasedAt && g.submissionStatus !== "excused"
  ).length;

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={assessment.title}
        description={`${cls?.name ?? "Unknown class"} \u00B7 Due ${format(parseISO(assessment.dueDate), "MMM d, yyyy")} \u00B7 ${GRADING_MODE_LABELS[assessment.gradingMode]}`}
        secondaryActions={[
          { label: "Duplicate", onClick: handleDuplicate },
          ...(isLive
            ? [{ label: "Delete", onClick: () => setDeleteConfirm(true), variant: "destructive" as const }]
            : []),
        ]}
      >
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={assessment.status} />
          {assessment.gradingMode === "score" && assessment.totalPoints && (
            <Badge variant="secondary" className="text-[11px]">
              {assessment.totalPoints} points
            </Badge>
          )}
          {assessment.unitId &&
            (() => {
              const linkedUnit = unitPlans.find((u) => u.id === assessment.unitId);
              return linkedUnit ? (
                <Link href={`/classes/${assessment.classId}?tab=units`}>
                  <Badge
                    variant="outline"
                    className="text-[11px] cursor-pointer hover:bg-muted"
                  >
                    Unit: {linkedUnit.title}
                  </Badge>
                </Link>
              ) : null;
            })()}
          {unreleasedCount > 0 && (
            <Badge className="bg-[#dbeafe] text-[#2563eb] border-transparent text-[11px]">
              {unreleasedCount} unreleased
            </Badge>
          )}
        </div>
      </PageHeader>

      {/* Action bar */}
      <div className="flex items-center gap-2 mb-4">
        {isLive && readyCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleReleaseAllReady}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Release all ready ({readyCount})
          </Button>
        )}
        {isLive && (
          <Button variant="outline" size="sm" onClick={handleClose}>
            <Lock className="h-3.5 w-3.5 mr-1.5" />
            Close assessment
          </Button>
        )}
        {isClosed && (
          <Button variant="outline" size="sm" onClick={handleReopen}>
            <Unlock className="h-3.5 w-3.5 mr-1.5" />
            Reopen
          </Button>
        )}
      </div>

      <Tabs defaultValue={urlStudentId ? "students" : "details"} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
          {(assessment.gradingMode === "rubric" ||
            assessment.gradingMode === "myp_criteria") && (
            <TabsTrigger value="rubric">Rubric</TabsTrigger>
          )}
          {assessment.gradingMode === "checklist" && (
            <TabsTrigger value="checklist-builder">Checklist</TabsTrigger>
          )}
        </TabsList>

        {/* ============ Details Tab ============ */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Students" value={students.length} icon={Users} />
            <StatCard label="Graded" value={gradedCount} icon={CheckCircle2} />
            <StatCard label="To mark" value={toMarkCount} icon={ClipboardCheck} />
            <StatCard label="Class average" value={classAvg} icon={BarChart3} />
          </div>

          <Card className="p-5 gap-0">
            <h3 className="text-[16px] font-semibold mb-4">Assessment details</h3>
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
              {assessment.studentInstructions && (
                <div className="sm:col-span-2">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Student instructions
                  </p>
                  <p className="text-[14px] text-muted-foreground">
                    {assessment.studentInstructions}
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
                    {format(parseISO(assessment.distributedAt), "MMM d, yyyy")}
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
          </Card>
        </TabsContent>

        {/* ============ Students Tab ============ */}
        <TabsContent value="students">
          {assessment.gradingMode === "checklist" &&
          (!assessment.checklist || assessment.checklist.length === 0) ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Add checklist items before grading"
              description="Use the Checklist tab to add items to this checklist assessment."
            />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students"
              description="No students are enrolled in this class."
            />
          ) : (
            <div className="space-y-4">
              {/* Progress bar */}
              <Card className="p-4 gap-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium">
                    {gradedCount} of {expectedCount} graded (
                    {expectedCount > 0
                      ? Math.round((gradedCount / expectedCount) * 100)
                      : 0}
                    %)
                    {excusedCount > 0 && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {excusedCount} excused
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[#c24e3f] transition-all"
                    style={{
                      width: `${
                        expectedCount > 0
                          ? (gradedCount / expectedCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {/* Status filter pills */}
                <div className="flex gap-1 mt-3 flex-wrap">
                  {STUDENT_FILTER_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={studentFilter === opt.value ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => setStudentFilter(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Students table */}
              <Card className="p-0 gap-0 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px] font-medium">
                        Student
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Status
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Grade
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students
                      .filter((student) => {
                        if (studentFilter === "all") return true;
                        const grade = grades.find((g) => g.studentId === student.id);
                        const status = getTeacherReviewStatus(grade, assessment);
                        return status === studentFilter;
                      })
                      .sort((a, b) =>
                        `${a.lastName} ${a.firstName}`.localeCompare(
                          `${b.lastName} ${b.firstName}`
                        )
                      )
                      .map((student) => {
                        const grade = grades.find(
                          (g) => g.studentId === student.id
                        );
                        const status = getTeacherReviewStatus(grade, assessment);
                        const submission = allSubmissions.find(
                          (s) => s.studentId === student.id
                        );
                        const isLateSubmission = submission?.isLate === true;
                        const showLateBadge =
                          isLateSubmission &&
                          (status === "to_mark" ||
                            status === "in_progress" ||
                            status === "ready" ||
                            status === "released");

                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-[#c24e3f]/10 flex items-center justify-center text-[11px] font-semibold text-[#c24e3f]">
                                  {student.firstName[0]}
                                  {student.lastName[0]}
                                </div>
                                <Link
                                  href={`/students/${student.id}?classId=${assessment.classId}`}
                                  className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors"
                                >
                                  {student.firstName} {student.lastName}
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <StatusBadge status={status} />
                                {showLateBadge && (
                                  <Badge className="bg-[#fee2e2] text-[#dc2626] border-transparent text-[10px] px-1.5 py-0">
                                    Late
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-[13px] font-medium">
                                {status === "ready" || status === "released"
                                  ? getGradeCellDisplay(grade, assessment)
                                  : "\u2014"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                {/* Pending / Late → Options */}
                                {(status === "pending" || status === "late") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[12px]"
                                    onClick={() => {
                                      setOptionsStudent(student);
                                      setOptionsOpen(true);
                                    }}
                                  >
                                    Options
                                  </Button>
                                )}

                                {/* Excused → Revoke */}
                                {status === "excused" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[12px]"
                                    onClick={() => handleRevokeExcused(student)}
                                  >
                                    Revoke
                                  </Button>
                                )}

                                {/* To mark / In progress → Grade */}
                                {(status === "to_mark" || status === "in_progress") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[12px]"
                                    onClick={() => openGradingSheet(student)}
                                  >
                                    Grade
                                  </Button>
                                )}

                                {/* Ready → Grade + Release */}
                                {status === "ready" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[12px]"
                                      onClick={() => openGradingSheet(student)}
                                    >
                                      Grade
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 text-[12px]"
                                      onClick={() =>
                                        handleReleaseIndividualGrade(student)
                                      }
                                    >
                                      Release
                                    </Button>
                                  </>
                                )}

                                {/* Released → Amend */}
                                {status === "released" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[12px]"
                                    onClick={() => openGradingSheet(student, true)}
                                  >
                                    Amend
                                  </Button>
                                )}
                              </div>
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

        {/* ============ Rubric Tab ============ */}
        {(assessment.gradingMode === "rubric" ||
          assessment.gradingMode === "myp_criteria") && (
          <TabsContent value="rubric">
            <RubricTab
              assessment={assessment}
              onUpdateAssessment={updateAssessment}
            />
          </TabsContent>
        )}

        {/* ============ Checklist Builder Tab ============ */}
        {assessment.gradingMode === "checklist" && (
          <TabsContent value="checklist-builder">
            <ChecklistBuilder
              items={assessment.checklist ?? []}
              sections={assessment.checklistSections ?? []}
              outcomeModel={assessment.checklistOutcomeModel ?? "feedback_only"}
              onSave={(items, sections) => {
                updateAssessment(assessmentId, {
                  checklist: items,
                  checklistSections: sections,
                });
                toast.success("Checklist saved");
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Grading Sheet */}
      <GradingSheet
        open={gradingOpen}
        onOpenChange={setGradingOpen}
        student={gradingStudent}
        assessment={assessment}
        state={gradingSheetState}
        amend={gradingAmend}
        onSave={handleSaveGrade}
        onRelease={handleReleaseGrade}
        onAmendUpdate={handleAmendUpdate}
      />

      {/* Options Window */}
      <OptionsWindow
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        student={optionsStudent}
        assessmentTitle={assessment.title}
        onExcuse={handleExcuseStudent}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Delete assessment"
        description={`This will permanently delete "${assessment.title}" and all associated grades. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />

      <ConfirmDialog
        open={forceCloseConfirm}
        onOpenChange={setForceCloseConfirm}
        title="Close assessment"
        description="This will excuse all remaining students who haven't been graded. Continue?"
        confirmLabel="Close &amp; excuse"
        onConfirm={handleForceClose}
        destructive
      />
    </div>
  );
}
