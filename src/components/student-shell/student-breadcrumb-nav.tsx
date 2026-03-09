"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/stores";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface BreadcrumbEntry {
  label: string;
  href: string;
}

export function StudentBreadcrumbNav() {
  const pathname = usePathname();
  const classes = useStore((s) => s.classes);
  const assessments = useStore((s) => s.assessments);

  // Don't render breadcrumbs on student home
  if (pathname === "/student/home") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  // segments: ["student", "classes", "CLS_01", ...]

  const entries: BreadcrumbEntry[] = [];

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const prevSegment = i > 0 ? segments[i] : null;
    const parentSegment = i > 1 ? segments[i - 1] : null;
    const href = "/" + segments.slice(0, i + 1).join("/");

    // Dynamic class ID
    if (parentSegment === "classes" && segment !== "classes") {
      const cls = classes.find((c) => c.id === segment);
      if (cls) {
        entries.push({ label: cls.name, href });
        continue;
      }
    }

    // Dynamic assessment ID
    if (parentSegment === "assessments" && segment !== "assessments") {
      const asmt = assessments.find((a) => a.id === segment);
      entries.push({ label: asmt?.title ?? "Assessment", href });
      continue;
    }

    // Friendly labels for known segments
    const labelMap: Record<string, string> = {
      classes: "My Classes",
      calendar: "Calendar",
      messages: "Messages",
      portfolio: "Portfolio",
      progress: "Progress",
      reports: "Reports",
      assessments: "Assessments",
    };

    entries.push({ label: labelMap[segment] || capitalize(segment), href });
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/student/home">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1;

          return (
            <span key={`${index}-${entry.href}`} className="inline-flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{entry.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={entry.href}>{entry.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
