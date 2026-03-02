"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OPERATIONS_TABS } from "@/lib/constants";

export function OperationsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 mb-6 border-b border-border">
      {OPERATIONS_TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors",
            pathname === t.href
              ? "border-[#c24e3f] text-[#c24e3f]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
