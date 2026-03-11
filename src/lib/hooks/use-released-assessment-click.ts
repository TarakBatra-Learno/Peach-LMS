"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { canStudentViewGrade } from "@/lib/student-permissions";

export function useReleasedAssessmentClick(studentId: string) {
  const router = useRouter();
  const assessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const [sheetAssessmentId, setSheetAssessmentId] = useState<string | null>(null);

  const handleClick = useCallback(
    (assessmentId: string, classId: string) => {
      const assessment = assessments.find((a) => a.id === assessmentId);
      if (!assessment) return;

      const grade = grades.find(
        (g) => g.studentId === studentId && g.assessmentId === assessmentId
      );

      const isGradeVisible = canStudentViewGrade(assessment, grade);

      if (isGradeVisible && grade) {
        setSheetAssessmentId(assessmentId);
      } else {
        router.push(`/student/classes/${classId}/assessments/${assessmentId}`);
      }
    },
    [assessments, grades, studentId, router]
  );

  const sheetProps = {
    open: !!sheetAssessmentId,
    onClose: () => setSheetAssessmentId(null),
    assessmentId: sheetAssessmentId,
    studentId,
  };

  return { handleClick, sheetProps };
}
