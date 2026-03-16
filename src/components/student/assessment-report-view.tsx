"use client";

import type { AssessmentReport } from "@/types/assessment-report";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AssessmentReportViewProps {
  report: AssessmentReport;
}

export function AssessmentReportView({ report }: AssessmentReportViewProps) {
  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold">Assessment report</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">{report.summary}</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          Released
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Strengths
          </p>
          {report.strengths.map((item) => (
            <div key={item} className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-[13px]">
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Weaknesses
          </p>
          {report.weaknesses.map((item) => (
            <div key={item} className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-[13px]">
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Suggestions
          </p>
          {report.suggestions.map((item) => (
            <div key={item} className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-[13px]">
              {item}
            </div>
          ))}
        </div>
      </div>

      {report.rubricFeedback.length > 0 ? (
        <div className="mt-5 space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Rubric-aligned feedback
          </p>
          <div className="space-y-2">
            {report.rubricFeedback.map((entry) => (
              <div key={`${entry.criterionLabel}-${entry.levelLabel ?? "none"}`} className="rounded-xl border border-border/70 bg-background px-3 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium">{entry.criterionLabel}</p>
                  {entry.levelLabel ? (
                    <Badge variant="outline" className="text-[10px]">
                      {entry.levelLabel}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">{entry.summary}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
