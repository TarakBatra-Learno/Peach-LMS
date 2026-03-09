"use client";

import { useState } from "react";
import { useStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import { Check } from "lucide-react";
import type { Class } from "@/types/class";

interface GoalCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  enrolledClasses: Class[];
}

export function GoalCreateDrawer({
  open,
  onClose,
  studentId,
  enrolledClasses,
}: GoalCreateDrawerProps) {
  const addStudentGoal = useStore((s) => s.addStudentGoal);
  const learningGoals = useStore((s) => s.learningGoals);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const now = new Date().toISOString();
    addStudentGoal({
      id: generateId("sgoal"),
      studentId,
      title: title.trim(),
      description: description.trim(),
      status: "active",
      linkedClassIds: selectedClassIds,
      linkedLearningGoalIds: selectedGoalIds,
      linkedUnitIds: [],
      createdAt: now,
      updatedAt: now,
    });

    toast.success("Goal created");
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedClassIds([]);
    setSelectedGoalIds([]);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[16px]">New Personal Goal</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              What do you want to work on? *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Improve my essay structure"
              className="text-[13px] mt-1"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              Why does this matter to you?
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your intention and what success looks like..."
              className="text-[13px] mt-1 min-h-[80px]"
            />
          </div>

          {/* Linked classes */}
          {enrolledClasses.length > 0 && (
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Related classes (optional)
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {enrolledClasses.map((cls) => (
                  <button
                    key={cls.id}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                      selectedClassIds.includes(cls.id)
                        ? "bg-[#c24e3f] text-white border-[#c24e3f]"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => handleClassToggle(cls.id)}
                  >
                    {selectedClassIds.includes(cls.id) && <Check className="h-3 w-3" />}
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked learning goals */}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              Related learning goals (optional)
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

          <Button
            className="w-full text-[13px] mt-2"
            disabled={!title.trim()}
            onClick={handleSubmit}
          >
            Create Goal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
