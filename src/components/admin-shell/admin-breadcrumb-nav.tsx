"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  overview: "Overview",
  classes: "Classes",
  students: "Students",
  curriculum: "Curriculum",
  performance: "Performance",
  communications: "Communications",
  operations: "Operations",
  platform: "Platform",
  assessments: "Assessments",
  reports: "Reports",
};

export function AdminBreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-[12px] text-muted-foreground">
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = SEGMENT_LABELS[segment] ?? segment;
        const isLast = index === segments.length - 1;
        return (
          <div key={href} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="transition-colors hover:text-foreground">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
