"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/recommendation-engine";
import { RecommendationItem } from "./recommendation-item";
import { Badge } from "@/components/ui/badge";
import { Zap, ListTodo, PartyPopper } from "lucide-react";

interface RecommendationListProps {
  recommendations: Recommendation[];
  dismissedIds: Set<string>;
  snoozedIds: Set<string>;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
  classFilter: string | null;
  onClassFilterChange: (classId: string | null) => void;
  classes: { id: string; name: string }[];
}

export function RecommendationList({
  recommendations,
  dismissedIds,
  snoozedIds,
  onDismiss,
  onSnooze,
  classFilter,
  onClassFilterChange,
  classes,
}: RecommendationListProps) {
  const [showAllNow, setShowAllNow] = useState(false);
  const [showAllTodo, setShowAllTodo] = useState(false);

  const visible = recommendations.filter(
    (r) => !dismissedIds.has(r.id) && !snoozedIds.has(r.id)
  );

  const nowItems = visible.filter((r) => r.section === "now");
  const todoItems = visible.filter((r) => r.section === "todo");

  const displayedNow = showAllNow ? nowItems : nowItems.slice(0, 3);
  const displayedTodo = showAllTodo ? todoItems : todoItems.slice(0, 8);

  if (nowItems.length === 0 && todoItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PartyPopper className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-[15px] font-semibold text-muted-foreground">
          You're all caught up!
        </p>
        <p className="text-[13px] text-muted-foreground/70 mt-1">
          No pending actions right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Right Now section */}
      {nowItems.length > 0 && (
        <div className="rounded-lg bg-[#fff2f0] border border-[#ffc1b7]/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#c24e3f]" />
            <h3 className="text-[12px] font-bold text-[#c24e3f] uppercase tracking-wider">
              Right Now
            </h3>
            <Badge className="bg-[#c24e3f] text-white text-[10px] px-1.5 py-0">
              {nowItems.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {displayedNow.map((rec) => (
              <RecommendationItem
                key={rec.id}
                rec={rec}
                onDismiss={onDismiss}
                onSnooze={onSnooze}
              />
            ))}
          </div>
          {nowItems.length > 3 && !showAllNow && (
            <button
              className="text-[12px] text-[#c24e3f] hover:underline mt-2"
              onClick={() => setShowAllNow(true)}
            >
              +{nowItems.length - 3} more
            </button>
          )}
        </div>
      )}

      {/* To Do section */}
      {todoItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-slate-500" />
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                To Do
              </h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {todoItems.length}
              </Badge>
            </div>

            {/* Class filter pill */}
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground border rounded-full px-2.5 py-0.5 transition-colors"
              onClick={() =>
                onClassFilterChange(classFilter ? null : classes[0]?.id ?? null)
              }
            >
              {classFilter
                ? classes.find((c) => c.id === classFilter)?.name ?? "Class"
                : "All classes"}{" "}
              ▾
            </button>
          </div>
          <div className="space-y-1.5">
            {displayedTodo.map((rec) => (
              <RecommendationItem
                key={rec.id}
                rec={rec}
                compact
                onDismiss={onDismiss}
                onSnooze={onSnooze}
              />
            ))}
          </div>
          {todoItems.length > 8 && !showAllTodo && (
            <button
              className="text-[12px] text-muted-foreground hover:underline mt-2"
              onClick={() => setShowAllTodo(true)}
            >
              Show all ({todoItems.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
