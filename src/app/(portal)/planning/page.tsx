"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import { PlanningHub } from "@/components/planning/planning-hub";
import type { LessonPlan, UnitPlan } from "@/types/unit-planning";
import type { PlanningCreateInput } from "@/components/planning/planning-create-dialog";
import { toast } from "sonner";
import { getDemoNow } from "@/lib/demo-time";

function todayIso() {
  return getDemoNow().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const date = new Date(getDemoNow());
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function PlanningPage() {
  const router = useRouter();
  const classes = useStore((state) => state.classes);
  const activeClassId = useStore((state) => state.ui.activeClassId);
  const activeAcademicYear = useStore((state) => state.ui.activeAcademicYear);
  const unitPlans = useStore((state) => state.unitPlans);
  const lessonPlans = useStore((state) => state.lessonPlans);
  const assessments = useStore((state) => state.assessments);
  const addUnitPlan = useStore((state) => state.addUnitPlan);
  const addLessonPlan = useStore((state) => state.addLessonPlan);

  const sortedClasses = useMemo(
    () =>
      classes
        .filter((entry) => entry.academicYear === activeAcademicYear)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activeAcademicYear, classes]
  );
  const visibleClassIds = useMemo(
    () => new Set(sortedClasses.map((entry) => entry.id)),
    [sortedClasses]
  );
  const visibleUnitPlans = useMemo(
    () => unitPlans.filter((unit) => visibleClassIds.has(unit.classId)),
    [unitPlans, visibleClassIds]
  );
  const visibleLessonPlans = useMemo(
    () => lessonPlans.filter((lesson) => visibleClassIds.has(lesson.classId)),
    [lessonPlans, visibleClassIds]
  );
  const visibleAssessments = useMemo(
    () => assessments.filter((assessment) => visibleClassIds.has(assessment.classId)),
    [assessments, visibleClassIds]
  );

  const handleCreatePlan = (input: PlanningCreateInput) => {
    const linkedClass = sortedClasses.find((entry) => entry.id === input.classId);
    if (!linkedClass) return;

    const now = getDemoNow().toISOString();

    if (input.kind === "unit") {
      const classUnits = visibleUnitPlans.filter((unit) => unit.classId === input.classId);
      const newUnit: UnitPlan = {
        id: generateId("unit"),
        classId: input.classId,
        title: input.title || "New unit plan",
        programme: linkedClass.programme,
        status: "draft",
        startDate: todayIso(),
        endDate: plusDaysIso(28),
        strategy: {
          learningGoals: [],
          linkedStandardIds: [],
          reflection: {
            prompts: [
              "What planning move do we still need to tighten before teaching begins?",
            ],
          },
        },
        lessonPlanIds: [],
        order: classUnits.length + 1,
        collaborators: [],
        sectionComments: [],
        createdAt: now,
        updatedAt: now,
      };
      addUnitPlan(newUnit);
      toast.success("Unit plan created");
      router.push(`/planning/units/${newUnit.id}`);
      return;
    }

    if (!input.unitId) {
      toast.error("Choose a unit before creating a lesson from the Planning hub");
      return;
    }

    const unitLessons = visibleLessonPlans.filter((lesson) => lesson.unitId === input.unitId);
    const newLesson: LessonPlan = {
      id: generateId("lp"),
      unitId: input.unitId,
      classId: input.classId,
      title: input.title || "New lesson plan",
      category: "Lesson",
      sequence: unitLessons.length + 1,
      activities: [],
      linkedStandardIds: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    addLessonPlan(newLesson);
    toast.success("Lesson plan created");
    router.push(
      `/classes/${input.classId}?tab=units&planningView=lessons&selectedUnitId=${input.unitId}&selectedLessonId=${newLesson.id}`
    );
  };

  return (
    <PlanningHub
      classes={sortedClasses}
      units={visibleUnitPlans}
      lessons={visibleLessonPlans}
      assessments={visibleAssessments}
      activeClassId={activeClassId}
      onCreatePlan={handleCreatePlan}
    />
  );
}
