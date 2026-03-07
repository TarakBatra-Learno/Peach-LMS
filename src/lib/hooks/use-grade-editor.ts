"use client";

import { useState } from "react";
import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import type { GradeRecord, SubmissionStatus, ChecklistResultItem } from "@/types/gradebook";

const MYP_CRITERIA_LABELS = ["A", "B", "C", "D"] as const;

export function useGradeEditor() {
  const assessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const getStudentById = useStore((s) => s.getStudentById);
  const addGrade = useStore((s) => s.addGrade);
  const updateGrade = useStore((s) => s.updateGrade);

  const [gradingOpen, setGradingOpen] = useState(false);
  const [gradingStudentId, setGradingStudentId] = useState("");
  const [gradingAssessmentId, setGradingAssessmentId] = useState("");
  const [gradingScore, setGradingScore] = useState("");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingSubmissionStatus, setGradingSubmissionStatus] = useState<SubmissionStatus>("none");
  const [gradingMypScores, setGradingMypScores] = useState<Record<string, number>>({});
  const [gradingDpGrade, setGradingDpGrade] = useState("4");
  const [gradingChecklistResults, setGradingChecklistResults] = useState<
    Record<string, ChecklistResultItem>
  >({});

  const openGradingSheet = (studentId: string, assessmentId: string) => {
    const asmt = assessments.find((a) => a.id === assessmentId);
    if (!asmt) return;

    const existingGrade = grades.find(
      (g) => g.studentId === studentId && g.assessmentId === assessmentId
    );

    setGradingStudentId(studentId);
    setGradingAssessmentId(assessmentId);
    setGradingSubmissionStatus(existingGrade?.submissionStatus ?? "none");
    setGradingFeedback(existingGrade?.feedback ?? "");

    if (asmt.gradingMode === "score") {
      setGradingScore(existingGrade?.score?.toString() ?? "");
    } else if (asmt.gradingMode === "dp_scale") {
      setGradingDpGrade(existingGrade?.dpGrade?.toString() ?? "4");
    } else if (asmt.gradingMode === "myp_criteria") {
      const existing: Record<string, number> = {};
      existingGrade?.mypCriteriaScores?.forEach((c) => {
        existing[c.criterion] = c.level;
      });
      setGradingMypScores(existing);
    } else if (asmt.gradingMode === "checklist") {
      const existing: Record<string, ChecklistResultItem> = {};
      existingGrade?.checklistGradeResults?.forEach((r) => {
        existing[r.itemId] = r;
      });
      setGradingChecklistResults(existing);
    }

    setGradingOpen(true);
  };

  const handleSaveGrade = () => {
    const asmt = assessments.find((a) => a.id === gradingAssessmentId);
    const student = getStudentById(gradingStudentId);
    if (!asmt || !student) return;

    const existingGrade = grades.find(
      (g) =>
        g.studentId === gradingStudentId &&
        g.assessmentId === gradingAssessmentId
    );
    const now = new Date().toISOString();

    const baseGrade: Partial<GradeRecord> = {
      assessmentId: asmt.id,
      studentId: gradingStudentId,
      classId: asmt.classId,
      gradingMode: asmt.gradingMode,
      feedback: gradingFeedback.trim() || undefined,
      submissionStatus: gradingSubmissionStatus,
      gradedAt: now,
    };

    // Grade inputs are hidden when missing OR excused
    if (gradingSubmissionStatus !== "missing" && gradingSubmissionStatus !== "excused") {
      if (asmt.gradingMode === "score") {
        baseGrade.score = parseInt(gradingScore) || 0;
        baseGrade.totalPoints = asmt.totalPoints;
      } else if (asmt.gradingMode === "dp_scale") {
        baseGrade.dpGrade = parseInt(gradingDpGrade) || 4;
      } else if (asmt.gradingMode === "myp_criteria") {
        baseGrade.mypCriteriaScores = MYP_CRITERIA_LABELS.map((c) => ({
          criterionId: `crit_${c}`,
          criterion: c,
          level: gradingMypScores[c] ?? 0,
        }));
      } else if (asmt.gradingMode === "checklist") {
        baseGrade.checklistGradeResults = (asmt.checklist ?? []).map(
          (item) => {
            const result = gradingChecklistResults[item.id];
            return {
              itemId: item.id,
              status: result?.status ?? "unmarked",
              evidence: result?.evidence,
            };
          }
        );
      }
    } else if (gradingSubmissionStatus === "excused") {
      // Excused: explicitly clear ALL grade payloads, feedback, and submission artifacts
      baseGrade.score = undefined;
      baseGrade.dpGrade = undefined;
      baseGrade.mypCriteriaScores = undefined;
      baseGrade.rubricScores = undefined;
      baseGrade.standardsMastery = undefined;
      baseGrade.checklistGradeResults = undefined;
      baseGrade.checklistResults = undefined;
      baseGrade.feedback = undefined;
      baseGrade.gradedAt = undefined;
      baseGrade.submittedAt = undefined;
    }

    if (existingGrade) {
      updateGrade(existingGrade.id, baseGrade);
      toast.success(
        `Grade updated for ${student.firstName} ${student.lastName}`
      );
    } else {
      addGrade({
        id: generateId("grade"),
        ...baseGrade,
      } as GradeRecord);
      toast.success(
        `Grade saved for ${student.firstName} ${student.lastName}`
      );
    }

    setGradingOpen(false);
  };

  const gradingAssessment = assessments.find(
    (a) => a.id === gradingAssessmentId
  );
  const gradingStudentObj = getStudentById(gradingStudentId);

  return {
    gradingOpen,
    setGradingOpen,
    gradingStudentId,
    gradingAssessmentId,
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
    gradingAssessment,
    gradingStudentObj,
    openGradingSheet,
    handleSaveGrade,
  };
}
