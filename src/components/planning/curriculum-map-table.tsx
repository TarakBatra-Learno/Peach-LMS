"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CurriculumMapRow } from "@/lib/planning-selectors";

interface CurriculumMapTableProps {
  rows: CurriculumMapRow[];
}

function renderList(items: string[]) {
  if (items.length === 0) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  const visibleItems = items.slice(0, 2);
  const remaining = items.length - visibleItems.length;

  return (
    <div className="space-y-1">
      {visibleItems.map((item) => (
        <div key={item} className="flex gap-2 text-[13px] leading-6">
          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-foreground/70" />
          <span>{item}</span>
        </div>
      ))}
      {remaining > 0 ? (
        <p className="text-[12px] font-medium text-[#0f766e]">See {remaining} more</p>
      ) : null}
    </div>
  );
}

export function CurriculumMapTable({ rows }: CurriculumMapTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-[13px]">
          <thead className="bg-muted/30">
            <tr>
              <th className="w-[320px] border-r border-border/60 px-4 py-4 font-semibold">
                Units
              </th>
              <th className="border-r border-border/60 px-4 py-4 font-semibold">
                Approaches to learning
              </th>
              <th className="border-r border-border/60 px-4 py-4 font-semibold">
                Learner profile attributes
              </th>
              <th className="border-r border-border/60 px-4 py-4 font-semibold">
                Related concepts
              </th>
              <th className="px-4 py-4 font-semibold">Objectives</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.unitId} className="border-t border-border/60 align-top">
                <td className="border-r border-border/60 px-4 py-4">
                  <div className="space-y-2">
                    <p className="text-[18px] font-semibold leading-6">{row.unitTitle}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {row.className} · {row.programme}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{row.durationLabel}</Badge>
                    </div>
                  </div>
                </td>
                <td className="border-r border-border/60 px-4 py-4">
                  {renderList(row.approachesToLearning)}
                </td>
                <td className="border-r border-border/60 px-4 py-4">
                  {renderList(row.learnerProfileAttributes)}
                </td>
                <td className="border-r border-border/60 px-4 py-4">
                  {renderList(row.relatedConcepts)}
                </td>
                <td className="px-4 py-4">{renderList(row.objectives)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
