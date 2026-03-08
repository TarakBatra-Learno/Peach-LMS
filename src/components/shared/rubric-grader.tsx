"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RubricCriterion } from "@/types/assessment";

interface RubricScore {
  criterionId: string;
  levelId: string;
  points: number;
}

interface RubricGraderProps {
  rubric: RubricCriterion[];
  scores: Record<string, RubricScore>;
  onScoreChange: (criterionId: string, levelId: string, points: number) => void;
}

/**
 * Shared rubric grading UI — renders one Select per rubric criterion.
 * Teacher picks a level for each criterion. Used in both the shared
 * GradingSheet and the assessment detail inline grading sheet.
 */
export function RubricGrader({ rubric, scores, onScoreChange }: RubricGraderProps) {
  if (!rubric || rubric.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-[13px] text-muted-foreground">
          No rubric criteria defined. Add criteria on the Rubric Builder tab.
        </p>
      </div>
    );
  }

  // Calculate total points
  const totalPoints = Object.values(scores).reduce((sum, s) => sum + s.points, 0);
  const maxPoints = rubric.reduce((sum, c) => {
    const maxLevel = c.levels.reduce((max, l) => Math.max(max, l.points), 0);
    return sum + maxLevel;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-medium">Rubric criteria</Label>
        {maxPoints > 0 && (
          <Badge variant="outline" className="text-[11px]">
            {totalPoints} / {maxPoints} pts
          </Badge>
        )}
      </div>

      {rubric.map((criterion) => {
        const currentScore = scores[criterion.id];
        const selectedValue = currentScore?.levelId ?? "__none__";

        return (
          <div key={criterion.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[13px]">
                {criterion.title}
              </Label>
              <div className="flex items-center gap-2">
                {criterion.weight > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    Weight: {criterion.weight}%
                  </span>
                )}
                <Badge variant="outline" className="text-[11px]">
                  {currentScore ? `${currentScore.points} pts` : "—"}
                </Badge>
              </div>
            </div>
            <Select
              value={selectedValue}
              onValueChange={(levelId) => {
                if (levelId === "__none__") {
                  // Reset — remove the score for this criterion
                  onScoreChange(criterion.id, "", 0);
                  return;
                }
                const level = criterion.levels.find((l) => l.id === levelId);
                if (level) {
                  onScoreChange(criterion.id, level.id, level.points);
                }
              }}
            >
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Select level..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Not assessed</SelectItem>
                {criterion.levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.label} ({level.points} pts)
                    {level.description ? ` — ${level.description}` : ""}
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
