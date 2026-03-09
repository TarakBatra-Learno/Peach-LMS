"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import { getStudentPersonalGoals } from "@/lib/student-selectors";
import type { GoalEvidenceSourceType, GoalEvidenceSurface } from "@/types/goal-evidence";
import { Target, Plus, Check } from "lucide-react";

interface AddToGoalDialogProps {
  open: boolean;
  onClose: () => void;
  sourceType: GoalEvidenceSourceType;
  sourceId: string;
  sourceTitle: string;
  studentId: string;
  surface: GoalEvidenceSurface;
}

export function AddToGoalDialog({
  open,
  onClose,
  sourceType,
  sourceId,
  sourceTitle,
  studentId,
  surface,
}: AddToGoalDialogProps) {
  const state = useStore((s) => s);
  const addStudentGoal = useStore((s) => s.addStudentGoal);
  const addGoalEvidenceLink = useStore((s) => s.addGoalEvidenceLink);

  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const activeGoals = useMemo(
    () => getStudentPersonalGoals(state, studentId, "active"),
    [state, studentId]
  );

  // Check which goals already have this source linked
  const alreadyLinkedGoalIds = useMemo(() => {
    return new Set(
      state.goalEvidenceLinks
        .filter((l) => l.sourceType === sourceType && l.sourceId === sourceId)
        .map((l) => l.goalId)
    );
  }, [state.goalEvidenceLinks, sourceType, sourceId]);

  const handleSubmit = () => {
    if (!reflection.trim()) {
      toast.error("Please add a reflection");
      return;
    }

    const now = new Date().toISOString();

    if (mode === "create") {
      if (!newTitle.trim()) {
        toast.error("Please add a goal title");
        return;
      }
      const goalId = generateId("sgoal");
      addStudentGoal({
        id: goalId,
        studentId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: "active",
        linkedClassIds: [],
        linkedLearningGoalIds: [],
        linkedUnitIds: [],
        createdAt: now,
        updatedAt: now,
      });
      addGoalEvidenceLink({
        id: generateId("gel"),
        goalId,
        sourceType,
        sourceId,
        addedAt: now,
        reflection: reflection.trim(),
        addedFromSurface: surface,
      });
      toast.success("Goal created and evidence added");
    } else {
      if (!selectedGoalId) {
        toast.error("Please select a goal");
        return;
      }
      addGoalEvidenceLink({
        id: generateId("gel"),
        goalId: selectedGoalId,
        sourceType,
        sourceId,
        addedAt: now,
        reflection: reflection.trim(),
        addedFromSurface: surface,
      });
      toast.success("Evidence added to goal");
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setMode("select");
    setSelectedGoalId(null);
    setReflection("");
    setNewTitle("");
    setNewDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-[440px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[16px]">Add to Goal</DialogTitle>
        </DialogHeader>

        {/* Source summary */}
        <Card className="p-3 gap-0 bg-muted/50">
          <p className="text-[13px] font-medium">{sourceTitle}</p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {sourceType.replace(/_/g, " ")}
          </p>
        </Card>

        {mode === "select" ? (
          <div className="space-y-3">
            {/* Goal selection */}
            {activeGoals.length > 0 ? (
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                  Choose a goal
                </label>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {activeGoals.map((goal) => {
                    const isLinked = alreadyLinkedGoalIds.has(goal.id);
                    const isSelected = selectedGoalId === goal.id;
                    return (
                      <Card
                        key={goal.id}
                        className={`p-3 gap-0 cursor-pointer transition-colors ${
                          isLinked
                            ? "opacity-50 cursor-not-allowed"
                            : isSelected
                            ? "ring-2 ring-[#c24e3f] bg-[#fff2f0]"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => !isLinked && setSelectedGoalId(goal.id)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-medium truncate">{goal.title}</p>
                          {isLinked ? (
                            <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                              <Check className="h-3 w-3 mr-0.5" /> Linked
                            </Badge>
                          ) : isSelected ? (
                            <div className="h-4 w-4 rounded-full bg-[#c24e3f] flex items-center justify-center shrink-0 ml-2">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          ) : null}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground text-center py-3">
                No active goals yet. Create one below.
              </p>
            )}

            <button
              className="flex items-center gap-1.5 text-[13px] text-[#c24e3f] hover:underline"
              onClick={() => setMode("create")}
            >
              <Plus className="h-3.5 w-3.5" />
              Create new goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              New goal
            </label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you want to work on?"
              className="text-[13px]"
              autoFocus
            />
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe your intention (optional)"
              className="text-[13px] min-h-[60px]"
            />
            <button
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
              onClick={() => setMode("select")}
            >
              ← Back to existing goals
            </button>
          </div>
        )}

        {/* Reflection */}
        <div>
          <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
            Why does this evidence matter? *
          </label>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write about what this shows about your growth..."
            className="text-[13px] mt-1 min-h-[80px]"
          />
        </div>

        <Button
          className="w-full text-[13px]"
          disabled={
            !reflection.trim() ||
            (mode === "select" && !selectedGoalId) ||
            (mode === "create" && !newTitle.trim())
          }
          onClick={handleSubmit}
        >
          <Target className="h-3.5 w-3.5 mr-1.5" />
          {mode === "create" ? "Create Goal & Add Evidence" : "Add to Goal"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
