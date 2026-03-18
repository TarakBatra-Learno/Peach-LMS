"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LinkIcon, Pencil, Unlink, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getGradePercentage, GRADING_MODE_LABELS } from "@/lib/grade-helpers";
import type { Assessment, LearningGoal } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { Student } from "@/types/student";
import type {
  LessonPlan,
  LessonSlotAssignment,
  MaterializedOccurrence,
  UnitPlan,
} from "@/types/unit-planning";
import { SectionCommentsPanel } from "@/components/planning/section-comments-panel";
import { StrategySectionNav } from "@/components/planning/strategy-section-nav";

interface UnitDetailWorkspaceProps {
  unit: UnitPlan;
  learningGoals: LearningGoal[];
  lessons: LessonPlan[];
  assessments: Assessment[];
  assignments: LessonSlotAssignment[];
  occurrences: MaterializedOccurrence[];
  students: Student[];
  grades: GradeRecord[];
  embedded?: boolean;
  getAssessmentHref: (assessmentId: string) => string;
  getStudentHref: (studentId: string) => string;
  onEditStrategy: () => void;
  onAddLesson: () => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenAssessmentLinker: () => void;
  onAutoFill: () => void;
  onPrepareAssign: (occurrence: MaterializedOccurrence) => void;
  onUnassignLesson: (lessonPlanId: string) => void;
  onUnlinkAssessment: (assessmentId: string) => void;
}

const DETAIL_SECTIONS = [
  { value: "inquiry", label: "Inquiry & action" },
  { value: "content_sequence", label: "Teaching sequence" },
  { value: "evidence", label: "Evidence" },
  { value: "reflection", label: "Planning notes" },
] as const;

type DetailSection = (typeof DETAIL_SECTIONS)[number]["value"];

export function UnitDetailWorkspace({
  unit,
  learningGoals,
  lessons,
  assessments,
  assignments,
  occurrences,
  students,
  grades,
  embedded = false,
  getAssessmentHref,
  getStudentHref,
  onEditStrategy,
  onAddLesson,
  onOpenLesson,
  onOpenAssessmentLinker,
  onAutoFill,
  onPrepareAssign,
  onUnassignLesson,
  onUnlinkAssessment,
}: UnitDetailWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<DetailSection>("inquiry");

  const learningGoalBadges = useMemo(
    () =>
      unit.strategy.linkedStandardIds
        .map((goalId) => learningGoals.find((goal) => goal.id === goalId))
        .filter(Boolean) as LearningGoal[],
    [learningGoals, unit.strategy.linkedStandardIds]
  );

  const averagePercent = useMemo(() => {
    const percentages = assessments.flatMap((assessment) =>
      students
        .map((student) => {
          const grade = grades.find(
            (entry) =>
              entry.studentId === student.id && entry.assessmentId === assessment.id
          );
          return grade ? getGradePercentage(grade, assessment) : null;
        })
        .filter((value): value is number => value !== null)
    );

    if (percentages.length === 0) return null;
    return Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length);
  }, [assessments, grades, students]);

  const activeSectionLabel =
    DETAIL_SECTIONS.find((section) => section.value === activeSection)?.label ?? "Section";

  return (
    <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Unit strategy
        </p>
        <h3 className="mt-2 text-[18px] font-semibold">Strategy sections</h3>
        <p className="mt-2 text-[13px] font-medium text-foreground">{unit.title}</p>
        <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
          Define the unit story here, then move into Unit content to build lessons and assessments.
        </p>

        <div className="mt-4 grid gap-3">
          <SummaryMetric label="Lessons" value={String(lessons.length)} />
          <SummaryMetric label="Assessments" value={String(assessments.length)} />
          <SummaryMetric
            label="Collaborators"
            value={String(unit.collaborators?.length ?? 0)}
          />
        </div>

        <StrategySectionNav
          sections={DETAIL_SECTIONS}
          activeSection={activeSection}
          onSelectSection={(section) => setActiveSection(section as DetailSection)}
        />
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Badge variant="outline">{unit.programme}</Badge>
            <p className="mt-3 text-[16px] font-semibold">{activeSectionLabel}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {getSectionDescription(activeSection)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onEditStrategy}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit strategy
          </Button>
        </div>

        <div className="mt-5 space-y-5">
          {activeSection === "inquiry" ? (
            <>
              <section className="space-y-3">
                <SectionTitle title="Unit basics" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SignalCard label="Dates" value={`${unit.startDate} to ${unit.endDate}`} />
                  <SignalCard label="Status" value={sentenceCase(unit.status)} />
                </div>
                <p className="text-[13px] leading-6 text-muted-foreground">
                  {unit.summary || "Add a unit summary to make the planning narrative easier to scan."}
                </p>
                {unit.strategy.assessmentApproach ? (
                  <p className="text-[13px] leading-6 text-muted-foreground">
                    {unit.strategy.assessmentApproach}
                  </p>
                ) : null}
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Inquiry" />
                <p className="text-[13px] leading-6 text-muted-foreground">
                  {unit.strategy.inquiry?.statement ??
                    unit.strategy.conceptualFraming?.statementOfInquiry ??
                    "No inquiry statement recorded yet."}
                </p>
                <QuestionList
                  label="Factual"
                  questions={unit.strategy.inquiry?.factualQuestions}
                />
                <QuestionList
                  label="Conceptual"
                  questions={unit.strategy.inquiry?.conceptualQuestions}
                />
                <QuestionList
                  label="Debatable"
                  questions={unit.strategy.inquiry?.debatableQuestions}
                />
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Learning focus" />
                <div className="flex flex-wrap gap-2">
                  {learningGoalBadges.length > 0 ? (
                    learningGoalBadges.map((goal) => (
                      <Badge key={goal.id} variant="outline">
                        {goal.code}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-[13px] text-muted-foreground">
                      No standards or skills tagged yet.
                    </p>
                  )}
                </div>
                {unit.strategy.learningFocus?.objectiveLabels?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {unit.strategy.learningFocus.objectiveLabels.map((label) => (
                      <Badge key={label} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Action" />
                <p className="text-[13px] leading-6 text-muted-foreground">
                  {unit.strategy.action?.differentiationNotes ??
                    "Differentiation notes have not been added yet."}
                </p>
                {unit.strategy.action?.communityConnections?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {unit.strategy.action.communityConnections.map((connection) => (
                      <Badge key={connection} variant="outline">
                        {connection}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </section>
            </>
          ) : null}

          {activeSection === "content_sequence" ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onAddLesson}>
                  Add lesson
                </Button>
                <Button size="sm" variant="outline" onClick={onOpenAssessmentLinker}>
                  <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                  Link assessment
                </Button>
                <Button size="sm" variant="outline" onClick={onAutoFill}>
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Auto-fill teaching slots
                </Button>
              </div>

              <section className="space-y-3">
                <SectionTitle title="Lessons" />
                <div className="space-y-2">
                  {lessons.length > 0 ? (
                    lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => onOpenLesson(lesson.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-border/70 p-3 text-left transition-colors hover:bg-muted/30"
                      >
                        <div>
                          <p className="text-[13px] font-medium">{lesson.title}</p>
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            {lesson.category || "Lesson"} · {sentenceCase(lesson.status)}
                          </p>
                        </div>
                        <span className="text-[12px] font-medium text-[#c24e3f]">
                          Open lesson
                        </span>
                      </button>
                    ))
                  ) : (
                    <EmptyHint text="No lessons linked yet. Add the first lesson to start building the sequence." />
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Linked assessments" />
                <div className="space-y-2">
                  {assessments.length > 0 ? (
                    assessments.map((assessment) => (
                      <div
                        key={assessment.id}
                        className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={getAssessmentHref(assessment.id)}
                            target={embedded ? "_top" : undefined}
                            className="text-[13px] font-medium hover:text-[#c24e3f]"
                          >
                            {assessment.title}
                          </Link>
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            {GRADING_MODE_LABELS[assessment.gradingMode]} · due {assessment.dueDate}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUnlinkAssessment(assessment.id)}
                        >
                          <Unlink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <EmptyHint text="No assessments linked yet. Link or create unit assessments from Unit content." />
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Teaching slots" />
                <div className="space-y-2">
                  {occurrences.slice(0, 6).map((occurrence) => {
                    const assignment = assignments.find(
                      (entry) =>
                        entry.date === occurrence.date &&
                        entry.slotStartTime === occurrence.slotStartTime
                    );
                    return (
                      <div
                        key={`${occurrence.date}-${occurrence.slotStartTime}`}
                        className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                      >
                        <div className="min-w-[130px]">
                          <p className="text-[13px] font-medium">{occurrence.date}</p>
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            {occurrence.slotDay} · {occurrence.slotStartTime}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1 text-[13px] text-muted-foreground">
                          {assignment
                            ? lessons.find((lesson) => lesson.id === assignment.lessonPlanId)?.title ??
                              "Assigned lesson"
                            : "No lesson assigned"}
                        </div>
                        {assignment ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUnassignLesson(assignment.lessonPlanId)}
                          >
                            Unassign
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPrepareAssign(occurrence)}
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : null}

          {activeSection === "evidence" ? (
            <>
              <section className="space-y-3">
                <SectionTitle title="Evidence signals" />
                <div className="flex flex-wrap gap-2">
                  {(unit.strategy.evidence?.portfolioSignals ?? []).length > 0 ? (
                    (unit.strategy.evidence?.portfolioSignals ?? []).map((signal) => (
                      <Badge key={signal} variant="outline">
                        {signal}
                      </Badge>
                    ))
                  ) : (
                    <EmptyHint text="No portfolio or evidence signals have been recorded yet." />
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Standards and learning goals" />
                <div className="flex flex-wrap gap-2">
                  {learningGoalBadges.length > 0 ? (
                    learningGoalBadges.map((goal) => (
                      <Badge key={goal.id} variant="secondary">
                        {goal.code}
                      </Badge>
                    ))
                  ) : (
                    <EmptyHint text="Add standards and skills in Strategy to make unit evidence easier to track." />
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Student performance snapshot" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <SignalCard label="Linked assessments" value={String(assessments.length)} />
                  <SignalCard
                    label="Average"
                    value={averagePercent != null ? `${averagePercent}%` : "Pending"}
                  />
                  <SignalCard label="Students" value={String(students.length)} />
                </div>
                <div className="space-y-2">
                  {students.slice(0, 4).map((student) => (
                    <Link
                      key={student.id}
                      href={getStudentHref(student.id)}
                      target={embedded ? "_top" : undefined}
                      className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-[13px] transition-colors hover:bg-muted/30"
                    >
                      <span className="font-medium">
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="text-muted-foreground">Open student view</span>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {activeSection === "reflection" ? (
            <>
              <section className="space-y-3">
                <SectionTitle title="Reflection prompts" />
                <div className="space-y-2">
                  {(unit.strategy.reflection?.prompts ?? []).length > 0 ? (
                    (unit.strategy.reflection?.prompts ?? []).map((prompt) => (
                      <div
                        key={prompt}
                        className="rounded-xl border border-border/70 bg-muted/20 p-3 text-[13px]"
                      >
                        {prompt}
                      </div>
                    ))
                  ) : (
                    <EmptyHint text="No reflection prompts have been added yet." />
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Teacher notes" />
                <p className="text-[13px] leading-6 text-muted-foreground">
                  {unit.strategy.reflection?.teacherNotes ??
                    "No teacher reflection notes recorded yet."}
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionTitle title="Lesson reflections" />
                <div className="space-y-2">
                  {lessons.filter((lesson) => lesson.teacherReflection).length > 0 ? (
                    lessons
                      .filter((lesson) => lesson.teacherReflection)
                      .map((lesson) => (
                        <div key={lesson.id} className="rounded-xl border border-border/70 p-3">
                          <p className="text-[13px] font-medium">{lesson.title}</p>
                          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                            {lesson.teacherReflection}
                          </p>
                        </div>
                      ))
                  ) : (
                    <EmptyHint text="Reflections will appear here once lessons are taught or annotated." />
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </Card>

      <SectionCommentsPanel
        unit={unit}
        activeSection={activeSection}
        sectionLabel={activeSectionLabel}
      />
    </div>
  );
}

function getSectionDescription(section: DetailSection) {
  switch (section) {
    case "inquiry":
      return "Capture the inquiry framing, learning focus, and action plan that define this unit.";
    case "content_sequence":
      return "Review lessons, linked assessments, and how the unit is sequenced across teaching slots.";
    case "evidence":
      return "Track the standards, evidence signals, and student performance indicators tied to this unit.";
    case "reflection":
      return "Keep collaborative planning notes, prompts, and reflections in one shared place.";
    default:
      return "";
  }
}

function sentenceCase(value: string) {
  return value.replace(/_/g, " ");
}

function SectionTitle({ title }: { title: string }) {
  return <p className="text-[14px] font-semibold">{title}</p>;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-[18px] font-semibold">{value}</p>
    </div>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-[18px] font-semibold">{value}</p>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-[13px] text-muted-foreground">{text}</p>;
}

function QuestionList({
  label,
  questions,
}: {
  label: string;
  questions?: string[];
}) {
  if (!questions?.length) return null;
  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <ul className="mt-2 space-y-2">
        {questions.map((question) => (
          <li key={question} className="rounded-xl border border-border/70 bg-muted/10 p-3 text-[13px]">
            {question}
          </li>
        ))}
      </ul>
    </div>
  );
}
