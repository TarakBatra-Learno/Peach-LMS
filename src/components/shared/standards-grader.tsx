"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/stores";

const MASTERY_OPTIONS = [
  { value: "not_assessed", label: "Not assessed" },
  { value: "beginning", label: "Beginning" },
  { value: "approaching", label: "Approaching" },
  { value: "meeting", label: "Meeting" },
  { value: "exceeding", label: "Exceeding" },
] as const;

interface StandardsGraderProps {
  learningGoalIds: string[];
  mastery: Record<string, string>;
  onMasteryChange: (goalId: string, level: string) => void;
}

/**
 * Shared standards grading UI — renders one Select per learning goal.
 * Teacher picks a mastery level for each standard linked to the assessment.
 */
export function StandardsGrader({ learningGoalIds, mastery, onMasteryChange }: StandardsGraderProps) {
  const learningGoals = useStore((s) => s.learningGoals);

  const goals = (learningGoalIds ?? [])
    .map((id) => learningGoals.find((g) => g.id === id))
    .filter(Boolean);

  if (goals.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-[13px] text-muted-foreground">
          No learning goals linked to this assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-[13px] font-medium">Standards mastery</Label>

      {goals.map((goal) => {
        if (!goal) return null;
        const currentLevel = mastery[goal.id] ?? "not_assessed";

        return (
          <div key={goal.id} className="space-y-1.5">
            <Label className="text-[13px]">
              {goal.code}: {goal.title}
              {goal.strand && (
                <span className="text-muted-foreground ml-1">({goal.strand})</span>
              )}
            </Label>
            <Select
              value={currentLevel}
              onValueChange={(v) => onMasteryChange(goal.id, v)}
            >
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MASTERY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
