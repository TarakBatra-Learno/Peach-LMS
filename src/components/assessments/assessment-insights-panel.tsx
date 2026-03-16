"use client";

import type { AssessmentInsightSummary } from "@/types/assessment-report";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { BarChart3, CheckCircle2, Eye, Send } from "lucide-react";

interface AssessmentInsightsPanelProps {
  summary: AssessmentInsightSummary | null;
}

export function AssessmentInsightsPanel({ summary }: AssessmentInsightsPanelProps) {
  if (!summary) {
    return (
      <Card className="p-5">
        <p className="text-[14px] font-medium">Assessment insights</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Insights will appear once the class has enough submission and review activity.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Submitted" value={summary.submittedCount} icon={Send} />
        <StatCard label="Reviewed" value={summary.reviewedCount} icon={CheckCircle2} />
        <StatCard label="Released" value={summary.releasedCount} icon={Eye} />
        <StatCard label="Insight status" value="Seeded" icon={BarChart3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-[13px] font-semibold">Shared strengths</p>
          <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
            {summary.strengths.map((item) => (
              <li key={item} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] font-semibold">Common misconceptions</p>
          <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
            {summary.misconceptions.map((item) => (
              <li key={item} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] font-semibold">Suggested reteaching</p>
          <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
            {summary.reteachingSuggestions.map((item) => (
              <li key={item} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
