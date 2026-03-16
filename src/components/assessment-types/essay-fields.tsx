"use client";

import type { EssayAssessmentConfig } from "@/types/assessment";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EssayFieldsProps {
  value: EssayAssessmentConfig;
  onChange: (updates: Partial<EssayAssessmentConfig>) => void;
}

export function EssayFields({ value, onChange }: EssayFieldsProps) {
  return (
    <div className="space-y-4 rounded-[20px] border border-border/70 bg-muted/20 p-4">
      <div className="space-y-2">
        <Label htmlFor="essay-prompt" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Writing prompt
        </Label>
        <Textarea
          id="essay-prompt"
          rows={4}
          value={value.prompt}
          onChange={(event) => onChange({ prompt: event.target.value })}
          placeholder="Set the long-form writing prompt."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="essay-min-words" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Minimum
          </Label>
          <Input
            id="essay-min-words"
            type="number"
            min={0}
            value={value.minimumWords ?? ""}
            onChange={(event) => onChange({ minimumWords: Number(event.target.value) || undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="essay-rec-words" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Recommended
          </Label>
          <Input
            id="essay-rec-words"
            type="number"
            min={0}
            value={value.recommendedWords ?? ""}
            onChange={(event) =>
              onChange({ recommendedWords: Number(event.target.value) || undefined })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="essay-max-words" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Maximum
          </Label>
          <Input
            id="essay-max-words"
            type="number"
            min={0}
            value={value.maximumWords ?? ""}
            onChange={(event) => onChange({ maximumWords: Number(event.target.value) || undefined })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="essay-scaffold" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Scaffold prompts
        </Label>
        <Textarea
          id="essay-scaffold"
          rows={4}
          value={(value.scaffoldPrompts ?? []).join("\n")}
          onChange={(event) =>
            onChange({
              scaffoldPrompts: event.target.value
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
          placeholder="One scaffold prompt per line"
        />
      </div>
    </div>
  );
}
