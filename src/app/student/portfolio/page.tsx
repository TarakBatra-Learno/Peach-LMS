"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { getStudentArtifacts, getStudentClasses, getGoalsForSource } from "@/lib/student-selectors";
import { AddToGoalDialog } from "@/components/student/add-to-goal-dialog";
import {
  FolderOpen,
  Plus,
  AlertCircle,
  Image,
  Video,
  FileText,
  Music,
  Link2,
  Filter,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import type { PortfolioArtifact } from "@/types/portfolio";
import { PortfolioCreateDrawer } from "@/components/student/portfolio-create-drawer";

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

  const [createOpen, setCreateOpen] = useState(false);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [addToGoalArtifactId, setAddToGoalArtifactId] = useState<string | null>(null);

  const enrolledClasses = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );

  const allArtifacts = useMemo(
    () => (studentId ? getStudentArtifacts(state, studentId) : []),
    [state, studentId]
  );

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
          <option value="revision_requested">Revision requested</option>
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

            return (
              <Card key={artifact.id} className="p-4 gap-0">
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

                {goals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {goals.map((goal) =>
                      goal ? (
                        <Badge key={goal.id} variant="secondary" className="text-[10px]">
                          {goal.code || goal.title}
                        </Badge>
                      ) : null
                    )}
                  </div>
                )}

                {artifact.familyShareStatus === "shared" && (
                  <Badge className="mt-2 bg-[#dbeafe] text-[#2563eb] border-transparent text-[10px]">
                    Shared with family
                  </Badge>
                )}

                {/* Goal linkage */}
                <div className="flex items-center gap-2 mt-2">
                  {(() => {
                    const linkedGoals = getGoalsForSource(state, "portfolio_artifact", artifact.id);
                    return linkedGoals.length > 0 ? (
                      <Badge variant="secondary" className="text-[10px]">
                        <Target className="h-3 w-3 mr-0.5" />
                        {linkedGoals.length} goal{linkedGoals.length !== 1 ? "s" : ""}
                      </Badge>
                    ) : null;
                  })()}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-6 px-2"
                    onClick={(e) => {
                      e.preventDefault();
                      setAddToGoalArtifactId(artifact.id);
                    }}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Add to goal
                  </Button>
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
