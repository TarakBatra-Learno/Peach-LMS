"use client";

import type { Recommendation } from "@/lib/recommendation-engine";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Image,
  Shield,
  ArrowRight,
  Clock,
  X,
} from "lucide-react";
import Link from "next/link";

const URGENCY_COLORS: Record<string, string> = {
  overdue: "bg-red-500",
  today: "bg-amber-500",
  soon: "bg-blue-500",
  normal: "bg-slate-300",
};

const URGENCY_BADGE_COLORS: Record<string, string> = {
  overdue: "bg-red-50 text-red-700 border-red-200",
  today: "bg-amber-50 text-amber-700 border-amber-200",
  soon: "bg-blue-50 text-blue-700 border-blue-200",
  normal: "bg-slate-50 text-slate-500 border-slate-200",
};

const CATEGORY_ICONS: Record<string, typeof ClipboardList> = {
  marking: ClipboardList,
  reports: FileText,
  attention: AlertTriangle,
  release: CheckCircle2,
  portfolio: Image,
  incidents: Shield,
};

interface RecommendationItemProps {
  rec: Recommendation;
  compact?: boolean;
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string) => void;
}

export function RecommendationItem({
  rec,
  compact = false,
  onDismiss,
  onSnooze,
}: RecommendationItemProps) {
  const Icon = CATEGORY_ICONS[rec.category] ?? ClipboardList;

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-lg border bg-white transition-shadow hover:shadow-sm ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}
    >
      {/* Urgency bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg ${URGENCY_COLORS[rec.urgency]}`}
      />

      {/* Category icon */}
      <div className="mt-0.5 shrink-0 ml-1">
        <Icon className={`h-4 w-4 text-muted-foreground ${compact ? "h-3.5 w-3.5" : ""}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${compact ? "text-[12px]" : "text-[13px]"}`}>
          {rec.title}
        </p>
        <p className={`text-muted-foreground truncate ${compact ? "text-[11px]" : "text-[12px]"}`}>
          {rec.subtitle}
        </p>
      </div>

      {/* Right side: deadline + actions */}
      <div className="flex items-center gap-2 shrink-0">
        {rec.deadline && (
          <Badge
            variant="outline"
            className={`text-[10px] font-medium ${URGENCY_BADGE_COLORS[rec.urgency]}`}
          >
            {rec.deadline}
          </Badge>
        )}

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={rec.href}>
            <button
              type="button"
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Go to"
            >
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </Link>
          {onSnooze && (
            <button
              type="button"
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Snooze"
              onClick={() => onSnooze(rec.id)}
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Dismiss"
              onClick={() => onDismiss(rec.id)}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
