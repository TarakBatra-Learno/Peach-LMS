"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AdminTone } from "@/features/admin/data/admin-types";

export function getAdminToneClasses(tone: AdminTone) {
  switch (tone) {
    case "success":
      return "border-[#b8e3c9] bg-[#f3fbf6] text-[#137a3d]";
    case "warning":
      return "border-[#f5d58a] bg-[#fff8e8] text-[#a76b00]";
    case "danger":
      return "border-[#f1b8b2] bg-[#fff3f1] text-[#b9382d]";
    case "info":
      return "border-[#bfd3f8] bg-[#f3f7ff] text-[#285db6]";
    case "peach":
      return "border-[#ffc1b7] bg-[#fff2f0] text-[#b9483a]";
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}

export function AdminToneBadge({
  tone,
  children,
  className,
}: {
  tone: AdminTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("rounded-full border text-[11px] font-medium", getAdminToneClasses(tone), className)}>
      {children}
    </Badge>
  );
}

export function AdminKpiCard({
  label,
  value,
  detail,
  delta,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  delta: string;
  tone: AdminTone;
  icon?: LucideIcon;
}) {
  return (
    <Card className="gap-0 border-border/80 bg-white/95 p-4 shadow-1">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        {Icon ? (
          <div className={cn("rounded-2xl border p-2.5", getAdminToneClasses(tone))}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <p className="text-[12px] text-muted-foreground">{detail}</p>
      <div className="mt-3 flex items-center justify-between">
        <AdminToneBadge tone={tone}>{delta}</AdminToneBadge>
      </div>
    </Card>
  );
}

export function AdminPanel({
  title,
  description,
  actionLabel,
  onAction,
  children,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 border-border/80 bg-white/95 p-5 shadow-1", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-[13px] text-muted-foreground">{description}</p> : null}
        </div>
        {actionLabel && onAction ? (
          <Button variant="outline" size="sm" onClick={onAction} className="shrink-0">
            {actionLabel}
          </Button>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

export function AdminMetricBar({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper?: string;
  tone: AdminTone;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-4 text-[13px]">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className={cn("h-2 rounded-full", tone === "danger" ? "bg-[#d85a4a]" : tone === "warning" ? "bg-[#f2b94b]" : tone === "success" ? "bg-[#16a34a]" : tone === "info" ? "bg-[#2563eb]" : "bg-[#c24e3f]")} style={{ width: `${value}%` }} />
      </div>
      {helper ? <p className="text-[12px] text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function AdminUtilityBar({
  children,
  actions,
  className,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[18px] border border-border/80 bg-[#fcfcfd] px-4 py-3 shadow-1 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminMiniStat({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: AdminTone;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <AdminToneBadge tone={tone}>{value}</AdminToneBadge>
      </div>
      {helper ? <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function AdminListItem({
  title,
  body,
  meta,
  tone,
  onClick,
}: {
  title: string;
  body: string;
  meta: string;
  tone: AdminTone;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border/80 bg-white px-4 py-3 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-medium text-foreground">{title}</p>
            <AdminToneBadge tone={tone}>{meta}</AdminToneBadge>
          </div>
          <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{body}</p>
        </div>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </button>
  );
}

export function AdminDetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle className="text-[20px] tracking-tight">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        {children}
        {(primaryLabel || secondaryLabel) && (
          <SheetFooter className="border-t border-border/80 pt-4">
            {secondaryLabel && onSecondary ? (
              <Button variant="outline" onClick={onSecondary}>
                {secondaryLabel}
              </Button>
            ) : null}
            {primaryLabel && onPrimary ? (
              <Button onClick={onPrimary}>
                {primaryLabel}
              </Button>
            ) : null}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function AdminPortalPreview({
  title,
  subtitle,
  accentLabel,
}: {
  title: string;
  subtitle: string;
  accentLabel: string;
}) {
  return (
    <div className="rounded-[22px] border border-border/80 bg-[#fcfcfd] p-4 shadow-1">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[16px] font-bold tracking-tight text-[#c24e3f]">Peach</span>
        <Badge variant="outline" className="text-[10px]">Preview</Badge>
      </div>
      <p className="text-[14px] font-semibold tracking-tight text-foreground">{title}</p>
      <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{subtitle}</p>
      <div className="mt-4 rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#b9483a]">{accentLabel}</p>
      </div>
    </div>
  );
}

export function AdminRowLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" size="sm" className="h-8 px-2 text-[#c24e3f]" onClick={onClick}>
      {label}
      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
    </Button>
  );
}
