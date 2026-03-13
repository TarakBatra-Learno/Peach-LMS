"use client";

import { Card } from "@/components/ui/card";
import {
  ClipboardList,
  CalendarClock,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface StatCardsProps {
  toMark: number;
  dueToday: number;
  readyToRelease: number;
  reportsDue: number;
}

const STATS_CONFIG = [
  {
    key: "toMark",
    label: "To Mark",
    icon: ClipboardList,
    bg: "bg-[#fff2f0]",
    border: "border-[#ffc1b7]",
    text: "text-[#c24e3f]",
  },
  {
    key: "dueToday",
    label: "Due Today",
    icon: CalendarClock,
    bg: "bg-[#dbeafe]",
    border: "border-[#93c5fd]",
    text: "text-[#2563eb]",
  },
  {
    key: "readyToRelease",
    label: "Ready to Release",
    icon: CheckCircle2,
    bg: "bg-[#dcfce7]",
    border: "border-[#86efac]",
    text: "text-[#16a34a]",
  },
  {
    key: "reportsDue",
    label: "Reports Due",
    icon: FileText,
    bg: "bg-[#fef3c7]",
    border: "border-[#fcd34d]",
    text: "text-[#b45309]",
  },
] as const;

export function StatCards({ toMark, dueToday, readyToRelease, reportsDue }: StatCardsProps) {
  const values: Record<string, number> = {
    toMark,
    dueToday,
    readyToRelease,
    reportsDue,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS_CONFIG.map((stat) => {
        const Icon = stat.icon;
        const value = values[stat.key];
        return (
          <Card
            key={stat.key}
            className={`${stat.bg} ${stat.border} border p-3 gap-0`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[22px] font-bold ${stat.text}`}>
                  {value}
                </p>
                <p className={`text-[11px] font-medium ${stat.text} opacity-80`}>
                  {stat.label}
                </p>
              </div>
              <Icon className={`h-5 w-5 ${stat.text} opacity-40`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
