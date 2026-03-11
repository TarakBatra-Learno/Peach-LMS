"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Link2,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { PortfolioArtifact } from "@/types/portfolio";

interface PortfolioEditDrawerProps {
  open: boolean;
  onClose: () => void;
  artifact: PortfolioArtifact | null;
}

const MEDIA_TYPES: { value: PortfolioArtifact["mediaType"]; label: string; icon: typeof FileText }[] = [
  { value: "document", label: "Document", icon: FileText },
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "audio", label: "Audio", icon: Music },
  { value: "link", label: "Link", icon: Link2 },
];

export function PortfolioEditDrawer({
  open,
  onClose,
  artifact,
}: PortfolioEditDrawerProps) {
  const updateArtifact = useStore((s) => s.updateArtifact);
  const learningGoals = useStore((s) => s.learningGoals);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<PortfolioArtifact["mediaType"]>("document");
  const [mediaUrl, setMediaUrl] = useState("");
  const [reflection, setReflection] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  // Populate form when artifact changes
  useEffect(() => {
    if (artifact && open) {
      setTitle(artifact.title);
      setDescription(artifact.description);
      setMediaType(artifact.mediaType);
      setMediaUrl(artifact.mediaUrl);
      setReflection(artifact.reflection?.text ?? "");
      setSelectedGoalIds(artifact.learningGoalIds);
    }
  }, [artifact, open]);

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleSubmit = () => {
    if (!artifact || !title.trim()) return;
    if (!reflection.trim()) {
      toast.error("Please add a reflection before resubmitting");
      return;
    }

    const now = new Date().toISOString();
    const isRevision = artifact.approvalStatus === "needs_revision";

    updateArtifact(artifact.id, {
      title: title.trim(),
      description: description.trim(),
      mediaType,
      mediaUrl: mediaUrl.trim() || artifact.mediaUrl,
      learningGoalIds: selectedGoalIds,
      reflection: {
        text: reflection.trim(),
        submittedAt: now,
        // Preserve existing teacher comment
        teacherComment: artifact.reflection?.teacherComment,
        teacherCommentAt: artifact.reflection?.teacherCommentAt,
      },
      // Reset back to pending for teacher review
      approvalStatus: "pending",
      // Clear revision metadata
      revisionNote: undefined,
      revisionRequestedAt: undefined,
      updatedAt: now,
    });

    toast.success(isRevision ? "Revision submitted for review" : "Artifact updated");
    onClose();
  };

  if (!artifact) return null;

  const isRevision = artifact.approvalStatus === "needs_revision";

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[16px]">
            {isRevision ? "Revise & Resubmit" : "Edit Artifact"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Revision note reminder */}
          {isRevision && artifact.revisionNote && (
            <div className="p-3 rounded-lg bg-[#fee2e2]/50 border border-[#dc2626]/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[#dc2626] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-medium text-[#dc2626] mb-0.5">Teacher feedback</p>
                  <p className="text-[13px] text-foreground">{artifact.revisionNote}</p>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your artifact..."
              className="text-[13px] mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this artifact represents..."
              className="text-[13px] mt-1 min-h-[80px]"
            />
          </div>

          {/* Media type */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              Type
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MEDIA_TYPES.map((mt) => {
                const Icon = mt.icon;
                return (
                  <button
                    key={mt.value}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border transition-colors ${
                      mediaType === mt.value
                        ? "bg-[#fff2f0] text-[#c24e3f] border-[#c24e3f]"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => setMediaType(mt.value)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {mt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File / URL */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              File / URL
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Paste a URL or leave for mock upload"
                className="text-[13px] flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                className="text-[12px] shrink-0"
                onClick={() => {
                  setMediaUrl(`https://mock.example.com/${generateId("file")}.pdf`);
                  toast.success("File uploaded (simulated)");
                }}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload
              </Button>
            </div>
          </div>

          {/* Learning goals */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              Learning Goals
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1 max-h-[120px] overflow-y-auto">
              {learningGoals.map((goal) => (
                <button
                  key={goal.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border transition-colors ${
                    selectedGoalIds.includes(goal.id)
                      ? "bg-[#c24e3f] text-white border-[#c24e3f]"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => handleGoalToggle(goal.id)}
                >
                  {selectedGoalIds.includes(goal.id) && <Check className="h-3 w-3" />}
                  {goal.code || goal.title}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Reflection */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              Reflection *
            </label>
            <p className="text-[12px] text-muted-foreground mb-1">
              {isRevision
                ? "Update your reflection to address the teacher's feedback."
                : "What did you learn creating this? Why is it meaningful to your growth?"}
            </p>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write your reflection here..."
              className="text-[13px] mt-1 min-h-[100px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-[13px]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 text-[13px]"
              disabled={!title.trim() || !reflection.trim()}
              onClick={handleSubmit}
            >
              {isRevision ? "Resubmit for Review" : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
