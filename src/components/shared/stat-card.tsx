"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down" | "flat"; label: string };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, trend, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("p-4 gap-0", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <div className="rounded-lg bg-muted p-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="text-[24px] font-semibold text-foreground leading-tight">{value}</div>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          {trend.direction === "up" && <TrendingUp className="h-3.5 w-3.5 text-[#16a34a]" />}
          {trend.direction === "down" && <TrendingDown className="h-3.5 w-3.5 text-[#dc2626]" />}
          {trend.direction === "flat" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
          <span
            className={cn(
              "text-[12px] font-medium",
              trend.direction === "up" && "text-[#16a34a]",
              trend.direction === "down" && "text-[#dc2626]",
              trend.direction === "flat" && "text-muted-foreground"
            )}
          >
            {trend.label}
          </span>
        </div>
      )}
    </Card>
  );
}
