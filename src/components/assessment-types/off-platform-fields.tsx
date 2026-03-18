"use client";

import type { OffPlatformAssessmentConfig } from "@/types/assessment";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OffPlatformFieldsProps {
  value: OffPlatformAssessmentConfig;
  onChange: (updates: Partial<OffPlatformAssessmentConfig>) => void;
}

export function OffPlatformFields({ value, onChange }: OffPlatformFieldsProps) {
  return (
    <div className="space-y-4 rounded-[20px] border border-border/70 bg-muted/20 p-4">
      <div className="space-y-2">
        <Label className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Submission mode
        </Label>
        <Select
          value={value.submissionMode}
          onValueChange={(next) =>
            onChange({
              submissionMode: next as OffPlatformAssessmentConfig["submissionMode"],
            })
          }
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="digital_submission">Digital submission</SelectItem>
            <SelectItem value="offline_mode">Offline mode</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-background px-3 py-3">
          <Checkbox
            checked={value.allowTextResponse}
            onCheckedChange={(checked) => onChange({ allowTextResponse: Boolean(checked) })}
          />
          <span className="space-y-0.5">
            <span className="block text-[13px] font-medium">Written response</span>
            <span className="block text-[12px] text-muted-foreground">
              Allow students to add text alongside uploads.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-background px-3 py-3">
          <Checkbox
            checked={value.allowAttachments}
            onCheckedChange={(checked) => onChange({ allowAttachments: Boolean(checked) })}
          />
          <span className="space-y-0.5">
            <span className="block text-[13px] font-medium">Attachments</span>
            <span className="block text-[12px] text-muted-foreground">
              Let students upload files or supporting evidence.
            </span>
          </span>
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="off-platform-evidence-prompt" className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Evidence prompt
        </Label>
        <Input
          id="off-platform-evidence-prompt"
          value={value.evidencePrompt ?? ""}
          onChange={(event) => onChange({ evidencePrompt: event.target.value })}
          placeholder="Tell students what to submit or explain what the teacher will capture."
        />
      </div>
    </div>
  );
}
