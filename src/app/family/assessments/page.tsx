"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { getFamilyDemoNowMs } from "@/lib/family-demo";
import {
  getEffectiveParentStudentId,
  getFamilyAssessmentEntries,
  getParentChildren,
  getParentProfile,
} from "@/lib/family-selectors";
import { getGradeCellDisplay } from "@/lib/grade-helpers";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { FamilyRequiresChild } from "@/components/family/family-requires-child";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CalendarClock, ClipboardCheck } from "lucide-react";

const VALID_TABS = new Set(["upcoming", "past", "results"]);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FamilyAssessmentsPage() {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const loading = useMockLoading([parentId]);
  const demoNowMs = getFamilyDemoNowMs();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.has(initialTab) ? initialTab : "upcoming"
  );
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <>
        <PageHeader title="Assessments" description="What is coming up, what has been completed, and what has been released" />
        <CardGridSkeleton count={6} />
      </>
    );
  }

  if (!parentId) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Not signed in"
        description="Choose a family persona from the entry page to explore family-facing assessment views."
      />
    );
  }

  const parent = getParentProfile(state, parentId);
  const children = getParentChildren(state, parentId);
  const childId = getEffectiveParentStudentId(state, parentId);

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No linked children yet"
        description="Assessments will appear here once the school links your account to a child."
      />
    );
  }

  if (!childId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessments" description="Choose one child to review upcoming work and released results." />
        <FamilyRequiresChild
          title="Choose one child for assessment detail"
          description="Upcoming work, past submissions, and released results stay scoped to one child at a time."
        />
      </div>
    );
  }

  const child = children.find((entry) => entry.id === childId);
  const entries = getFamilyAssessmentEntries(state, parentId, childId).filter((entry) => {
    if (classFilter !== "all" && entry.assessment.classId !== classFilter) return false;
    if (statusFilter !== "all" && entry.submissionStatus !== statusFilter) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    return entry.assessment.title.toLowerCase().includes(query) || entry.className.toLowerCase().includes(query);
  });

  const upcoming = entries.filter(
    (entry) =>
      new Date(entry.assessment.dueDate).getTime() >= demoNowMs ||
      entry.submissionStatus === "due" ||
      entry.submissionStatus === "overdue"
  );
  const past = entries.filter((entry) => new Date(entry.assessment.dueDate).getTime() < demoNowMs);
  const results = entries.filter((entry) => entry.grade);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description={`Family-facing deadlines, submission status, and released results for ${child?.firstName}.`}
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{child?.gradeLevel}</Badge>
          <Badge variant="secondary">{child?.classIds.length} enrolled classes</Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active deadlines" value={upcoming.filter((entry) => entry.submissionStatus !== "submitted_on_time").length} icon={CalendarClock} />
        <StatCard label="Overdue or late" value={entries.filter((entry) => entry.submissionStatus === "overdue" || entry.submissionStatus === "submitted_late").length} icon={ClipboardCheck} />
        <StatCard label="Released results" value={results.length} icon={BookOpen} />
      </div>

      <FilterBar
        filters={[
          {
            key: "class",
            label: "Class",
            options: [
              { value: "all", label: "All classes" },
              ...state.classes
                .filter((entry) => child?.classIds.includes(entry.id))
                .map((entry) => ({ value: entry.id, label: entry.subject })),
            ],
            value: classFilter,
            onChange: setClassFilter,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All statuses" },
              { value: "due", label: "Due" },
              { value: "overdue", label: "Overdue" },
              { value: "submitted_on_time", label: "Submitted" },
              { value: "submitted_late", label: "Submitted late" },
              { value: "excused", label: "Excused" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        onSearch={setSearch}
        searchPlaceholder="Search assessments..."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming / active</TabsTrigger>
          <TabsTrigger value="past">Past / completed</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <AssessmentGrid entries={upcoming} showResult={false} />
        </TabsContent>

        <TabsContent value="past">
          <AssessmentGrid entries={past} showResult={false} />
        </TabsContent>

        <TabsContent value="results">
          <AssessmentGrid entries={results} showResult />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssessmentGrid({
  entries,
  showResult,
}: {
  entries: ReturnType<typeof getFamilyAssessmentEntries>;
  showResult: boolean;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title={showResult ? "No released results yet" : "Nothing to show here yet"}
        description={
          showResult
            ? "Released results will appear once teachers share them with families."
            : "Try adjusting your filters or check back after the next class update."
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {entries.map((entry) => (
        <Link
          key={`${entry.studentId}_${entry.assessment.id}`}
          href={`/family/assessments/${entry.assessment.id}?child=${entry.studentId}`}
          className="block"
        >
          <Card className="gap-0 p-5 transition-colors hover:bg-muted/40">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-medium">{entry.assessment.title}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {entry.className} · Due {formatDate(entry.assessment.dueDate)}
                </p>
              </div>
              <StatusBadge status={entry.submissionStatus} showIcon={false} className="text-[10px]" />
            </div>

            {entry.unit && (
              <div className="mt-3">
                <Badge variant="secondary" className="text-[10px]">
                  Unit: {entry.unit.title}
                </Badge>
              </div>
            )}

            {showResult && entry.grade ? (
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[26px] font-semibold text-[#c24e3f]">
                    {getGradeCellDisplay(entry.grade, entry.assessment)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Released {formatDate(entry.grade.releasedAt ?? entry.assessment.dueDate)}
                  </p>
                </div>
                <StatusBadge status="released" showIcon={false} />
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground">
                <span>
                  {entry.submission
                    ? `Submitted ${formatDate(entry.submission.submittedAt ?? entry.assessment.dueDate)}`
                    : "No submission recorded yet"}
                </span>
                {entry.grade && <StatusBadge status="released" showIcon={false} className="text-[10px]" />}
              </div>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
