"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { getStudentArtifacts } from "@/lib/student-selectors";
import { FolderOpen, Image, FileText, Link as LinkIcon, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ClassPortfolioTabProps {
  classId: string;
  studentId: string;
}

const ARTIFACT_TYPE_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  image: Image,
  link: LinkIcon,
  video: FileText,
  audio: FileText,
};

export function ClassPortfolioTab({ classId, studentId }: ClassPortfolioTabProps) {
  const state = useStore((s) => s);

  const artifacts = useMemo(
    () => getStudentArtifacts(state, studentId, classId),
    [state, studentId, classId]
  );

  if (artifacts.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No portfolio artifacts yet"
        description="Portfolio artifacts for this class will appear here. Create artifacts to showcase your best work."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {artifacts.map((artifact) => {
          const Icon = ARTIFACT_TYPE_ICONS[artifact.mediaType] ?? FileText;
          return (
            <Card key={artifact.id} className="p-4 gap-0">
              <div className="flex items-start justify-between mb-2">
                <div className="rounded-lg bg-muted p-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <StatusBadge status={artifact.approvalStatus} />
              </div>
              <h4 className="text-[14px] font-medium mt-2 line-clamp-1">
                {artifact.title}
              </h4>
              {artifact.description && (
                <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">
                  {artifact.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(artifact.createdAt), "MMM d, yyyy")}
              </div>
              {artifact.learningGoalIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {artifact.learningGoalIds.length} goal{artifact.learningGoalIds.length !== 1 ? "s" : ""} linked
                  </Badge>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
