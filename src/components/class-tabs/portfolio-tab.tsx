"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { format, parseISO } from "date-fns";
import {
  FolderOpen,
  Image,
  Video,
  FileText,
  Music,
  Link as LinkIcon,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Student } from "@/types/student";
import type { LearningGoal } from "@/types/assessment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useArtifactActions } from "@/lib/hooks/use-artifact-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getAdminStudentWorkspaceHref } from "@/lib/admin-embed-routes";

interface PortfolioTabProps {
  classId: string;
  embedded?: boolean;
  artifacts: PortfolioArtifact[];
  students: Student[];
  learningGoals: LearningGoal[];
}

function getMediaIcon(type: string) {
  switch (type) {
    case "image": return Image;
    case "video": return Video;
    case "document": return FileText;
    case "audio": return Music;
    case "link": return LinkIcon;
    default: return FileText;
  }
}

export function PortfolioTab({
  classId,
  embedded = false,
  artifacts,
  students,
  learningGoals,
}: PortfolioTabProps) {
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Detail sheet
  const [detailArtifact, setDetailArtifact] = useState<PortfolioArtifact | null>(null);
  const [teacherComment, setTeacherComment] = useState("");

  // Confirmation dialog state
  const [revisionConfirm, setRevisionConfirm] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [resetConfirm, setResetConfirm] = useState<string | null>(null);

  // When opening detail sheet, prefill comment
  const openDetail = (artifact: PortfolioArtifact) => {
    setDetailArtifact(artifact);
    setTeacherComment(artifact.reflection?.teacherComment || "");
  };

  // Filtered artifacts
  const filtered = useMemo(() => {
    let result = artifacts;
    if (statusFilter !== "all") {
      result = result.filter((a) => a.approvalStatus === statusFilter);
    }
    if (studentFilter !== "all") {
      result = result.filter((a) => a.studentId === studentFilter);
    }
    if (mediaFilter !== "all") {
      result = result.filter((a) => a.mediaType === mediaFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [artifacts, statusFilter, studentFilter, mediaFilter, search]);

  // Filter config
  const filters = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "all", label: "All statuses" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "needs_revision", label: "Needs revision" },
      ],
    },
    {
      key: "student",
      label: "Student",
      value: studentFilter,
      onChange: setStudentFilter,
      options: [
        { value: "all", label: "All students" },
        ...students.map((s) => ({
          value: s.id,
          label: `${s.firstName} ${s.lastName}`,
        })),
      ],
    },
    {
      key: "media",
      label: "Media type",
      value: mediaFilter,
      onChange: setMediaFilter,
      options: [
        { value: "all", label: "All types" },
        { value: "image", label: "Image" },
        { value: "video", label: "Video" },
        { value: "document", label: "Document" },
        { value: "audio", label: "Audio" },
        { value: "link", label: "Link" },
      ],
    },
  ];

  // Artifact approval actions (shared hook — fixes: revision now revokes family share, family share now creates student record)
  const {
    handleApprove,
    handleRequestRevision,
    handleResetApproval: handleResetToPending,
    handleSaveTeacherComment: saveTeacherComment,
    handleToggleFamilyShare: toggleFamilyShare,
    handleToggleReportEligible: toggleReportEligible,
  } = useArtifactActions((id, updates) => {
    if (detailArtifact?.id === id) {
      setDetailArtifact({ ...detailArtifact, ...updates });
    }
  });

  const handleSaveTeacherComment = () => {
    if (!detailArtifact) return;
    saveTeacherComment(detailArtifact, teacherComment);
  };

  const handleToggleFamilyShare = (checked: boolean) => {
    if (!detailArtifact) return;
    toggleFamilyShare(detailArtifact, checked);
  };

  const handleToggleReportEligible = (checked: boolean) => {
    if (!detailArtifact) return;
    toggleReportEligible(detailArtifact.id, checked);
  };

  if (artifacts.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No portfolio artifacts"
        description="Portfolio items from this class will appear here."
      />
    );
  }

  return (
    <>
      <FilterBar
        filters={filters}
        onSearch={setSearch}
        searchPlaceholder="Search artifacts..."
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No matching artifacts"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((artifact) => {
            const student = students.find((s) => s.id === artifact.studentId);
            const MediaIcon = getMediaIcon(artifact.mediaType);
            return (
              <Card
                key={artifact.id}
                className="p-4 gap-0 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => openDetail(artifact)}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[14px] font-medium truncate flex-1">{artifact.title}</p>
                  <StatusBadge status={artifact.approvalStatus} />
                </div>
                <p className="text-[12px] text-muted-foreground mb-2">
                  <Link
                    href={
                      embedded
                        ? getAdminStudentWorkspaceHref(artifact.studentId, { classId })
                        : `/students/${artifact.studentId}?classId=${classId}`
                    }
                    target={embedded ? "_top" : undefined}
                    className="text-[#c24e3f] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {student?.firstName} {student?.lastName}
                  </Link>
                  {" "}·{" "}
                  <span className="inline-flex items-center gap-0.5">
                    <MediaIcon className="h-3 w-3" />
                    {artifact.mediaType}
                  </span>
                </p>
                <p className="text-[12px] text-muted-foreground truncate">{artifact.description}</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!detailArtifact} onOpenChange={(open) => { if (!open) setDetailArtifact(null); }}>
        <SheetContent className="w-full sm:max-w-[480px]">
          {detailArtifact && (() => {
            const artifactStudent = students.find((s) => s.id === detailArtifact.studentId);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-[16px]">{detailArtifact.title}</SheetTitle>
                  <SheetDescription className="text-[13px]">
                    <Link
                      href={
                        embedded
                          ? getAdminStudentWorkspaceHref(detailArtifact.studentId, { classId })
                          : `/students/${detailArtifact.studentId}?classId=${classId}`
                      }
                      target={embedded ? "_top" : undefined}
                      className="text-[#c24e3f] hover:underline"
                    >
                      {artifactStudent ? `${artifactStudent.firstName} ${artifactStudent.lastName}` : "Unknown"}
                    </Link>
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 mt-6">
                  {/* Status & meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={detailArtifact.approvalStatus} />
                    <Badge variant="outline" className="text-[11px]">{detailArtifact.mediaType}</Badge>
                    <StatusBadge status={detailArtifact.familyShareStatus} />
                  </div>

                  {/* Description */}
                  {detailArtifact.description && (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</h4>
                      <p className="text-[13px] text-foreground">{detailArtifact.description}</p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Created</h4>
                      <p className="text-[13px]">{format(parseISO(detailArtifact.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Created by</h4>
                      <p className="text-[13px] capitalize">{detailArtifact.createdBy}</p>
                    </div>
                  </div>

                  {/* Learning goals */}
                  {detailArtifact.learningGoalIds.length > 0 && (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Learning goals</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {detailArtifact.learningGoalIds.map((goalId) => {
                          const goal = learningGoals.find((g) => g.id === goalId);
                          return (
                            <Badge key={goalId} variant="outline" className="text-[11px]">
                              {goal?.title || goalId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Student reflection */}
                  {detailArtifact.reflection?.text && (
                    <div>
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Student reflection</h4>
                      {detailArtifact.reflection.submittedAt && (
                        <p className="text-[11px] text-muted-foreground mb-1.5">
                          Submitted {format(parseISO(detailArtifact.reflection.submittedAt), "MMM d, yyyy")}
                        </p>
                      )}
                      <p className="text-[13px] text-foreground bg-muted/50 rounded-lg p-3">
                        {detailArtifact.reflection.text}
                      </p>
                    </div>
                  )}

                  {/* Teacher comment */}
                  <div>
                    <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Teacher comment</h4>
                    <Textarea
                      value={teacherComment}
                      onChange={(e) => setTeacherComment(e.target.value)}
                      placeholder="Add your feedback for this artifact..."
                      className="text-[13px] min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-[12px]"
                      onClick={handleSaveTeacherComment}
                      disabled={!teacherComment.trim()}
                    >
                      Save comment
                    </Button>
                  </div>

                  <Separator />

                  {/* Toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium">Share with family</p>
                        <p className="text-[12px] text-muted-foreground">
                          {detailArtifact.approvalStatus === "approved"
                            ? "Make visible to parents"
                            : "Approve this artifact before sharing with family"}
                        </p>
                      </div>
                      <Switch
                        checked={detailArtifact.familyShareStatus !== "not_shared"}
                        onCheckedChange={handleToggleFamilyShare}
                        disabled={detailArtifact.approvalStatus !== "approved"}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium">Add to report</p>
                        <p className="text-[12px] text-muted-foreground">Include as evidence in student report</p>
                      </div>
                      <Switch
                        checked={detailArtifact.isReportEligible}
                        onCheckedChange={handleToggleReportEligible}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Approval actions */}
                  {detailArtifact.approvalStatus === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleApprove(detailArtifact.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRevisionConfirm(detailArtifact.id)}>
                        Request revision
                      </Button>
                    </div>
                  )}
                  {detailArtifact.approvalStatus !== "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setResetConfirm(detailArtifact.id)}
                      >
                        Reset to pending
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {!embedded ? (
                    <Link
                      href={`/portfolio?studentId=${detailArtifact.studentId}&artifactId=${detailArtifact.id}&classId=${classId}`}
                      className="flex items-center gap-2 text-[13px] font-medium text-[#c24e3f] hover:underline"
                    >
                      Open in Portfolio
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">
                      Portfolio detail stays in this drawer for admin because the full portfolio surface spans multiple classes.
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <Dialog open={!!revisionConfirm} onOpenChange={(open) => { if (!open) { setRevisionConfirm(null); setRevisionNote(""); } }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>
              {(() => {
                const revArtifact = revisionConfirm ? artifacts.find((a) => a.id === revisionConfirm) : null;
                const hasSharedFamily = revArtifact?.familyShareStatus === "shared";
                return (
                  <>
                    This will mark <span className="font-medium">{revArtifact?.title}</span> for revision and notify the student.
                    {hasSharedFamily && " Family sharing will also be revoked."}
                  </>
                );
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="revision-note" className="text-[13px]">
              What should the student improve? <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="revision-note"
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="e.g., Add more detail to your reflection, or choose a clearer image..."
              className="text-[13px] min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setRevisionConfirm(null); setRevisionNote(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (revisionConfirm) {
                  const revArtifact = artifacts.find((a) => a.id === revisionConfirm);
                  handleRequestRevision(
                    revisionConfirm,
                    revisionNote.trim() || undefined,
                    revArtifact?.studentId,
                    revArtifact?.title,
                    revArtifact?.familyShareStatus === "shared",
                  );
                }
                setRevisionConfirm(null);
                setRevisionNote("");
              }}
            >
              Request revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!resetConfirm}
        onOpenChange={(open) => !open && setResetConfirm(null)}
        title="Reset to pending"
        description={(() => {
          const resetArtifact = resetConfirm ? artifacts.find((a) => a.id === resetConfirm) : null;
          const isShared = resetArtifact?.familyShareStatus === "shared";
          return isShared
            ? "This will reset the artifact status to pending. Family sharing will also be revoked."
            : "This will reset the artifact status to pending.";
        })()}
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          if (resetConfirm) {
            const resetArtifact = artifacts.find((a) => a.id === resetConfirm);
            handleResetToPending(resetConfirm, resetArtifact?.familyShareStatus === "shared");
          }
          setResetConfirm(null);
        }}
      />
    </>
  );
}
