"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { UnitRouteShell } from "@/components/planning/unit-route-shell";
import { StrategyEditDrawer } from "@/components/unit-planning/strategy-edit-drawer";
import { LessonPlanDrawer } from "@/components/unit-planning/lesson-plan-drawer";
import { AssignLessonDialog } from "@/components/unit-planning/assign-lesson-dialog";
import { LinkAssessmentDialog } from "@/components/unit-planning/link-assessment-dialog";
import { useStore } from "@/stores";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import {
  getUnitAssessments,
  getUnassignedLessonPlans,
  materializeTimetableOccurrences,
} from "@/lib/unit-planning-utils";
import { getDemoNow } from "@/lib/demo-time";
import type { LessonPlan, MaterializedOccurrence } from "@/types/unit-planning";

function today() {
  return getDemoNow();
}

export default function UnitPlanningRoutePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = params.unitId as string;
  const loading = useMockLoading([unitId]);
  const embedded = searchParams.get("embed") === "1";

  const unitPlans = useStore((s) => s.unitPlans);
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const lessonPlans = useStore((s) => s.lessonPlans);
  const assessments = useStore((s) => s.assessments);
  const learningGoals = useStore((s) => s.learningGoals);
  const grades = useStore((s) => s.grades);
  const lessonSlotAssignments = useStore((s) => s.lessonSlotAssignments);
  const updateUnitPlan = useStore((s) => s.updateUnitPlan);
  const addLessonPlan = useStore((s) => s.addLessonPlan);
  const assignLessonToSlot = useStore((s) => s.assignLessonToSlot);
  const unassignLessonFromSlot = useStore((s) => s.unassignLessonFromSlot);
  const autoFillLessonSequence = useStore((s) => s.autoFillLessonSequence);
  const linkAssessmentToUnit = useStore((s) => s.linkAssessmentToUnit);
  const unlinkAssessmentFromUnit = useStore((s) => s.unlinkAssessmentFromUnit);

  const unit = unitPlans.find((entry) => entry.id === unitId) ?? null;
  const linkedClass = unit ? classes.find((entry) => entry.id === unit.classId) ?? null : null;
  const unitLessons = useMemo(
    () =>
      unit
        ? lessonPlans
            .filter((lesson) => lesson.unitId === unit.id)
            .sort((a, b) => a.sequence - b.sequence)
        : [],
    [lessonPlans, unit]
  );
  const unitAssessments = useMemo(
    () => (unit ? getUnitAssessments(assessments, unit.id) : []),
    [assessments, unit]
  );
  const unitAssignments = useMemo(
    () =>
      unit
        ? lessonSlotAssignments.filter((assignment) => assignment.unitId === unit.id)
        : [],
    [lessonSlotAssignments, unit]
  );
  const unitOccurrences = useMemo(() => {
    if (!unit || !linkedClass) return [];
    return materializeTimetableOccurrences(linkedClass.schedule, unit.startDate, unit.endDate);
  }, [linkedClass, unit]);
  const classStudents = useMemo(
    () =>
      linkedClass ? students.filter((student) => linkedClass.studentIds.includes(student.id)) : [],
    [linkedClass, students]
  );
  const relevantLearningGoals = useMemo(() => {
    if (!linkedClass) return learningGoals;

    const filtered = learningGoals.filter((goal) => {
      if (goal.subject === "ATL" || goal.subject === "Learner Profile") return true;
      if (linkedClass.type === "homeroom") {
        return goal.subject === linkedClass.subject || goal.subject === "Interdisciplinary";
      }
      return goal.subject === linkedClass.subject;
    });

    return filtered.length > 0 ? filtered : learningGoals;
  }, [learningGoals, linkedClass]);

  const [strategyDrawerOpen, setStrategyDrawerOpen] = useState(false);
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignOccurrence, setAssignOccurrence] = useState<MaterializedOccurrence | null>(null);
  const [linkAssessmentOpen, setLinkAssessmentOpen] = useState(false);

  const selectedLesson = useMemo(
    () => lessonPlans.find((lesson) => lesson.id === (selectedLessonId ?? "")) ?? null,
    [lessonPlans, selectedLessonId]
  );
  const selectedLessonAssignment = useMemo(
    () =>
      selectedLessonId
        ? lessonSlotAssignments.find((assignment) => assignment.lessonPlanId === selectedLessonId)
        : undefined,
    [lessonSlotAssignments, selectedLessonId]
  );

  const getAssessmentHref = (assessmentId: string) =>
    `/assessments/${assessmentId}${embedded ? "?embed=1" : `?classId=${linkedClass?.id ?? ""}`}`;
  const getStudentHref = (studentId: string) =>
    `/students/${studentId}?classId=${linkedClass?.id ?? ""}&unitId=${unit?.id ?? ""}`;

  const handleAddLesson = () => {
    if (!unit || !linkedClass) return;
    const now = today().toISOString();
    const newLesson: LessonPlan = {
      id: `lp_new_${Date.now()}`,
      unitId: unit.id,
      classId: linkedClass.id,
      title: `Lesson ${unitLessons.length + 1}`,
      sequence: unitLessons.length + 1,
      activities: [],
      linkedStandardIds: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    addLessonPlan(newLesson);
    setSelectedLessonId(newLesson.id);
    setLessonDrawerOpen(true);
    toast.success("Lesson plan added");
  };

  const handleOpenLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setLessonDrawerOpen(true);
  };

  const handleAssignLesson = (lessonPlanId: string) => {
    if (!assignOccurrence || !unit || !linkedClass) return;
    assignLessonToSlot({
      id: `lsa_new_${Date.now()}`,
      lessonPlanId,
      unitId: unit.id,
      classId: linkedClass.id,
      date: assignOccurrence.date,
      slotDay: assignOccurrence.slotDay,
      slotStartTime: assignOccurrence.slotStartTime,
      createdAt: today().toISOString(),
    });
    setAssignDialogOpen(false);
    setAssignOccurrence(null);
    toast.success("Lesson assigned to slot");
  };

  const handleAutoFill = () => {
    if (!unit) return;
    const count = autoFillLessonSequence(unit.id);
    if (count === 0) {
      toast("No lessons assigned", {
        description: "Either no ready lesson plans or no available slots.",
      });
      return;
    }
    toast.success(`Assigned ${count} lesson plan${count !== 1 ? "s" : ""}`);
  };

  const handleLinkAssessments = (assessmentIds: string[]) => {
    if (!unit) return;
    for (const assessmentId of assessmentIds) {
      linkAssessmentToUnit(assessmentId, unit.id);
    }
    setLinkAssessmentOpen(false);
    toast.success(`Linked ${assessmentIds.length} assessment${assessmentIds.length !== 1 ? "s" : ""}`);
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!unit || !linkedClass) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Unit unavailable"
        description="The requested unit could not be loaded from the current planning data."
      />
    );
  }

  return (
    <div className="space-y-4">
      <UnitRouteShell
        unit={unit}
        className={linkedClass.name}
        learningGoals={relevantLearningGoals}
        lessons={unitLessons}
        assessments={unitAssessments}
        assignments={unitAssignments}
        occurrences={unitOccurrences}
        students={classStudents}
        grades={grades}
        embedded={embedded}
        getAssessmentHref={getAssessmentHref}
        getStudentHref={getStudentHref}
        onEditStrategy={() => setStrategyDrawerOpen(true)}
        onAddLesson={handleAddLesson}
        onOpenLesson={handleOpenLesson}
        onCreateAssessment={() => {
          const nextUrl = `/assessments?createFor=${linkedClass.id}&unitId=${unit.id}`;
          router.push(nextUrl);
        }}
        onOpenAssessmentLinker={() => setLinkAssessmentOpen(true)}
        onAutoFill={handleAutoFill}
        onPrepareAssign={(occurrence) => {
          setAssignOccurrence(occurrence);
          setAssignDialogOpen(true);
        }}
        onUnassignLesson={(lessonPlanId) => {
          unassignLessonFromSlot(lessonPlanId);
          toast.success("Lesson unassigned");
        }}
        onUnlinkAssessment={(assessmentId) => {
          unlinkAssessmentFromUnit(assessmentId);
          toast.success("Assessment unlinked");
        }}
      />

      <StrategyEditDrawer
        open={strategyDrawerOpen}
        onOpenChange={setStrategyDrawerOpen}
        strategy={unit.strategy}
        programme={unit.programme}
        learningGoals={relevantLearningGoals}
        onSave={(strategy) => {
          updateUnitPlan(unit.id, {
            strategy,
            updatedAt: today().toISOString(),
          });
          toast.success("Strategy updated");
        }}
      />

      <LessonPlanDrawer
        key={`${selectedLesson?.id ?? "none"}-${lessonDrawerOpen ? "open" : "closed"}`}
        open={lessonDrawerOpen}
        onOpenChange={(open) => {
          setLessonDrawerOpen(open);
          if (!open) {
            setSelectedLessonId(null);
          }
        }}
        lessonPlan={selectedLesson}
        learningGoals={relevantLearningGoals}
        assignment={selectedLessonAssignment}
      />

      <AssignLessonDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        occurrence={assignOccurrence}
        readyLessonPlans={getUnassignedLessonPlans(unitLessons)}
        onAssign={handleAssignLesson}
      />

      <LinkAssessmentDialog
        open={linkAssessmentOpen}
        onOpenChange={setLinkAssessmentOpen}
        assessments={assessments.filter(
          (assessment) => assessment.classId === linkedClass.id && !assessment.unitId
        )}
        unitId={unit.id}
        onLink={handleLinkAssessments}
      />
    </div>
  );
}
