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

export function BreadcrumbNav() {
  const pathname = usePathname();

  const classes = useStore((s) => s.classes);
  const assessments = useStore((s) => s.assessments);
  const students = useStore((s) => s.students);
  const reports = useStore((s) => s.reports);
  const reportCycles = useStore((s) => s.reportCycles);

  // Don't render breadcrumbs on dashboard (it's the home)
  if (pathname === "/dashboard") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb entries from segments
  const entries: BreadcrumbEntry[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const prevSegment = i > 0 ? segments[i - 1] : null;
    const href = "/" + segments.slice(0, i + 1).join("/");

    // Handle operations sub-pages: /operations/attendance, /operations/calendar, /operations/compliance
    if (segment === "operations") {
      entries.push({ label: "Operations", href: "/operations/attendance" });
      continue;
    }

    // Handle known dynamic ID segments
    if (prevSegment === "classes") {
      const cls = classes.find((c) => c.id === segment);
      entries.push({ label: cls?.name ?? segment, href });
      continue;
    }

    if (prevSegment === "assessments") {
      const asmt = assessments.find((a) => a.id === segment);
      entries.push({ label: asmt?.title ?? segment, href });
      continue;
    }

    if (prevSegment === "students") {
      const student = students.find((s) => s.id === segment);
      entries.push({
        label: student ? `${student.firstName} ${student.lastName}` : segment,
        href,
      });
      continue;
    }

    if (prevSegment === "transcripts") {
      const student = students.find((s) => s.id === segment);
      entries.push({
        label: student ? `${student.firstName} ${student.lastName}` : segment,
        href,
      });
      continue;
    }

    if (prevSegment === "reports" && segment !== "cycles") {
      // /reports/{reportId}
      const report = reports.find((r) => r.id === segment);
      if (report) {
        const student = students.find((s) => s.id === report.studentId);
        entries.push({
          label: student ? `Report - ${student.firstName} ${student.lastName}` : "Report",
          href,
        });
      } else {
        entries.push({ label: "Report", href });
      }
      continue;
    }

    // Handle /reports/cycles/{id}
    if (prevSegment === "cycles") {
      const cycle = reportCycles.find((c) => c.id === segment);
      entries.push({ label: cycle?.name ?? segment, href });
      continue;
    }

    // "cycles" segment under reports
    if (segment === "cycles" && segments[i - 1] === "reports") {
      entries.push({ label: "Cycles", href });
      continue;
    }

    // Default: capitalize the segment name
    entries.push({ label: capitalize(segment), href });
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Home is always first */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1;

          return (
            <span key={entry.href} className="inline-flex items-center gap-1.5">
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
