"use client";

import { Download, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CurriculumMapRow, PlanningInsightSummary } from "@/lib/planning-selectors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlanningInsightsPanelProps {
  insights: PlanningInsightSummary[];
  selectedInsightId: PlanningInsightSummary["id"];
  onSelectInsightId: (id: PlanningInsightSummary["id"]) => void;
  rows: CurriculumMapRow[];
}

export function PlanningInsightsPanel({
  insights,
  selectedInsightId,
  onSelectInsightId,
  rows,
}: PlanningInsightsPanelProps) {
  const selectedInsight =
    insights.find((insight) => insight.id === selectedInsightId) ?? insights[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {insights.map((insight) => {
          const selected = insight.id === selectedInsight.id;
          return (
            <button
              key={insight.id}
              type="button"
              onClick={() => onSelectInsightId(insight.id)}
              className={cn(
                "rounded-2xl border p-5 text-left transition-colors",
                selected
                  ? "border-[#f3c7c0] bg-[#fff6f4]"
                  : "border-border/70 bg-background hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{insight.populatedCount} ready</Badge>
                <span className="text-[12px] text-muted-foreground">
                  {insight.gapCount} gaps
                </span>
              </div>
              <p className="mt-3 text-[16px] font-semibold">{insight.title}</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                {insight.description}
              </p>
            </button>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-semibold">{selectedInsight.title}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Seeded read-only projection for the current prototype dataset.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast("Download snapshot", {
                description: "This stays a visible stub in Chunk 1 while the planning parity views remain seeded projections.",
              })
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Class</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Unit</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Duration</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Coverage signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${selectedInsight.id}-${row.unitId}`} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{row.className}</p>
                      <p className="text-[12px] text-muted-foreground">{row.programme}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{row.unitTitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.durationLabel}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.keySignals.map((signal) => (
                        <Badge key={signal} variant="outline">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-[12px] text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#c24e3f]" />
          These cards read from the enriched planning seed and selector layer added in Chunk 1. They are intentionally shallow, deterministic projections for the demo rather than final analytics logic.
        </div>
      </Card>
    </div>
  );
}
