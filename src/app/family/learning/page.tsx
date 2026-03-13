"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import {
  getEffectiveParentStudentId,
  getFamilyAssessmentEntries,
  getFamilyAttendanceEntries,
  getFamilyTimelineEntries,
  getFamilyVisibleArtifacts,
  getFamilyVisibleClassroomUpdates,
  getFamilyVisibleUnits,
  getParentChildren,
  getParentProfile,
} from "@/lib/family-selectors";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { FamilyRequiresChild } from "@/components/family/family-requires-child";
import { TranslatedCopy } from "@/components/family/translated-copy";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, CalendarDays, BookOpen, Route, Clock, Sparkles, ArrowUpRight } from "lucide-react";

type LearningTab = "portfolio" | "updates" | "units" | "timeline";

const VALID_TABS = new Set(["portfolio", "updates", "units", "timeline"]);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function truncateSubmission(content: string) {
  if (content.length <= 180) return content;
  return `${content.slice(0, 180).trimEnd()}...`;
}

const TIMELINE_LABELS = {
  portfolio: "Portfolio",
  update: "Classroom update",
  result: "Released result",
  report: "Report",
  attendance: "Attendance",
  deadline: "Deadline",
} as const;

export default function FamilyLearningPage() {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const setParentActiveStudent = useStore((store) => store.setParentActiveStudent);
  const loading = useMockLoading([parentId]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [timelineView, setTimelineView] = useState<"timeline" | "grouped">("timeline");
  const parent = parentId ? getParentProfile(state, parentId) : undefined;
  const children = parentId ? getParentChildren(state, parentId) : [];
  const activeParentStudentId = state.ui.parentActiveStudentId;
  const requestedTab = searchParams.get("tab");
  const activeTab = requestedTab && VALID_TABS.has(requestedTab) ? (requestedTab as LearningTab) : "portfolio";
  const artifactId = searchParams.get("artifact");
  const updateId = searchParams.get("update");
  const unitId = searchParams.get("unit");
  const timelineEntryId = searchParams.get("entry");
  const queryChildId = searchParams.get("child");
  const queryChildIsValid = Boolean(queryChildId && children.some((entry) => entry.id === queryChildId));
  const fallbackChildId = parentId ? getEffectiveParentStudentId(state, parentId) : null;
  const childId =
    queryChildIsValid && queryChildId
      ? queryChildId
      : fallbackChildId;

  useEffect(() => {
    if (queryChildId && queryChildIsValid && activeParentStudentId !== queryChildId) {
      setParentActiveStudent(queryChildId);
    }
  }, [activeParentStudentId, queryChildId, queryChildIsValid, setParentActiveStudent]);

  if (loading) {
    return (
      <>
        <PageHeader title="Learning" description="Portfolio evidence, classroom updates, units, and the learning journey" />
        <CardGridSkeleton count={6} />
      </>
    );
  }

  if (!parentId) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Not signed in"
        description="Choose a family persona from the entry page to view family learning updates."
      />
    );
  }

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No linked children yet"
        description="Learning updates will appear here once your account is linked to a child."
      />
    );
  }

  if (!childId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Learning" description="Choose one child to review family-safe learning detail." />
        <FamilyRequiresChild
          title="Choose one child for learning detail"
          description="Portfolio evidence, units, and the learning journey stay focused on one child at a time so the context stays clear."
        />
      </div>
    );
  }

  const child = children.find((entry) => entry.id === childId);
  const classOptions = [
    { value: "all", label: "All classes" },
    ...state.classes
      .filter((entry) => child?.classIds.includes(entry.id))
      .map((entry) => ({ value: entry.id, label: entry.subject })),
  ];

  const allVisibleArtifacts = getFamilyVisibleArtifacts(state, parentId, childId);
  const allVisibleUpdates = getFamilyVisibleClassroomUpdates(state, parentId, childId);
  const allVisibleUnits = getFamilyVisibleUnits(state, parentId, childId);
  const assessmentEntries = getFamilyAssessmentEntries(state, parentId, childId);
  const attendanceEntries = getFamilyAttendanceEntries(state, parentId, childId);
  const allTimeline = getFamilyTimelineEntries(state, parentId, childId);

  const buildLearningHref = ({
    tab,
    nextChildId,
    nextArtifactId,
    nextUpdateId,
    nextUnitId,
    nextTimelineEntryId,
  }: {
    tab: LearningTab;
    nextChildId?: string | null;
    nextArtifactId?: string | null;
    nextUpdateId?: string | null;
    nextUnitId?: string | null;
    nextTimelineEntryId?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    const resolvedChildId = nextChildId ?? childId;
    if (resolvedChildId) {
      params.set("child", resolvedChildId);
    } else {
      params.delete("child");
    }
    params.delete("artifact");
    params.delete("update");
    params.delete("unit");
    params.delete("entry");
    if (nextArtifactId) params.set("artifact", nextArtifactId);
    if (nextUpdateId) params.set("update", nextUpdateId);
    if (nextUnitId) params.set("unit", nextUnitId);
    if (nextTimelineEntryId) params.set("entry", nextTimelineEntryId);
    return `${pathname}?${params.toString()}`;
  };

  const navigateLearning = (destination: Parameters<typeof buildLearningHref>[0]) => {
    router.replace(buildLearningHref(destination), { scroll: false });
  };

  const artifacts = allVisibleArtifacts.filter((artifact) => {
    if (classFilter !== "all" && artifact.classId !== classFilter) return false;
    if (typeFilter !== "all" && artifact.mediaType !== typeFilter) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    return artifact.title.toLowerCase().includes(query) || artifact.description.toLowerCase().includes(query);
  });

  const updates = allVisibleUpdates.filter((update) => {
    if (classFilter !== "all" && update.classId !== classFilter) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    return update.title.toLowerCase().includes(query) || update.body.toLowerCase().includes(query);
  });

  const units = allVisibleUnits.filter((unit) => {
    if (classFilter !== "all" && unit.classId !== classFilter) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    return unit.title.toLowerCase().includes(query) || (unit.summary ?? "").toLowerCase().includes(query);
  });

  const timeline = allTimeline.filter((entry) => {
    if (classFilter !== "all" && entry.classId !== classFilter) return false;
    if (typeFilter !== "all" && entry.type !== typeFilter) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    return entry.title.toLowerCase().includes(query) || entry.summary.toLowerCase().includes(query);
  });

  const selectedArtifact = allVisibleArtifacts.find((entry) => entry.id === artifactId) ?? null;
  const selectedUpdate = allVisibleUpdates.find((entry) => entry.id === updateId) ?? null;
  const selectedUnit = allVisibleUnits.find((entry) => entry.id === unitId) ?? null;
  const selectedTimelineEntry = allTimeline.find((entry) => entry.id === timelineEntryId) ?? null;
  const timelineAssessmentEntry =
    selectedTimelineEntry && (selectedTimelineEntry.type === "result" || selectedTimelineEntry.type === "deadline")
      ? assessmentEntries.find((entry) => entry.assessment.id === selectedTimelineEntry.sourceId) ?? null
      : null;
  const timelineReport =
    selectedTimelineEntry?.type === "report"
      ? state.reports.find((entry) => entry.id === selectedTimelineEntry.sourceId && entry.studentId === childId) ?? null
      : null;
  const timelineAttendanceEntry =
    selectedTimelineEntry?.type === "attendance"
      ? attendanceEntries.find((entry) => entry.id === selectedTimelineEntry.sourceId) ?? null
      : null;
  const selectedArtifactGoals = selectedArtifact
    ? selectedArtifact.learningGoalIds
      .map((goalId) => state.learningGoals.find((entry) => entry.id === goalId))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];
  const linkedArtifactSubmission =
    selectedArtifact?.sourceType === "submission" && selectedArtifact.sourceId
      ? state.submissions.find((entry) => entry.id === selectedArtifact.sourceId && entry.studentId === childId) ?? null
      : null;
  const linkedArtifactAssessment =
    linkedArtifactSubmission
      ? assessmentEntries.find((entry) => entry.assessment.id === linkedArtifactSubmission.assessmentId) ?? null
      : assessmentEntries.find((entry) => entry.assessment.classId === selectedArtifact?.classId && entry.submissionStatus !== "excused") ?? null;
  const artifactUnitContext =
    linkedArtifactAssessment?.unit ?? allVisibleUnits.find((entry) => entry.classId === selectedArtifact?.classId) ?? null;
  const relatedArtifactAssessments = selectedArtifact
    ? assessmentEntries
      .filter((entry) => entry.assessment.classId === selectedArtifact.classId && (entry.submission || entry.grade))
      .slice(0, linkedArtifactAssessment ? 2 : 3)
    : [];

  const openTimelineEntry = (entry: (typeof timeline)[number]) => {
    if (entry.type === "portfolio" && entry.sourceId) {
      navigateLearning({ tab: "portfolio", nextArtifactId: entry.sourceId });
      return;
    }
    if (entry.type === "update" && entry.sourceId) {
      navigateLearning({ tab: "updates", nextUpdateId: entry.sourceId });
      return;
    }
    navigateLearning({ tab: "timeline", nextTimelineEntryId: entry.id });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning"
        description={`A family-facing view of ${child?.firstName}'s learning story across classes, units, evidence, and milestones.`}
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{child?.gradeLevel}</Badge>
          <Badge variant="secondary">{child?.classIds.length} classes</Badge>
        </div>
      </PageHeader>

      <FilterBar
        filters={[
          {
            key: "class",
            label: "Class",
            options: classOptions,
            value: classFilter,
            onChange: setClassFilter,
          },
          {
            key: "type",
            label: "Type",
            options: [
              { value: "all", label: "All types" },
              { value: "image", label: "Images" },
              { value: "document", label: "Documents" },
              { value: "video", label: "Videos" },
              { value: "portfolio", label: "Portfolio" },
              { value: "update", label: "Updates" },
              { value: "result", label: "Results" },
              { value: "report", label: "Reports" },
              { value: "attendance", label: "Attendance" },
              { value: "deadline", label: "Deadlines" },
            ],
            value: typeFilter,
            onChange: setTypeFilter,
          },
        ]}
        onSearch={setSearch}
        searchPlaceholder="Search learning..."
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => navigateLearning({ tab: value as LearningTab })}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="portfolio">Portfolio feed</TabsTrigger>
          <TabsTrigger value="updates">Classroom updates</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="timeline">Learning journey</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          {artifacts.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No portfolio updates yet"
              description="Shared evidence will appear here once teachers or students publish it for family view."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  className="rounded-[18px] border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                  onClick={() => navigateLearning({ tab: "portfolio", nextArtifactId: artifact.id })}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">{artifact.title}</p>
                      <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                        {artifact.description || "Learning evidence shared with your family."}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {artifact.mediaType}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {state.classes.find((entry) => entry.id === artifact.classId)?.subject}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{formatDate(artifact.updatedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="updates">
          {updates.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No classroom updates yet"
              description="Family-visible classroom updates will appear here once teachers share them."
            />
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <button
                  key={update.id}
                  className="w-full rounded-[18px] border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40"
                  onClick={() => navigateLearning({ tab: "updates", nextUpdateId: update.id })}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">{update.title}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {state.classes.find((entry) => entry.id === update.classId)?.name} · {formatDate(update.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {update.teacherName}
                    </Badge>
                  </div>
                  <p className="mt-3 line-clamp-3 text-[13px] text-muted-foreground">
                    {update.body}
                  </p>
                  {update.tags && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {update.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="units">
          {units.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No current unit information"
              description="Family-facing unit summaries will appear here when teachers share them."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {units.map((unit) => {
                const linkedAssessments = assessmentEntries.filter(
                  (entry) => entry.assessment.unitId === unit.id
                );
                const relatedArtifacts = allVisibleArtifacts.filter((artifact) => artifact.classId === unit.classId);
                const framing = unit.conceptualFraming;
                const submittedCount = linkedAssessments.filter((entry) => entry.submission).length;

                return (
                  <button
                    key={unit.id}
                    className="rounded-[18px] border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40"
                    onClick={() => navigateLearning({ tab: "units", nextUnitId: unit.id })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium">{unit.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {state.classes.find((entry) => entry.id === unit.classId)?.name}
                        </p>
                      </div>
                      <StatusBadge status={unit.status} showIcon={false} className="text-[10px]" />
                    </div>
                    <p className="mt-3 line-clamp-3 text-[13px] text-muted-foreground">
                      {unit.summary || "A family-facing summary for this unit has not been added yet."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {formatDate(unit.startDate)} - {formatDate(unit.endDate)}
                      </Badge>
                      {framing?.statementOfInquiry && (
                        <Badge variant="secondary" className="text-[10px]">
                          Statement of inquiry
                        </Badge>
                      )}
                      {framing?.tokConnection && (
                        <Badge variant="secondary" className="text-[10px]">
                          Course connection
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-muted-foreground">
                      <div className="rounded-[14px] bg-muted/50 p-3">
                        <p className="font-medium text-foreground">{linkedAssessments.length}</p>
                        <p>Linked assessments</p>
                      </div>
                      <div className="rounded-[14px] bg-muted/50 p-3">
                        <p className="font-medium text-foreground">{submittedCount}</p>
                        <p>Submitted work</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] text-muted-foreground">
                      <div className="rounded-[14px] bg-muted/50 p-3">
                        <p className="font-medium text-foreground">
                          {linkedAssessments.filter((entry) => entry.grade).length}
                        </p>
                        <p>Released results</p>
                      </div>
                      <div className="rounded-[14px] bg-muted/50 p-3">
                        <p className="font-medium text-foreground">{relatedArtifacts.length}</p>
                        <p>Shared evidence</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <div className="mb-4 flex gap-2">
            <Button
              variant={timelineView === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimelineView("timeline")}
            >
              Timeline
            </Button>
            <Button
              variant={timelineView === "grouped" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimelineView("grouped")}
            >
              Grouped
            </Button>
          </div>
          {timeline.length === 0 ? (
            <EmptyState
              icon={Route}
              title="No learning milestones yet"
              description="As classroom updates, shared evidence, reports, and released results appear, this journey view will fill in."
            />
          ) : timelineView === "timeline" ? (
            <div className="space-y-4">
              {timeline.map((entry) => (
                <button
                  key={entry.id}
                  className="w-full text-left"
                  onClick={() => openTimelineEntry(entry)}
                >
                  <Card className="gap-0 p-4 transition-colors hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium">{entry.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">{entry.summary}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {TIMELINE_LABELS[entry.type]}
                        </Badge>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(entry.date)}</span>
                      {entry.className && <span>{entry.className}</span>}
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(new Set(timeline.map((entry) => monthLabel(entry.date)))).map((label) => (
                <div key={label}>
                  <p className="mb-3 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <div className="space-y-3">
                    {timeline
                      .filter((entry) => monthLabel(entry.date) === label)
                      .map((entry) => (
                        <button
                          key={entry.id}
                          className="w-full text-left"
                          onClick={() => openTimelineEntry(entry)}
                        >
                          <Card className="gap-0 p-4 transition-colors hover:bg-muted/40">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[14px] font-medium">{entry.title}</p>
                                <p className="mt-1 text-[12px] text-muted-foreground">{entry.summary}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {TIMELINE_LABELS[entry.type]}
                                </Badge>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </Card>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet
        open={Boolean(selectedArtifact)}
        onOpenChange={(open) => {
          if (!open) navigateLearning({ tab: "portfolio" });
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          {selectedArtifact ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedArtifact.title}</SheetTitle>
                <SheetDescription>
                  {state.classes.find((entry) => entry.id === selectedArtifact.classId)?.name} · {formatDate(selectedArtifact.updatedAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {selectedArtifact.mediaType}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    Shared by {selectedArtifact.createdBy}
                  </Badge>
                  {selectedArtifact.reflection?.text && (
                    <Badge variant="secondary" className="text-[10px]">
                      Student reflection included
                    </Badge>
                  )}
                </div>
                <Card className="gap-0 border-border/60 bg-muted/30 p-4">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                    Artifact summary
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">Class</p>
                      <p className="mt-1">{state.classes.find((entry) => entry.id === selectedArtifact.classId)?.name}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Shared on</p>
                      <p className="mt-1">{formatDate(selectedArtifact.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Captured by</p>
                      <p className="mt-1 capitalize">{selectedArtifact.createdBy}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Format</p>
                      <p className="mt-1 capitalize">{selectedArtifact.mediaType}</p>
                    </div>
                  </div>
                  {selectedArtifact.description && (
                    <p className="mt-4 text-[13px] leading-6 text-muted-foreground">
                      {selectedArtifact.description}
                    </p>
                  )}
                </Card>
                {selectedArtifactGoals.length > 0 && (
                  <Card className="gap-0 p-4">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                      Learning goals
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedArtifactGoals.map((goal) => (
                        <Badge key={goal.id} variant="secondary" className="text-[10px]">
                          {goal.code}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
                {selectedArtifact.reflection?.text && (
                  <Card className="gap-0 p-4">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                      Student reflection
                    </p>
                    {selectedArtifact.reflection.submittedAt && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Shared {formatDate(selectedArtifact.reflection.submittedAt)}
                      </p>
                    )}
                    <p className="mt-2 text-[13px]">{selectedArtifact.reflection.text}</p>
                  </Card>
                )}
                {(linkedArtifactAssessment || relatedArtifactAssessments.length > 0) && (
                  <Card className="gap-0 p-4">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                      Connected class work
                    </p>
                    <div className="mt-3 space-y-3">
                      {(linkedArtifactAssessment ? [linkedArtifactAssessment] : relatedArtifactAssessments).map((entry) => (
                        <Link
                          key={`artifact_assessment_${entry.assessment.id}`}
                          href={`/family/assessments/${entry.assessment.id}?child=${entry.studentId}`}
                          className="block rounded-[14px] border border-border p-3 transition-colors hover:bg-muted/40"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium">{entry.assessment.title}</p>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Due {formatDate(entry.assessment.dueDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={entry.submissionStatus} showIcon={false} className="text-[10px]" />
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          {entry.submission?.content && (
                            <p className="mt-3 line-clamp-3 text-[12px] leading-5 text-muted-foreground">
                              {truncateSubmission(entry.submission.content)}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}
                {selectedArtifact.reflection?.teacherComment && (
                  <Card className="gap-0 p-4">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                      Teacher comment
                    </p>
                    <p className="mt-2 text-[13px]">{selectedArtifact.reflection.teacherComment}</p>
                  </Card>
                )}
                <div className="flex flex-wrap gap-2">
                  {linkedArtifactAssessment && (
                    <Link href={`/family/assessments/${linkedArtifactAssessment.assessment.id}?child=${linkedArtifactAssessment.studentId}`}>
                      <Button variant="outline">
                        Open linked assessment
                      </Button>
                    </Link>
                  )}
                  {artifactUnitContext && (
                    <Link href={buildLearningHref({ tab: "units", nextUnitId: artifactUnitContext.id })}>
                      <Button variant="ghost">
                        Open unit context
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(selectedUpdate)}
        onOpenChange={(open) => {
          if (!open) navigateLearning({ tab: "updates" });
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          {selectedUpdate ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedUpdate.title}</SheetTitle>
                <SheetDescription>
                  {selectedUpdate.teacherName} · {formatDate(selectedUpdate.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <TranslatedCopy
                  body={selectedUpdate.body}
                  translatedBody={selectedUpdate.translatedBody}
                  translatedLanguage={selectedUpdate.translatedLanguage}
                  autoTranslate={parent.autoTranslateCommunications}
                />
                {selectedUpdate.tags && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUpdate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {selectedUpdate.unitId && (
                  <div className="flex flex-wrap gap-2">
                    <Link href={buildLearningHref({ tab: "units", nextUnitId: selectedUpdate.unitId })}>
                      <Button variant="outline">
                        View unit context
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : null}
      </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(selectedUnit)}
        onOpenChange={(open) => {
          if (!open) navigateLearning({ tab: "units" });
        }}
      >
        <SheetContent className="w-full sm:max-w-xl">
          {selectedUnit ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedUnit.title}</SheetTitle>
                <SheetDescription>
                  {state.classes.find((entry) => entry.id === selectedUnit.classId)?.name} · {formatDate(selectedUnit.startDate)} - {formatDate(selectedUnit.endDate)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <p className="text-[13px] text-muted-foreground">
                  {selectedUnit.summary || "A family-facing summary is not available yet."}
                </p>
                {selectedUnit.conceptualFraming?.statementOfInquiry && (
                  <Card className="gap-0 p-4">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                      Statement of inquiry
                    </p>
                    <p className="mt-2 text-[13px]">
                      {selectedUnit.conceptualFraming.statementOfInquiry}
                    </p>
                  </Card>
                )}
                {selectedUnit.conceptualFraming?.atlFocus?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedUnit.conceptualFraming.atlFocus.map((focus) => (
                      <Badge key={focus} variant="secondary" className="text-[10px]">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {(() => {
                  const linkedAssessments = assessmentEntries.filter(
                    (entry) => entry.assessment.unitId === selectedUnit.id
                  );
                  const relatedArtifacts = allVisibleArtifacts.filter(
                    (artifact) => artifact.classId === selectedUnit.classId
                  );

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Card className="gap-0 p-4">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Linked assessments</p>
                          <p className="mt-1 text-[24px] font-semibold">{linkedAssessments.length}</p>
                        </Card>
                        <Card className="gap-0 p-4">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Shared evidence</p>
                          <p className="mt-1 text-[24px] font-semibold">{relatedArtifacts.length}</p>
                        </Card>
                      </div>

                      <Card className="gap-0 p-4">
                        <h3 className="text-[13px] font-medium">Student work in this unit</h3>
                        {linkedAssessments.length === 0 ? (
                          <p className="mt-3 text-[12px] text-muted-foreground">
                            No family-visible assessments are linked to this unit yet.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {linkedAssessments.map((entry) => (
                              <Link
                                key={`unit_assessment_${entry.assessment.id}`}
                                href={`/family/assessments/${entry.assessment.id}?child=${entry.studentId}`}
                                className="block rounded-[14px] border border-border p-3 transition-colors hover:bg-muted/40"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium">{entry.assessment.title}</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                      Due {formatDate(entry.assessment.dueDate)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <StatusBadge status={entry.submissionStatus} showIcon={false} className="text-[10px]" />
                                    {entry.grade && (
                                      <Badge variant="secondary" className="text-[10px]">
                                        {entry.grade ? "Result released" : ""}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {entry.submission?.content && (
                                  <p className="mt-3 line-clamp-3 text-[12px] leading-5 text-muted-foreground">
                                    {truncateSubmission(entry.submission.content)}
                                  </p>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </Card>

                      <Card className="gap-0 p-4">
                        <h3 className="text-[13px] font-medium">Shared evidence from this class</h3>
                        {relatedArtifacts.length === 0 ? (
                          <p className="mt-3 text-[12px] text-muted-foreground">
                            No portfolio evidence has been shared for this class yet.
                          </p>
                        ) : (
                          <div className="mt-4 grid grid-cols-1 gap-3">
                            {relatedArtifacts.slice(0, 3).map((artifact) => (
                              <button
                                key={`unit_artifact_${artifact.id}`}
                                className="rounded-[14px] border border-border p-3 text-left transition-colors hover:bg-muted/40"
                                onClick={() => navigateLearning({ tab: "portfolio", nextArtifactId: artifact.id })}
                              >
                                <p className="text-[13px] font-medium">{artifact.title}</p>
                                <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                                  {artifact.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </Card>
                    </>
                  );
                })()}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(selectedTimelineEntry)}
        onOpenChange={(open) => {
          if (!open) navigateLearning({ tab: "timeline" });
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          {selectedTimelineEntry ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTimelineEntry.title}</SheetTitle>
                <SheetDescription>
                  {TIMELINE_LABELS[selectedTimelineEntry.type]} · {formatDate(selectedTimelineEntry.date)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <Card className="gap-0 p-4">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                    Summary
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    {selectedTimelineEntry.summary}
                  </p>
                </Card>

                {(selectedTimelineEntry.type === "result" || selectedTimelineEntry.type === "deadline") && timelineAssessmentEntry && (
                  <Card className="gap-0 p-4">
                    <h3 className="text-[13px] font-medium">Assessment detail</h3>
                    <div className="mt-3 space-y-3 text-[12px] text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span>Due date</span>
                        <span>{formatDate(timelineAssessmentEntry.assessment.dueDate)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Submission status</span>
                        <StatusBadge status={timelineAssessmentEntry.submissionStatus} showIcon={false} className="text-[10px]" />
                      </div>
                      {timelineAssessmentEntry.grade && (
                        <div className="flex items-center justify-between gap-3">
                          <span>Released result</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {timelineAssessmentEntry.grade ? "Available" : "Not released"}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {timelineAssessmentEntry.submission?.content && (
                      <p className="mt-4 line-clamp-4 text-[12px] leading-5 text-muted-foreground">
                        {truncateSubmission(timelineAssessmentEntry.submission.content)}
                      </p>
                    )}
                  </Card>
                )}

                {selectedTimelineEntry.type === "report" && timelineReport && (
                  <Card className="gap-0 p-4">
                    <h3 className="text-[13px] font-medium">Report context</h3>
                    <p className="mt-3 text-[12px] text-muted-foreground">
                      Shared {formatDate(timelineReport.distributedAt ?? timelineReport.publishedAt ?? selectedTimelineEntry.date)}
                    </p>
                  </Card>
                )}

                {selectedTimelineEntry.type === "attendance" && timelineAttendanceEntry && (
                  <Card className="gap-0 p-4">
                    <h3 className="text-[13px] font-medium">Attendance detail</h3>
                    <div className="mt-3 flex items-center gap-2">
                      <StatusBadge status={timelineAttendanceEntry.record.status} showIcon={false} className="text-[10px]" />
                      <span className="text-[12px] text-muted-foreground">{timelineAttendanceEntry.className}</span>
                    </div>
                    {timelineAttendanceEntry.record.note && (
                      <p className="mt-3 text-[12px] text-muted-foreground">
                        {timelineAttendanceEntry.record.note}
                      </p>
                    )}
                  </Card>
                )}

                <div className="flex flex-wrap gap-2">
                  {selectedTimelineEntry.linkTo && (
                    <Link href={selectedTimelineEntry.linkTo}>
                      <Button variant="outline">
                        {selectedTimelineEntry.type === "attendance"
                          ? "Open attendance history"
                          : selectedTimelineEntry.type === "report"
                            ? "Open report"
                            : "Open assessment detail"}
                      </Button>
                    </Link>
                  )}
                  <Link href={buildLearningHref({ tab: "timeline" })}>
                    <Button variant="ghost">
                      Back to journey
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
