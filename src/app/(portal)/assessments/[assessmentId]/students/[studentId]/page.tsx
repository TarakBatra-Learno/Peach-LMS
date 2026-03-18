"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { StudentMarkingWorkspace } from "@/components/assessments/student-marking-workspace";
import { generateId } from "@/services/mock-service";
import { useStore } from "@/stores";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { buildGradePayload } from "@/lib/grade-save";
import { getAssessmentIntentLabel, getAssessmentTypeLabel } from "@/lib/assessment-labels";
import { isGradingComplete } from "@/lib/grade-helpers";
import type { AssessmentReport } from "@/types/assessment-report";
import type { GradeRecord, ChecklistResultItem, SubmissionStatus } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";
import type { Student } from "@/types/student";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { getDemoNow } from "@/lib/demo-time";

function buildAssessmentReportDraft({
  assessment,
  student,
  grade,
  existingReport,
  now,
}: {
  assessment: Assessment;
  student: Student;
  grade?: GradeRecord;
  existingReport?: AssessmentReport | null;
  now: string;
}): AssessmentReport {
  if (existingReport) {
    return { ...existingReport };
  }

  const rubricFeedback =
    grade?.rubricScores?.map((entry) => ({
      criterionId: entry.criterionId,
      criterionLabel: entry.criterionId,
      levelLabel: `${entry.points} pts`,
      summary: "Rubric evidence captured from teacher scoring.",
    })) ?? [];

  return {
    id: generateId("asrep"),
    assessmentId: assessment.id,
    studentId: student.id,
    classId: assessment.classId,
    status: "draft",
    summary: `${student.firstName} is building toward the ${getAssessmentIntentLabel(assessment.assessmentIntent)?.toLowerCase() ?? "assessment"} expectations for ${assessment.title}.`,
    strengths: [
      grade?.feedback?.trim() ||
        `${student.firstName} has teacher-reviewed evidence for this ${getAssessmentTypeLabel(assessment.assessmentType).toLowerCase()} task.`,
    ],
    weaknesses: [
      "Refine one area where the reasoning, explanation, or evidence still feels partial.",
    ],
    suggestions: [
      `Use the next ${getAssessmentTypeLabel(assessment.assessmentType).toLowerCase()} attempt to tighten the response against the success criteria.`,
    ],
    rubricFeedback,
    sourceAttribution: [
      {
        id: generateId("asrep_src"),
        sourceType: "teacher_note",
        label: "Teacher review workspace",
      },
      {
        id: generateId("asrep_src"),
        sourceType: "grade",
        sourceId: grade?.id,
        label: `${assessment.title} grading record`,
      },
    ],
    generatedAt: now,
    updatedAt: now,
  };
}

function initializeGradeState(assessment: Assessment, studentId: string, grade?: GradeRecord) {
  const rubricScores: Record<string, { criterionId: string; levelId: string; points: number }> = {};
  for (const score of grade?.rubricScores ?? []) {
    rubricScores[score.criterionId] = {
      criterionId: score.criterionId,
      levelId: score.levelId,
      points: score.points,
    };
  }

  const checklistResults: Record<string, ChecklistResultItem> = {};
  for (const item of grade?.checklistGradeResults ?? []) {
    checklistResults[item.itemId] = item;
  }

  const standardsMastery: Record<string, string> = {};
  for (const item of grade?.standardsMastery ?? []) {
    standardsMastery[item.standardId] = item.level;
  }

  const mypScores: Record<string, number> = {};
  for (const item of grade?.mypCriteriaScores ?? []) {
    mypScores[item.criterion] = item.level;
  }

  return {
    gradingScore: grade?.score?.toString() ?? "",
    gradingFeedback: grade?.feedback ?? "",
    gradingSubmissionStatus:
      grade?.submissionStatus ?? ("submitted" as SubmissionStatus),
    gradingMypScores: mypScores,
    gradingDpGrade: grade?.dpGrade?.toString() ?? "4",
    gradingChecklistResults: checklistResults,
    gradingRubricScores: rubricScores,
    gradingStandardsMastery: standardsMastery,
    studentId,
    assessment,
  };
}

export default function AssessmentStudentMarkingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const assessmentId = params.assessmentId as string;
  const studentId = params.studentId as string;
  const embedded = searchParams.get("embed") === "1";
  const loading = useMockLoading([assessmentId, studentId]);

  const assessments = useStore((s) => s.assessments);
  const students = useStore((s) => s.students);
  const classes = useStore((s) => s.classes);
  const grades = useStore((s) => s.grades);
  const submissions = useStore((s) => s.submissions);
  const assessmentReports = useStore((s) => s.assessmentReports);
  const addGrade = useStore((s) => s.addGrade);
  const updateGrade = useStore((s) => s.updateGrade);
  const addAssessmentReport = useStore((s) => s.addAssessmentReport);
  const updateAssessmentReport = useStore((s) => s.updateAssessmentReport);

  const assessment = assessments.find((entry) => entry.id === assessmentId);
  const student = students.find((entry) => entry.id === studentId);
  const linkedClass =
    assessment ? classes.find((entry) => entry.id === assessment.classId) ?? null : null;
  const classStudents = useMemo(
    () =>
      linkedClass
        ? students.filter((entry) => linkedClass.studentIds.includes(entry.id))
        : [],
    [linkedClass, students]
  );
  const studentIndex = classStudents.findIndex((entry) => entry.id === studentId);
  const previousStudent = studentIndex > 0 ? classStudents[studentIndex - 1] : null;
  const nextStudent =
    studentIndex >= 0 && studentIndex < classStudents.length - 1
      ? classStudents[studentIndex + 1]
      : null;
  const grade =
    grades.find((entry) => entry.assessmentId === assessmentId && entry.studentId === studentId) ??
    undefined;
  const submission =
    submissions.find((entry) => entry.assessmentId === assessmentId && entry.studentId === studentId) ??
    null;
  const report =
    assessmentReports.find(
      (entry) => entry.assessmentId === assessmentId && entry.studentId === studentId
    ) ?? null;
  const initialGradeState =
    assessment && student
      ? initializeGradeState(assessment, student.id, grade)
      : {
          gradingScore: "",
          gradingFeedback: "",
          gradingSubmissionStatus: "submitted" as SubmissionStatus,
          gradingMypScores: {},
          gradingDpGrade: "4",
          gradingChecklistResults: {} as Record<string, ChecklistResultItem>,
          gradingRubricScores: {} as Record<
            string,
            { criterionId: string; levelId: string; points: number }
          >,
          gradingStandardsMastery: {} as Record<string, string>,
        };

  const [gradingScore, setGradingScore] = useState(initialGradeState.gradingScore);
  const [gradingFeedback, setGradingFeedback] = useState(initialGradeState.gradingFeedback);
  const [gradingSubmissionStatus, setGradingSubmissionStatus] =
    useState<SubmissionStatus>(initialGradeState.gradingSubmissionStatus);
  const [gradingMypScores, setGradingMypScores] = useState<Record<string, number>>(
    initialGradeState.gradingMypScores
  );
  const [gradingDpGrade, setGradingDpGrade] = useState(initialGradeState.gradingDpGrade);
  const [gradingChecklistResults, setGradingChecklistResults] = useState<
    Record<string, ChecklistResultItem>
  >(initialGradeState.gradingChecklistResults);
  const [gradingRubricScores, setGradingRubricScores] = useState<
    Record<string, { criterionId: string; levelId: string; points: number }>
  >(initialGradeState.gradingRubricScores);
  const [gradingStandardsMastery, setGradingStandardsMastery] = useState<Record<string, string>>(
    initialGradeState.gradingStandardsMastery
  );
  const [reportDraft, setReportDraft] = useState<AssessmentReport | null>(
    assessment && student
      ? buildAssessmentReportDraft({
          assessment,
          student,
          grade,
          existingReport: report,
          now: getDemoNow().toISOString(),
        })
      : null
  );

  const gradingState = {
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

  const queueHref = embedded
    ? `/assessments/${assessmentId}?embed=1`
    : `/assessments/${assessmentId}?tab=submissions`;
  const previousHref = previousStudent
    ? `${embedded ? "" : ""}/assessments/${assessmentId}/students/${previousStudent.id}${embedded ? "?embed=1" : ""}`
    : null;
  const nextHref = nextStudent
    ? `${embedded ? "" : ""}/assessments/${assessmentId}/students/${nextStudent.id}${embedded ? "?embed=1" : ""}`
    : null;

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!assessment || !student || !linkedClass || !reportDraft) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Marking workspace unavailable"
        description="The assessment or learner context could not be loaded from the current demo data."
      />
    );
  }

  const persistReport = (nextReport: AssessmentReport) => {
    const payload = {
      status: nextReport.status,
      summary: nextReport.summary,
      strengths: nextReport.strengths,
      weaknesses: nextReport.weaknesses,
      suggestions: nextReport.suggestions,
      rubricFeedback: nextReport.rubricFeedback,
      sourceAttribution: nextReport.sourceAttribution,
      generatedAt: nextReport.generatedAt,
      updatedAt: nextReport.updatedAt,
      releasedAt: nextReport.releasedAt,
    };

    if (report) {
      updateAssessmentReport(report.id, payload);
      return report.id;
    }

    addAssessmentReport(nextReport);
    return nextReport.id;
  };

  const persistGrade = (mode: "draft" | "ready" | "release") => {
    const now = getDemoNow().toISOString();
    const payload = buildGradePayload(assessment, student.id, {
      score: gradingScore,
      dpGrade: gradingDpGrade,
      mypScores: gradingMypScores,
      checklistResults: gradingChecklistResults,
      rubricScores: gradingRubricScores,
      standardsMastery: gradingStandardsMastery,
      feedback: gradingFeedback,
      submissionStatus: gradingSubmissionStatus,
    });

    const tempGrade = {
      id: grade?.id ?? "",
      assessmentId: assessment.id,
      studentId: student.id,
      classId: assessment.classId,
      gradingMode: assessment.gradingMode,
      submissionStatus: gradingSubmissionStatus,
      ...payload,
    } as GradeRecord;

    const complete = isGradingComplete(tempGrade, assessment);
    if ((mode === "ready" || mode === "release") && !complete) {
      toast.error("Complete the required grading inputs before marking this ready.");
      return null;
    }

    const nextPayload: Partial<GradeRecord> = {
      ...payload,
      gradingStatus:
        mode === "draft" ? payload.gradingStatus ?? "in_progress" : complete ? "ready" : "in_progress",
      updatedAt: now,
    };

    if (mode === "release") {
      nextPayload.releasedAt = now;
      nextPayload.reportStatus = "unseen";
    }

    if (grade) {
      updateGrade(grade.id, nextPayload);
      return grade.id;
    }

    const gradeId = generateId("grade");
    addGrade({
      id: gradeId,
      assessmentId: assessment.id,
      studentId: student.id,
      classId: assessment.classId,
      gradingMode: assessment.gradingMode,
      submissionStatus: gradingSubmissionStatus,
      updatedAt: now,
      ...nextPayload,
    });
    return gradeId;
  };

  const handleSaveDraft = () => {
    persistGrade("draft");
    const now = getDemoNow().toISOString();
    const nextReport = {
      ...reportDraft,
      status: "draft" as const,
      updatedAt: now,
    };
    persistReport(nextReport);
    setReportDraft(nextReport);
    toast.success("Review draft saved");
  };

  const handleMarkReady = () => {
    const gradeId = persistGrade("ready");
    if (!gradeId) return;
    const now = getDemoNow().toISOString();
    const nextReport = {
      ...reportDraft,
      status: "ready" as const,
      updatedAt: now,
    };
    persistReport(nextReport);
    setReportDraft(nextReport);
    toast.success("Outcome marked ready");
  };

  const handleRelease = () => {
    const gradeId = persistGrade("release");
    if (!gradeId) return;
    const now = getDemoNow().toISOString();
    const nextReport = {
      ...reportDraft,
      status: "released" as const,
      releasedAt: now,
      updatedAt: now,
    };
    persistReport(nextReport);
    setReportDraft(nextReport);
    toast.success(`Released outcome for ${student.firstName} ${student.lastName}`);
  };

  return (
    <StudentMarkingWorkspace
      assessment={assessment}
      student={student}
      submission={submission}
      grade={grade}
      report={reportDraft}
      state={gradingState}
      onReportChange={(updates) =>
        setReportDraft((current) => (current ? { ...current, ...updates } : current))
      }
      onSaveDraft={handleSaveDraft}
      onMarkReady={handleMarkReady}
      onRelease={handleRelease}
      backHref={queueHref}
      previousHref={previousHref}
      nextHref={nextHref}
    />
  );
}
