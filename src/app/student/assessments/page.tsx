"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import {
  getStudentAssessments,
  getStudentClasses,
  getStudentSubmission,
  getStudentReleasedGrades,
  getStudentSubmissionStatus,
} from "@/lib/student-selectors";
import type { StudentAssessmentView } from "@/lib/student-permissions";
import { StudentClassFilter } from "@/components/student/student-class-filter";
import { StudentAssessmentCard } from "@/components/student/student-assessment-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { ClipboardCheck } from "lucide-react";
import type { AppState } from "@/stores/types";

type FilterKey = "upcoming" | "past_due" | "submitted" | "graded";

export default function StudentAssessmentsPage() {
  const studentId = useStudentId();
  const state = useStore((s) => s) as AppState;
  const studentActiveClassId = useStore((s) => s.ui.studentActiveClassId);
  const loading = useMockLoading([studentId]);
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);

  const classes = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );

  const allAssessments = useMemo(
    () =>
      studentId
        ? getStudentAssessments(state, studentId, studentActiveClassId ?? undefined)
        : [],
    [state, studentId, studentActiveClassId]
  );

  // Apply filter
  const filteredAssessments = useMemo(() => {
    if (!activeFilter || !studentId) return allAssessments;

    const now = new Date();

    return allAssessments.filter((a) => {
      switch (activeFilter) {
        case "upcoming": {
          const due = new Date(a.dueDate);
          due.setHours(23, 59, 59, 999);
          return due >= now;
        }
        case "past_due": {
          const submission = getStudentSubmission(state, studentId, a.id);
          const rawGrade = state.grades.find((g: any) => g.studentId === studentId && g.assessmentId === a.id);
          const status = getStudentSubmissionStatus(rawGrade, submission, a as any);
          return status === "overdue";
        }
        case "submitted": {
          const submission = getStudentSubmission(state, studentId, a.id);
          const rawGrade = state.grades.find((g: any) => g.studentId === studentId && g.assessmentId === a.id);
          const status = getStudentSubmissionStatus(rawGrade, submission, a as any);
          return status === "submitted_on_time" || status === "submitted_late";
        }
        case "graded": {
          const releasedGrades = getStudentReleasedGrades(state, studentId);
          return releasedGrades.some((g) => g.assessmentId === a.id);
        }
        default:
          return true;
      }
    });
  }, [allAssessments, activeFilter, state, studentId]);

  // Group by class
  const groupedByClass = useMemo(() => {
    const groups: { classId: string; className: string; assessments: StudentAssessmentView[] }[] = [];
    const classMap = new Map<string, StudentAssessmentView[]>();

    for (const a of filteredAssessments) {
      const existing = classMap.get(a.classId) ?? [];
      existing.push(a);
      classMap.set(a.classId, existing);
    }

    for (const [classId, assessments] of classMap) {
      const cls = classes.find((c) => c.id === classId);
      const className = cls?.name ?? classId;

      // Sort: upcoming ascending (nearest first), past descending (most recent first)
      const now = new Date();
      const sorted = [...assessments].sort((a, b) => {
        const dueA = new Date(a.dueDate);
        const dueB = new Date(b.dueDate);
        dueA.setHours(23, 59, 59, 999);
        dueB.setHours(23, 59, 59, 999);
        const aIsUpcoming = dueA >= now;
        const bIsUpcoming = dueB >= now;

        // Both upcoming: ascending
        if (aIsUpcoming && bIsUpcoming) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        // Both past: descending
        if (!aIsUpcoming && !bIsUpcoming) {
          return b.dueDate.localeCompare(a.dueDate);
        }
        // Upcoming before past
        return aIsUpcoming ? -1 : 1;
      });

      groups.push({ classId, className, assessments: sorted });
    }

    // Sort groups by class name
    groups.sort((a, b) => a.className.localeCompare(b.className));

    return groups;
  }, [filteredAssessments, classes]);

  if (loading) return <DetailSkeleton />;

  return (
    <div>
      <PageHeader title="Assessments">
        <div className="mt-2">
          <StudentClassFilter />
        </div>
      </PageHeader>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6">
        {([
          { key: "upcoming" as FilterKey, label: "Upcoming" },
          { key: "past_due" as FilterKey, label: "Overdue" },
          { key: "submitted" as FilterKey, label: "Submitted" },
          { key: "graded" as FilterKey, label: "Graded" },
        ]).map((f) => (
          <button
            key={f.key}
            className={`text-[12px] px-3 py-1 rounded-full border ${
              activeFilter === f.key
                ? "bg-[#c24e3f] text-white border-[#c24e3f]"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveFilter(activeFilter === f.key ? null : f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredAssessments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={activeFilter ? "No matching assessments" : "No assessments yet"}
          description={
            activeFilter
              ? "Try changing the filter or class selection."
              : "Your teachers haven't published any assessments yet."
          }
        />
      ) : (
        <div className="space-y-8">
          {groupedByClass.map((group) => (
            <div key={group.classId}>
              <h2 className="text-[14px] font-semibold text-foreground mb-3">
                {group.className}
              </h2>
              <div className="space-y-2">
                {group.assessments.map((a) => (
                  <StudentAssessmentCard
                    key={a.id}
                    assessment={a}
                    classId={a.classId}
                    studentId={studentId!}
                    showClassName={false}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
