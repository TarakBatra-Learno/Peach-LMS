"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  buildPlanningTimelinePeriods,
  type PlanningClassTimelineGroup,
  type PlanningTimelinePeriod,
} from "@/lib/planning-selectors";
import { getDemoNow } from "@/lib/demo-time";

interface PlanningTimelineViewProps {
  groups: PlanningClassTimelineGroup[];
}

function differenceInDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function getTimelineBounds(periods: PlanningTimelinePeriod[]) {
  const first = periods[0];
  const last = periods[periods.length - 1];
  return {
    startDate: first.startDate,
    endDate: last.endDate,
    totalDays: Math.max(1, differenceInDays(first.startDate, last.endDate) + 1),
  };
}

function getBarGeometry(
  startDate: string,
  endDate: string,
  periods: PlanningTimelinePeriod[]
) {
  const bounds = getTimelineBounds(periods);
  const clampedStart = startDate < bounds.startDate ? bounds.startDate : startDate;
  const clampedEnd = endDate > bounds.endDate ? bounds.endDate : endDate;
  const offsetDays = differenceInDays(bounds.startDate, clampedStart);
  const spanDays = Math.max(1, differenceInDays(clampedStart, clampedEnd) + 1);

  return {
    left: `${(offsetDays / bounds.totalDays) * 100}%`,
    width: `${(spanDays / bounds.totalDays) * 100}%`,
  };
}

function getTodayMarker(periods: PlanningTimelinePeriod[]) {
  const bounds = getTimelineBounds(periods);
  const today = getDemoNow().toISOString().slice(0, 10);
  const offsetDays = differenceInDays(bounds.startDate, today);
  return `${Math.min(100, Math.max(0, (offsetDays / bounds.totalDays) * 100))}%`;
}

function getBarTone(status: string) {
  if (status === "completed") return "bg-[#f07a96]";
  if (status === "draft") return "bg-[#7bd7c0]";
  return "bg-[#46c7ad]";
}

export function PlanningTimelineView({ groups }: PlanningTimelineViewProps) {
  const periods = buildPlanningTimelinePeriods();
  const todayMarker = getTodayMarker(periods);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.classId} className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <p className="text-[16px] font-semibold">{group.className}</p>
              <p className="text-[13px] text-muted-foreground">
                {group.programme} yearly timeline with pacing across the school year
              </p>
            </div>
            <Link
              href={`/classes/${group.classId}?tab=units&planningView=year_plan`}
              className="inline-flex h-8 items-center rounded-md border border-border/70 px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Open class planning
            </Link>
          </div>

          <div className="grid min-w-[1120px] grid-cols-[320px_1fr]">
            <div className="border-r border-border/60 bg-background px-5 py-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Units
              </p>
            </div>
            <div className="relative grid grid-cols-6">
              {periods.map((period) => (
                <div
                  key={period.id}
                  className="border-r border-border/60 px-4 py-4 text-center text-[15px] font-semibold text-muted-foreground last:border-r-0"
                >
                  {period.label}
                </div>
              ))}
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-px bg-[#d89d35]"
                style={{ left: todayMarker }}
              />
            </div>
          </div>

          <div className="min-w-[1120px]">
            {group.units.map((unit) => {
              const geometry = getBarGeometry(unit.startDate, unit.endDate, periods);

              return (
                <div
                  key={unit.unitId}
                  className="grid grid-cols-[320px_1fr] border-t border-border/60"
                >
                  <div className="border-r border-border/60 px-5 py-5">
                    <div className="space-y-2">
                      <p className="text-[16px] font-semibold">{unit.title}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {unit.programme} · {unit.durationWeeks ? `${unit.durationWeeks} weeks` : unit.durationHours ? `${unit.durationHours} hours` : "Duration pending"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{unit.lessonCount} lessons</Badge>
                        <Badge variant="outline">{unit.assessmentCount} assessments</Badge>
                        <Badge variant="outline">{unit.collaboratorCount} collaborators</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="relative min-h-[108px]">
                    <div className="absolute inset-0 grid grid-cols-6">
                      {periods.map((period) => (
                        <div key={period.id} className="border-r border-border/60 last:border-r-0" />
                      ))}
                    </div>
                    <div
                      className={`absolute top-1/2 h-9 -translate-y-1/2 rounded-lg shadow-sm ${getBarTone(unit.status)}`}
                      style={geometry}
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-[#d89d35]"
                      style={{ left: todayMarker }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
