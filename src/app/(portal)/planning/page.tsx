"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import { PlanningHub } from "@/components/planning/planning-hub";
import type { LessonPlan, UnitPlan } from "@/types/unit-planning";
import type { PlanningCreateInput } from "@/components/planning/planning-create-dialog";
import { toast } from "sonner";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function PlanningPage() {
  const router = useRouter();
  const classes = useStore((state) => state.classes);
  const unitPlans = useStore((state) => state.unitPlans);
  const lessonPlans = useStore((state) => state.lessonPlans);
  const assessments = useStore((state) => state.assessments);
  const addUnitPlan = useStore((state) => state.addUnitPlan);
  const addLessonPlan = useStore((state) => state.addLessonPlan);

  const sortedClasses = useMemo(
    () => classes.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [classes]
  );

  const handleCreatePlan = (input: PlanningCreateInput) => {
    const linkedClass = sortedClasses.find((entry) => entry.id === input.classId);
    if (!linkedClass) return;

    const now = new Date().toISOString();

    if (input.kind === "unit") {
      const classUnits = unitPlans.filter((unit) => unit.classId === input.classId);
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
      router.push(`/classes/${input.classId}?tab=units`);
      return;
    }

    let targetUnitId = input.unitId;
    if (!targetUnitId) {
      const fallbackUnit: UnitPlan = {
        id: generateId("unit"),
        classId: input.classId,
        title: `${linkedClass.name} lesson sequence`,
        programme: linkedClass.programme,
        status: "draft",
        startDate: todayIso(),
        endDate: plusDaysIso(14),
        strategy: {
          learningGoals: [],
          linkedStandardIds: [],
          reflection: {
            prompts: ["Which lesson should anchor this sequence?"],
          },
        },
        lessonPlanIds: [],
        order: unitPlans.filter((unit) => unit.classId === input.classId).length + 1,
        collaborators: [],
        sectionComments: [],
        createdAt: now,
        updatedAt: now,
      };
      addUnitPlan(fallbackUnit);
      targetUnitId = fallbackUnit.id;
    }

    const unitLessons = lessonPlans.filter((lesson) => lesson.unitId === targetUnitId);
    const newLesson: LessonPlan = {
      id: generateId("lp"),
      unitId: targetUnitId,
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
    router.push(`/classes/${input.classId}?tab=units`);
  };

  return (
    <PlanningHub
      classes={sortedClasses}
      units={unitPlans}
      lessons={lessonPlans}
      assessments={assessments}
      onCreatePlan={handleCreatePlan}
    />
  );
}
