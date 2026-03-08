"use client";

import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  Eye,
  CircleDashed,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-[#dcfce7] text-[#16a34a] border-transparent",
  warning: "bg-[#fef3c7] text-[#b45309] border-transparent",
  danger: "bg-[#fee2e2] text-[#dc2626] border-transparent",
  info: "bg-[#dbeafe] text-[#2563eb] border-transparent",
  neutral: "bg-muted text-muted-foreground border-transparent",
  primary: "bg-[#fff2f0] text-[#c24e3f] border-transparent",
};

const variantIcons: Record<StatusVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  neutral: CircleDashed,
  primary: CheckCircle2,
};

// Map common status strings to variants
const statusMap: Record<string, { variant: StatusVariant; label?: string }> = {
  published: { variant: "success" },
  sent: { variant: "success" },
  approved: { variant: "success" },
  distributed: { variant: "primary" },
  completed: { variant: "success" },
  resolved: { variant: "success" },
  active: { variant: "info" },
  draft: { variant: "neutral" },
  pending: { variant: "warning" },
  scheduled: { variant: "info" },
  ready: { variant: "info" },
  open: { variant: "warning" },
  in_progress: { variant: "info", label: "In progress" },
  closing: { variant: "warning" },
  closed: { variant: "neutral" },
  needs_revision: { variant: "danger", label: "Needs revision" },
  not_started: { variant: "neutral", label: "Not started" },
  shared: { variant: "success" },
  viewed: { variant: "success" },
  not_shared: { variant: "neutral", label: "Not shared" },
  present: { variant: "success" },
  absent: { variant: "danger" },
  late: { variant: "warning" },
  excused: { variant: "info" },
  submitted: { variant: "warning", label: "To mark" },
  missing: { variant: "danger" },
  low: { variant: "info" },
  medium: { variant: "warning" },
  high: { variant: "danger" },
  exceeding: { variant: "success" },
  meeting: { variant: "info" },
  approaching: { variant: "warning" },
  beginning: { variant: "danger" },
  not_assessed: { variant: "neutral", label: "Not assessed" },
  paused: { variant: "neutral" },
  archived: { variant: "neutral" },
  taught: { variant: "success" },
  assigned: { variant: "info" },
  skipped: { variant: "neutral" },
  cancelled: { variant: "danger" },
};

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, variant, showIcon = true, className }: StatusBadgeProps) {
  const mapped = statusMap[status];
  const resolvedVariant = variant || mapped?.variant || "neutral";
  const label = mapped?.label || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  const Icon = variantIcons[resolvedVariant];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[12px] font-medium px-2 py-0.5",
        variantStyles[resolvedVariant],
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      {label}
    </Badge>
  );
}
