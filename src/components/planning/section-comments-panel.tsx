"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { UnitPlan } from "@/types/unit-planning";

interface SectionCommentsPanelProps {
  unit: UnitPlan;
  activeSection: string;
  sectionLabel: string;
}

export function SectionCommentsPanel({
  unit,
  activeSection,
  sectionLabel,
}: SectionCommentsPanelProps) {
  const comments = (unit.sectionComments ?? []).filter(
    (comment) => comment.sectionKey === activeSection
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold">Collaboration</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Visible-only planning signals for {sectionLabel.toLowerCase()}.
            </p>
          </div>
          {unit.status === "draft" ? <Badge variant="outline">Needs review</Badge> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {(unit.collaborators ?? []).map((collaborator) => (
            <div key={collaborator.id} className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c24e3f]/10 text-[12px] font-semibold text-[#c24e3f]">
                {collaborator.initials}
              </div>
              <div>
                <p className="text-[13px] font-medium">{collaborator.name}</p>
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  {collaborator.role ?? "collaborator"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-[14px] font-semibold">Section comments</p>
        <div className="mt-4 space-y-3">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium">{comment.authorName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  {comment.body}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-4 text-[13px] text-muted-foreground">
              No visible planning comments for this section yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
