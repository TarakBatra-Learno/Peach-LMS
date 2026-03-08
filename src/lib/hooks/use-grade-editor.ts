"use client";

import { useState } from "react";
import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import { buildGradePayload } from "@/lib/grade-save";
import type { GradeRecord, SubmissionStatus, ChecklistResultItem } from "@/types/gradebook";

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
  const [gradingRubricScores, setGradingRubricScores] = useState<
    Record<string, { criterionId: string; levelId: string; points: number }>
  >({});
  const [gradingStandardsMastery, setGradingStandardsMastery] = useState<
    Record<string, string>
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
    } else if (asmt.gradingMode === "rubric") {
      const existing: Record<string, { criterionId: string; levelId: string; points: number }> = {};
      existingGrade?.rubricScores?.forEach((r) => {
        existing[r.criterionId] = r;
      });
      setGradingRubricScores(existing);
    } else if (asmt.gradingMode === "standards") {
      const existing: Record<string, string> = {};
      existingGrade?.standardsMastery?.forEach((s) => {
        existing[s.standardId] = s.level;
      });
      setGradingStandardsMastery(existing);
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

    const payload = buildGradePayload(asmt, gradingStudentId, {
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
      updateGrade(existingGrade.id, payload);
      toast.success(
        `Grade updated for ${student.firstName} ${student.lastName}`
      );
    } else {
      addGrade({
        id: generateId("grade"),
        ...payload,
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
    gradingRubricScores,
    setGradingRubricScores,
    gradingStandardsMastery,
    setGradingStandardsMastery,
    gradingAssessment,
    gradingStudentObj,
    openGradingSheet,
    handleSaveGrade,
  };
}
