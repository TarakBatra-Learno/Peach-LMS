"use client";

import { useState, useMemo } from "react";
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
  X,
  Check,
} from "lucide-react";
import type { Class } from "@/types/class";
import type { PortfolioArtifact } from "@/types/portfolio";

interface PortfolioCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  enrolledClasses: Class[];
}

const MEDIA_TYPES: { value: PortfolioArtifact["mediaType"]; label: string; icon: typeof FileText }[] = [
  { value: "document", label: "Document", icon: FileText },
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "audio", label: "Audio", icon: Music },
  { value: "link", label: "Link", icon: Link2 },
];

export function PortfolioCreateDrawer({
  open,
  onClose,
  studentId,
  enrolledClasses,
}: PortfolioCreateDrawerProps) {
  const addArtifact = useStore((s) => s.addArtifact);
  const learningGoals = useStore((s) => s.learningGoals);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState(enrolledClasses[0]?.id ?? "");
  const [mediaType, setMediaType] = useState<PortfolioArtifact["mediaType"]>("document");
  const [mediaUrl, setMediaUrl] = useState("");
  const [reflection, setReflection] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [step, setStep] = useState<"details" | "reflection">("details");

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || !classId) return;
    if (!reflection.trim()) {
      toast.error("Please add a reflection before submitting");
      return;
    }

    const now = new Date().toISOString();
    addArtifact({
      id: generateId("art"),
      studentId,
      classId,
      title: title.trim(),
      description: description.trim(),
      mediaType,
      mediaUrl: mediaUrl.trim() || `https://mock.example.com/${generateId("file")}`,
      learningGoalIds: selectedGoalIds,
      reflection: {
        text: reflection.trim(),
        submittedAt: now,
      },
      approvalStatus: "pending",
      familyShareStatus: "not_shared",
      createdBy: "student",
      createdAt: now,
      updatedAt: now,
      isReportEligible: false,
      sourceType: "manual",
    });

    toast.success("Portfolio artifact created");
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMediaType("document");
    setMediaUrl("");
    setReflection("");
    setSelectedGoalIds([]);
    setStep("details");
  };

  const canProceedToReflection = title.trim() && classId;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[16px]">New Portfolio Artifact</SheetTitle>
        </SheetHeader>

        {step === "details" ? (
          <div className="space-y-4 mt-4">
            {/* Class selection */}
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Class
              </label>
              <select
                className="w-full text-[13px] border rounded-md px-3 py-2 mt-1 bg-background"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                {enrolledClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

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

            {/* Mock file upload */}
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                File / URL
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Paste a URL or leave empty for mock upload"
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

            <Button
              className="w-full text-[13px]"
              disabled={!canProceedToReflection}
              onClick={() => setStep("reflection")}
            >
              Continue to Reflection
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[13px] font-medium">{title}</p>
              <p className="text-[12px] text-muted-foreground">
                {enrolledClasses.find((c) => c.id === classId)?.name}
              </p>
            </div>

            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Reflection *
              </label>
              <p className="text-[12px] text-muted-foreground mb-1">
                What did you learn creating this? Why is it meaningful to your growth?
              </p>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write your reflection here..."
                className="text-[13px] mt-1 min-h-[120px]"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-[13px]"
                onClick={() => setStep("details")}
              >
                Back
              </Button>
              <Button
                className="flex-1 text-[13px]"
                disabled={!reflection.trim()}
                onClick={handleSubmit}
              >
                Submit Artifact
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
