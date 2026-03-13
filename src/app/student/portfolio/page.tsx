"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { getStudentArtifacts, getStudentClasses, getGoalsForSource } from "@/lib/student-selectors";
import { AddToGoalDialog } from "@/components/student/add-to-goal-dialog";
import {
  FolderOpen,
  Plus,
  AlertCircle,
  AlertTriangle,
  Image,
  Video,
  FileText,
  Music,
  Link2,
  Filter,
  Target,
  Pencil,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Eye,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import type { PortfolioArtifact } from "@/types/portfolio";
import { PortfolioCreateDrawer } from "@/components/student/portfolio-create-drawer";
import { PortfolioEditDrawer } from "@/components/student/portfolio-edit-drawer";

function getMediaIcon(mediaType: PortfolioArtifact["mediaType"]) {
  switch (mediaType) {
    case "image": return Image;
    case "video": return Video;
    case "document": return FileText;
    case "audio": return Music;
    case "link": return Link2;
    default: return FileText;
  }
}

export default function StudentPortfolioPage() {
  const studentId = useStudentId();
  const loading = useMockLoading([studentId]);
  const state = useStore((s) => s);
  const learningGoals = useStore((s) => s.learningGoals);
  const searchParams = useSearchParams();
  const highlightArtifactId = searchParams.get("artifact");
  const highlightRef = useRef<HTMLDivElement>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [addToGoalArtifactId, setAddToGoalArtifactId] = useState<string | null>(null);
  const [editArtifactId, setEditArtifactId] = useState<string | null>(null);
  const [manualDetailArtifactId, setManualDetailArtifactId] = useState<string | null>(null);
  const [dismissedHighlightedArtifactId, setDismissedHighlightedArtifactId] = useState<string | null>(null);

  // Auto-scroll to highlighted artifact from deep-link
  useEffect(() => {
    if (highlightArtifactId && highlightRef.current && !loading) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightArtifactId, loading]);

  const enrolledClasses = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );

  const allArtifacts = useMemo(
    () => (studentId ? getStudentArtifacts(state, studentId) : []),
    [state, studentId]
  );

  const activeDetailArtifactId =
    manualDetailArtifactId ??
    (highlightArtifactId && dismissedHighlightedArtifactId !== highlightArtifactId
      ? highlightArtifactId
      : null);

  const detailArtifact = activeDetailArtifactId
    ? allArtifacts.find((artifact) => artifact.id === activeDetailArtifactId) ?? null
    : null;

  const pendingCount = allArtifacts.filter((artifact) => artifact.approvalStatus === "pending").length;
  const needsRevisionCount = allArtifacts.filter((artifact) => artifact.approvalStatus === "needs_revision").length;
  const sharedCount = allArtifacts.filter((artifact) => artifact.familyShareStatus === "shared" || artifact.familyShareStatus === "viewed").length;
  const goalLinkedCount = allArtifacts.filter(
    (artifact) => getGoalsForSource(state, "portfolio_artifact", artifact.id).length > 0
  ).length;

  const linkedReports = useMemo(() => {
    if (!detailArtifact) return [];

    return state.reports
      .filter(
        (report) =>
          report.studentId === detailArtifact.studentId &&
          report.classId === detailArtifact.classId &&
          report.sections.some((section) => {
            if (section.type !== "portfolio" && section.type !== "portfolio_evidence") {
              return false;
            }
            const artifactIds = (section.content?.artifactIds as string[] | undefined) || [];
            return artifactIds.includes(detailArtifact.id);
          })
      )
      .map((report) => ({
        report,
        cycle: state.reportCycles.find((cycle) => cycle.id === report.cycleId) ?? null,
      }))
      .sort((a, b) => {
        const aDate = a.cycle?.endDate ?? "";
        const bDate = b.cycle?.endDate ?? "";
        return bDate.localeCompare(aDate);
      });
  }, [detailArtifact, state.reportCycles, state.reports]);

  const linkedGoalsForDetail = useMemo(
    () =>
      detailArtifact
        ? getGoalsForSource(state, "portfolio_artifact", detailArtifact.id)
        : [],
    [detailArtifact, state]
  );

  const sourceSubmission = detailArtifact?.sourceType === "submission" && detailArtifact.sourceId
    ? state.submissions.find((submission) => submission.id === detailArtifact.sourceId) ?? null
    : null;

  const sourceAssessment = sourceSubmission
    ? state.assessments.find((assessment) => assessment.id === sourceSubmission.assessmentId) ?? null
    : null;

  const filteredArtifacts = useMemo(() => {
    let result = allArtifacts;
    if (filterClass) result = result.filter((a) => a.classId === filterClass);
    if (filterStatus) result = result.filter((a) => a.approvalStatus === filterStatus);
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allArtifacts, filterClass, filterStatus]);

  if (loading) return <DetailSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Not signed in"
        description="Please sign in as a student to view your portfolio."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="My Portfolio"
        description={`${allArtifacts.length} artifact${allArtifacts.length !== 1 ? "s" : ""} across all classes`}
        primaryAction={{
          label: "New artifact",
          icon: Plus,
          onClick: () => setCreateOpen(true),
        }}
      />

      <div className="grid gap-4 mb-6 md:grid-cols-4">
        <Card className="p-4 gap-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Awaiting review</p>
          <p className="mt-2 text-[24px] font-semibold">{pendingCount}</p>
          <p className="text-[12px] text-muted-foreground">Artifacts still with your teacher</p>
        </Card>
        <Card className="p-4 gap-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Needs revision</p>
          <p className="mt-2 text-[24px] font-semibold">{needsRevisionCount}</p>
          <p className="text-[12px] text-muted-foreground">Work that needs another pass</p>
        </Card>
        <Card className="p-4 gap-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Shared with family</p>
          <p className="mt-2 text-[24px] font-semibold">{sharedCount}</p>
          <p className="text-[12px] text-muted-foreground">Artifacts visible at home</p>
        </Card>
        <Card className="p-4 gap-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Linked to goals</p>
          <p className="mt-2 text-[24px] font-semibold">{goalLinkedCount}</p>
          <p className="text-[12px] text-muted-foreground">Evidence already tied to growth goals</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          className="text-[13px] border rounded-md px-2 py-1 bg-background"
          value={filterClass ?? ""}
          onChange={(e) => setFilterClass(e.target.value || null)}
        >
          <option value="">All classes</option>
          {enrolledClasses.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
        <select
          className="text-[13px] border rounded-md px-2 py-1 bg-background"
          value={filterStatus ?? ""}
          onChange={(e) => setFilterStatus(e.target.value || null)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="needs_revision">Needs revision</option>
        </select>
      </div>

      {filteredArtifacts.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No artifacts yet"
          description="Start building your portfolio by creating your first artifact."
        />
      ) : (
        <div className="space-y-4">
          {filteredArtifacts.map((artifact) => {
            const cls = enrolledClasses.find((c) => c.id === artifact.classId);
            const MediaIcon = getMediaIcon(artifact.mediaType);
            const goals = artifact.learningGoalIds
              .map((id) => learningGoals.find((g) => g.id === id))
              .filter(Boolean);

            const isHighlighted = artifact.id === highlightArtifactId;

            return (
              <Card
                key={artifact.id}
                ref={isHighlighted ? highlightRef : undefined}
                className={`p-4 gap-0 cursor-pointer transition-colors hover:bg-muted/20 ${isHighlighted ? "ring-2 ring-[#c24e3f] ring-offset-2" : ""}`}
                onClick={() => {
                  setManualDetailArtifactId(artifact.id);
                  setDismissedHighlightedArtifactId(null);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MediaIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium truncate">{artifact.title}</p>
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground mt-0.5">
                        {cls && <span>{cls.name}</span>}
                        <span>{format(new Date(artifact.createdAt), "MMM d, yyyy")}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {artifact.mediaType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={artifact.approvalStatus} />
                </div>

                {/* Revision note callout */}
                {artifact.approvalStatus === "needs_revision" && artifact.revisionNote && (
                  <div className="mt-3 p-3 rounded-lg bg-[#fee2e2]/50 border border-[#dc2626]/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#dc2626] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-medium text-[#dc2626] mb-0.5">Teacher feedback</p>
                        <p className="text-[13px] text-foreground">{artifact.revisionNote}</p>
                      </div>
                    </div>
                  </div>
                )}

                {artifact.description && (
                  <p className="text-[13px] text-muted-foreground mt-2 line-clamp-2">
                    {artifact.description}
                  </p>
                )}

                {artifact.reflection && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      My reflection
                    </p>
                    <p className="text-[13px] text-muted-foreground line-clamp-2">
                      {artifact.reflection.text}
                    </p>
                  </div>
                )}

                {/* Footer: tags left, action right */}
                <div className="flex items-center justify-between gap-3 mt-3">
                  <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                    {goals.map((goal) =>
                      goal ? (
                        <Badge key={goal.id} variant="secondary" className="text-[10px]">
                          {goal.code || goal.title}
                        </Badge>
                      ) : null
                    )}
                    {artifact.familyShareStatus === "shared" && (
                      <Badge className="bg-[#dbeafe] text-[#2563eb] border-transparent text-[10px]">
                        Shared with family
                      </Badge>
                    )}
                    {(() => {
                      const linkedGoals = getGoalsForSource(state, "portfolio_artifact", artifact.id);
                      return linkedGoals.length > 0 ? (
                        <Badge variant="secondary" className="text-[10px]">
                          <Target className="h-3 w-3 mr-0.5" />
                          {linkedGoals.length} goal{linkedGoals.length !== 1 ? "s" : ""}
                        </Badge>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(artifact.approvalStatus === "needs_revision" || artifact.approvalStatus === "pending") && (
                      <Button
                        variant={artifact.approvalStatus === "needs_revision" ? "default" : "outline"}
                        size="sm"
                        className="text-[11px] h-7 px-2.5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditArtifactId(artifact.id);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        {artifact.approvalStatus === "needs_revision" ? "Revise & Resubmit" : "Edit"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAddToGoalArtifactId(artifact.id);
                      }}
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Add to goal
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] h-7 px-2.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setManualDetailArtifactId(artifact.id);
                        setDismissedHighlightedArtifactId(null);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PortfolioCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        studentId={studentId}
        enrolledClasses={enrolledClasses}
      />

      <PortfolioEditDrawer
        open={!!editArtifactId}
        onClose={() => setEditArtifactId(null)}
        artifact={editArtifactId ? allArtifacts.find((a) => a.id === editArtifactId) ?? null : null}
      />

      <Sheet
        open={!!detailArtifact}
        onOpenChange={(open) => {
          if (!open) {
            if (highlightArtifactId && detailArtifact?.id === highlightArtifactId) {
              setDismissedHighlightedArtifactId(highlightArtifactId);
            }
            setManualDetailArtifactId(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto">
          {detailArtifact && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[16px]">{detailArtifact.title}</SheetTitle>
                <SheetDescription className="text-[13px]">
                  {enrolledClasses.find((entry) => entry.id === detailArtifact.classId)?.name ?? "Class"} · {format(new Date(detailArtifact.createdAt), "MMMM d, yyyy")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={detailArtifact.approvalStatus} />
                  <Badge variant="outline" className="capitalize">{detailArtifact.mediaType}</Badge>
                  {detailArtifact.familyShareStatus !== "not_shared" && (
                    <Badge className="bg-[#dbeafe] text-[#2563eb] border-transparent">
                      Shared with family
                    </Badge>
                  )}
                  {detailArtifact.isReportEligible && (
                    <Badge variant="secondary">Eligible for reports</Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <a
                    href={detailArtifact.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm">
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
                      Open artifact
                    </Button>
                  </a>
                  {(detailArtifact.approvalStatus === "needs_revision" || detailArtifact.approvalStatus === "pending") && (
                    <Button
                      size="sm"
                      variant={detailArtifact.approvalStatus === "needs_revision" ? "default" : "outline"}
                      onClick={() => setEditArtifactId(detailArtifact.id)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      {detailArtifact.approvalStatus === "needs_revision" ? "Revise & Resubmit" : "Edit artifact"}
                    </Button>
                  )}
                </div>

                {detailArtifact.description && (
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">About this work</p>
                    <p className="text-[13px] text-muted-foreground whitespace-pre-wrap">{detailArtifact.description}</p>
                  </div>
                )}

                {detailArtifact.approvalStatus === "needs_revision" && detailArtifact.revisionNote && (
                  <div className="rounded-xl border border-[#dc2626]/20 bg-[#fee2e2]/40 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#dc2626]" />
                      <div>
                        <p className="text-[12px] font-medium uppercase tracking-wide text-[#dc2626] mb-1">Teacher feedback</p>
                        <p className="text-[13px]">{detailArtifact.revisionNote}</p>
                      </div>
                    </div>
                  </div>
                )}

                {detailArtifact.reflection && (
                  <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground mb-1">My reflection</p>
                      <p className="text-[13px] whitespace-pre-wrap">{detailArtifact.reflection.text}</p>
                    </div>
                    {detailArtifact.reflection.teacherComment && (
                      <div>
                        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Teacher comment</p>
                        <p className="text-[13px] whitespace-pre-wrap">{detailArtifact.reflection.teacherComment}</p>
                      </div>
                    )}
                  </div>
                )}

                {sourceAssessment && (
                  <div className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Connected assessment</p>
                    </div>
                    <Link
                      href={`/student/classes/${sourceAssessment.classId}/assessments/${sourceAssessment.id}`}
                      className="text-[13px] font-medium text-[#c24e3f] hover:underline"
                    >
                      {sourceAssessment.title}
                    </Link>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      This artifact came from submitted classwork.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Linked goals</p>
                    </div>
                    {linkedGoalsForDetail.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground">Not linked to a personal goal yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedGoalsForDetail.map((goal) => (
                          <Link
                            key={goal.id}
                            href={`/student/goals/${goal.id}`}
                            className="block rounded-lg border border-border/50 px-3 py-2 hover:bg-muted/40"
                          >
                            <p className="text-[13px] font-medium">{goal.title}</p>
                            <p className="text-[12px] text-muted-foreground">Open goal details</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Family visibility</p>
                    </div>
                    <p className="text-[13px]">
                      {detailArtifact.familyShareStatus === "shared" || detailArtifact.familyShareStatus === "viewed"
                        ? "This artifact has been shared with your family."
                        : "This artifact has not been shared with your family yet."}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Teachers decide what is shared once the work is ready.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Used in reports</p>
                  </div>
                  {linkedReports.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground">
                      {detailArtifact.isReportEligible
                        ? "This artifact can be used in a report, but it is not linked yet."
                        : "This artifact is not currently included in any report."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {linkedReports.map(({ report, cycle }) => (
                        <Link
                          key={report.id}
                          href={`/student/progress/reports/${report.id}`}
                          className="block rounded-xl border border-border/60 p-4 hover:bg-muted/30"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[13px] font-medium">{cycle?.name || "Report"}</p>
                              <p className="text-[12px] text-muted-foreground">
                                {cycle?.term || "Report cycle"} · {report.viewedByStudentAt ? "Viewed" : "New"}
                              </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {addToGoalArtifactId && studentId && (
        <AddToGoalDialog
          open={!!addToGoalArtifactId}
          onClose={() => setAddToGoalArtifactId(null)}
          sourceType="portfolio_artifact"
          sourceId={addToGoalArtifactId}
          sourceTitle={allArtifacts.find((a) => a.id === addToGoalArtifactId)?.title ?? "Artifact"}
          studentId={studentId}
          surface="portfolio"
        />
      )}
    </div>
  );
}
