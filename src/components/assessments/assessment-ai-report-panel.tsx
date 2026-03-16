"use client";

import type { AssessmentReport } from "@/types/assessment-report";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AssessmentAIReportPanelProps {
  report: AssessmentReport | null;
  editable?: boolean;
  onChange?: (updates: Partial<AssessmentReport>) => void;
}

function handleListChange(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AssessmentAIReportPanel({
  report,
  editable = false,
  onChange,
}: AssessmentAIReportPanelProps) {
  if (!report) {
    return (
      <Card className="p-5">
        <p className="text-[14px] font-medium">Assessment report</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          No per-student report has been generated for this learner yet.
        </p>
      </Card>
    );
  }

  const reportLists = [
    { key: "strengths", label: "Strengths", value: report.strengths },
    { key: "weaknesses", label: "Weaknesses", value: report.weaknesses },
    { key: "suggestions", label: "Suggestions", value: report.suggestions },
  ] as const;

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold">Assessment report</p>
          <p className="text-[12px] text-muted-foreground">
            AI-drafted feedback that the teacher can refine before release.
          </p>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {report.status === "released" ? "Released" : report.status === "ready" ? "Ready to release" : "Draft"}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Summary
        </Label>
        {editable ? (
          <Textarea
            rows={3}
            value={report.summary}
            onChange={(event) => onChange?.({ summary: event.target.value })}
          />
        ) : (
          <p className="text-[13px] leading-6 text-foreground">{report.summary}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {reportLists.map((section) => (
          <div key={section.key} className="space-y-2">
            <Label className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
              {section.label}
            </Label>
            {editable ? (
              <Textarea
                rows={5}
                value={section.value.join("\n")}
                onChange={(event) =>
                  onChange?.({
                    [section.key]: handleListChange(event.target.value),
                  } as Partial<AssessmentReport>)
                }
              />
            ) : (
              <ul className="space-y-2 text-[13px] text-foreground">
                {section.value.map((item) => (
                  <li key={item} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Rubric-aligned feedback
        </Label>
        <div className="space-y-2">
          {report.rubricFeedback.map((entry) => (
            <div key={`${entry.criterionLabel}-${entry.levelLabel ?? "none"}`} className="rounded-xl border border-border/70 bg-background px-3 py-3">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium">{entry.criterionLabel}</p>
                {entry.levelLabel ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {entry.levelLabel}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">{entry.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
