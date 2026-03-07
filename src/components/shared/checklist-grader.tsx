"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { Assessment } from "@/types/assessment";
import type { ChecklistResultItem, ChecklistResultStatus } from "@/types/gradebook";

interface ChecklistGraderProps {
  assessment: Assessment;
  results: Record<string, ChecklistResultItem>;
  onResultChange: (
    itemId: string,
    update: Partial<ChecklistResultItem>
  ) => void;
}

const BINARY_OPTIONS: { status: ChecklistResultStatus; label: string }[] = [
  { status: "met", label: "Met" },
  { status: "not_yet", label: "Not yet" },
];

const TERNARY_OPTIONS: { status: ChecklistResultStatus; label: string }[] = [
  { status: "yes", label: "Yes" },
  { status: "partly", label: "Partly" },
  { status: "no", label: "No" },
];

function getStatusColor(status: ChecklistResultStatus): string {
  switch (status) {
    case "met":
    case "yes":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "not_yet":
    case "no":
      return "bg-red-100 text-red-700 border-red-300";
    case "partly":
      return "bg-amber-100 text-amber-700 border-amber-300";
    default:
      return "";
  }
}

export function ChecklistGrader({
  assessment,
  results,
  onResultChange,
}: ChecklistGraderProps) {
  const allItems = assessment.checklist ?? [];
  const sections = assessment.checklistSections ?? [];
  const isBinary = assessment.checklistResponseStyle !== "ternary";
  const options = isBinary ? BINARY_OPTIONS : TERNARY_OPTIONS;

  // Items assigned to sections
  const assignedItemIds = new Set(sections.flatMap((s) => s.itemIds));
  const ungroupedItems = allItems.filter((i) => !assignedItemIds.has(i.id));

  // Progress
  const markedCount = allItems.filter((item) => {
    const result = results[item.id];
    return result && result.status !== "unmarked";
  }).length;
  const progressPercent =
    allItems.length > 0 ? Math.round((markedCount / allItems.length) * 100) : 0;

  const renderItem = (itemId: string) => {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return null;

    const result = results[item.id];
    const currentStatus = result?.status ?? "unmarked";

    return (
      <div key={item.id} className="space-y-1.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px]">{item.label}</span>
              {item.required && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              )}
              {item.helpText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="text-[12px]">{item.helpText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {assessment.checklistOutcomeModel === "score_contributing" &&
                item.points != null &&
                item.points > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 px-1 shrink-0"
                  >
                    {item.points}pt{item.points !== 1 ? "s" : ""}
                  </Badge>
                )}
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            {options.map((opt) => (
              <button
                key={opt.status}
                type="button"
                onClick={() => {
                  const newStatus =
                    currentStatus === opt.status ? "unmarked" : opt.status;
                  onResultChange(item.id, { status: newStatus });
                }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                  currentStatus === opt.status
                    ? getStatusColor(opt.status)
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {item.requireEvidence && (
          <Textarea
            value={result?.evidence ?? ""}
            onChange={(e) =>
              onResultChange(item.id, { evidence: e.target.value })
            }
            placeholder="Add evidence or notes..."
            className="text-[12px] min-h-[48px] ml-0"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-medium">
            {markedCount} of {allItems.length} items marked
          </Label>
          <span className="text-[12px] text-muted-foreground">
            {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Sections with their items */}
      {sections.map((section) => (
        <div key={section.id} className="space-y-2">
          {section.title && (
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              {section.title}
            </p>
          )}
          {section.itemIds.map((itemId) => renderItem(itemId))}
        </div>
      ))}

      {/* Ungrouped items */}
      {ungroupedItems.length > 0 && (
        <div className="space-y-2">
          {sections.length > 0 && ungroupedItems.length > 0 && (
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Other items
            </p>
          )}
          {ungroupedItems.map((item) => renderItem(item.id))}
        </div>
      )}

      {allItems.length === 0 && (
        <p className="text-[13px] text-muted-foreground text-center py-4">
          No checklist items configured for this assessment.
        </p>
      )}
    </div>
  );
}
