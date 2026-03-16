"use client";

import type { QuizAssessmentConfig } from "@/types/assessment";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface QuizFieldsProps {
  value: QuizAssessmentConfig;
  onChange: (updates: Partial<QuizAssessmentConfig>) => void;
}

export function QuizFields({ value, onChange }: QuizFieldsProps) {
  return (
    <div className="space-y-4 rounded-[20px] border border-border/70 bg-muted/20 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quiz-duration" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Duration (minutes)
          </Label>
          <Input
            id="quiz-duration"
            type="number"
            min={5}
            value={value.durationMinutes ?? ""}
            onChange={(event) =>
              onChange({ durationMinutes: Number(event.target.value) || undefined })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiz-passing-score" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Passing score
          </Label>
          <Input
            id="quiz-passing-score"
            type="number"
            min={0}
            value={value.passingScore ?? ""}
            onChange={(event) =>
              onChange({ passingScore: Number(event.target.value) || undefined })
            }
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-background px-3 py-3">
        <p className="text-[13px] font-medium">Question bank preview</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {value.questions.length} question{value.questions.length === 1 ? "" : "s"} configured.
          Detailed authoring lands in the builder in the next slice.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-background px-3 py-3">
        <Checkbox
          checked={value.showCorrectAnswersOnRelease}
          onCheckedChange={(checked) =>
            onChange({ showCorrectAnswersOnRelease: Boolean(checked) })
          }
        />
        <span className="space-y-0.5">
          <span className="block text-[13px] font-medium">Show correct answers on release</span>
          <span className="block text-[12px] text-muted-foreground">
            Keep the runner simple while still showing a believable result behavior.
          </span>
        </span>
      </label>
    </div>
  );
}
