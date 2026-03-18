"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { UnitPlan } from "@/types/unit-planning";

interface UnitReflectionPanelProps {
  unit: UnitPlan;
}

export function UnitReflectionPanel({ unit }: UnitReflectionPanelProps) {
  const prompts = unit.strategy.reflection?.prompts ?? [];
  const teacherNotes = unit.strategy.reflection?.teacherNotes;
  const portfolioSignals = unit.strategy.evidence?.portfolioSignals ?? [];
  const comments = unit.sectionComments ?? [];

  return (
    <Card className="p-5 space-y-5">
      <div>
        <p className="text-[16px] font-semibold">Reflection</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Capture what happened in the unit: teaching notes, observations, portfolio-worthy moments,
          and contributions from collaborating teachers.
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Reflection prompts
        </p>
        {prompts.length > 0 ? (
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <div key={prompt} className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-[14px]">
                {prompt}
              </div>
            ))}
          </div>
        ) : (
          <EmptyCopy text="No reflection prompts have been set for this unit yet." />
        )}
      </section>

      <section className="space-y-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Teacher notes
        </p>
        {teacherNotes ? (
          <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-[14px] leading-6">
            {teacherNotes}
          </div>
        ) : (
          <EmptyCopy text="Use this surface for teacher observations and end-of-unit notes." />
        )}
      </section>

      <section className="space-y-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Portfolio-worthy signals
        </p>
        {portfolioSignals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {portfolioSignals.map((signal) => (
              <Badge key={signal} variant="outline">
                {signal}
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyCopy text="No portfolio moments have been tagged yet." />
        )}
      </section>

      <section className="space-y-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Team contributions
        </p>
        {comments.length > 0 ? (
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {comment.sectionKey}
                  </Badge>
                  <p className="text-[13px] font-medium">{comment.authorName}</p>
                </div>
                <p className="mt-2 text-[13px] text-muted-foreground">{comment.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCopy text="No collaborative reflections have been logged yet." />
        )}
      </section>
    </Card>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-[13px] text-muted-foreground">{text}</p>;
}
