"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PlanningClassTimelineGroup } from "@/lib/planning-selectors";

interface PlanningTimelineViewProps {
  groups: PlanningClassTimelineGroup[];
}

export function PlanningTimelineView({ groups }: PlanningTimelineViewProps) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.classId} className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[16px] font-semibold">{group.className}</p>
              <p className="text-[13px] text-muted-foreground">
                {group.programme} timeline view across the current year
              </p>
            </div>
            <ButtonLink href={`/classes/${group.classId}?tab=units`} label="Open class planning" />
          </div>

          <div className="mt-4 space-y-3">
            {group.units.map((unit) => (
              <div
                key={unit.unitId}
                className="grid gap-3 rounded-xl border border-border/70 bg-background p-4 lg:grid-cols-[220px_1fr_120px]"
              >
                <div>
                  <p className="text-[14px] font-medium">{unit.title}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {unit.durationWeeks ? `${unit.durationWeeks} weeks` : unit.durationHours ? `${unit.durationHours} hours` : "Duration pending"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{unit.lessonCount} lessons</Badge>
                  <Badge variant="outline">{unit.assessmentCount} assessments</Badge>
                  <Badge variant="outline">{unit.collaboratorCount} collaborators</Badge>
                  <Badge variant="secondary">{unit.status}</Badge>
                </div>
                <div className="text-right text-[12px] text-muted-foreground">
                  {unit.startDate} to {unit.endDate}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center rounded-md border border-border/70 px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
    >
      {label}
    </Link>
  );
}
