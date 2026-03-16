"use client";

import type { ChatAssessmentConfig } from "@/types/assessment";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChatFieldsProps {
  value: ChatAssessmentConfig;
  onChange: (updates: Partial<ChatAssessmentConfig>) => void;
}

export function ChatFields({ value, onChange }: ChatFieldsProps) {
  return (
    <div className="space-y-4 rounded-[20px] border border-border/70 bg-muted/20 p-4">
      <div className="space-y-2">
        <Label htmlFor="chat-starter-prompt" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Starter prompt
        </Label>
        <Textarea
          id="chat-starter-prompt"
          rows={4}
          value={value.starterPrompt}
          onChange={(event) => onChange({ starterPrompt: event.target.value })}
          placeholder="Set the opening prompt for the student conversation."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="chat-minimum-turns" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Minimum turns
        </Label>
        <Input
          id="chat-minimum-turns"
          type="number"
          min={2}
          value={value.minimumTurns ?? ""}
          onChange={(event) =>
            onChange({ minimumTurns: Number(event.target.value) || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="chat-success-criteria" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Success criteria
        </Label>
        <Textarea
          id="chat-success-criteria"
          rows={4}
          value={(value.successCriteria ?? []).join("\n")}
          onChange={(event) =>
            onChange({
              successCriteria: event.target.value
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
          placeholder="One success criterion per line"
        />
      </div>
    </div>
  );
}
