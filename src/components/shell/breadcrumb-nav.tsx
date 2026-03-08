"use client";

import { usePathname, useSearchParams } from "next/navigation";
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

const OPERATIONS_SUBPAGES = new Set(["attendance", "calendar", "timetable", "compliance"]);

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface BreadcrumbEntry {
  label: string;
  href: string;
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

    // Skip operations sub-page slug — OperationsTabs already shows which sub-page is active
    if (prevSegment === "operations" && OPERATIONS_SUBPAGES.has(segment)) {
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

    // "cycles" segment under reports — skip it; the cycle name breadcrumb is sufficient
    // (the "Reports" entry already links back to the reports page)
    if (segment === "cycles" && segments[i - 1] === "reports") {
      continue;
    }

    // Skip the "students" segment — it has no index route (/students 404s).
    // The student name is handled above when prevSegment === "students".
    if (segment === "students") {
      continue;
    }

    // Default: capitalize the segment name
    entries.push({ label: capitalize(segment), href });
  }

  // When ?classId is present, inject class hierarchy breadcrumbs
  // Pattern: replace the list-page entry ("Assessments"/"Reports") with Classes > ClassName
  const contextClassId = searchParams.get("classId");

  // /students/{id}?classId= → Home > Classes > ClassName > StudentName
  if (pathname.startsWith("/students/") && contextClassId) {
    const cls = classes.find((c) => c.id === contextClassId);
    const studentIdx = entries.findIndex((e) => e.href.startsWith("/students/"));
    if (studentIdx !== -1) {
      entries.splice(studentIdx, 0,
        { label: "Classes", href: "/classes" },
        { label: cls?.name ?? contextClassId, href: `/classes/${contextClassId}` },
      );
    }
  }

  // /assessments/{id}?classId= → Home > Classes > ClassName > AssessmentTitle
  if (pathname.startsWith("/assessments/") && contextClassId) {
    const cls = classes.find((c) => c.id === contextClassId);
    const asmtIdx = entries.findIndex((e) => e.href.startsWith("/assessments"));
    if (asmtIdx !== -1) {
      // Remove the "Assessments" list-page entry if it exists
      if (entries[asmtIdx].label === "Assessments") {
        entries.splice(asmtIdx, 1,
          { label: "Classes", href: "/classes" },
          { label: cls?.name ?? contextClassId, href: `/classes/${contextClassId}?tab=assessments` },
        );
      } else {
        // It's the assessment detail entry directly — just prepend class hierarchy
        entries.splice(asmtIdx, 0,
          { label: "Classes", href: "/classes" },
          { label: cls?.name ?? contextClassId, href: `/classes/${contextClassId}?tab=assessments` },
        );
      }
    }
  }

  // /reports/{id}?cycleId= → Home > Reports > CycleName > Report - StudentName
  const contextCycleId = searchParams.get("cycleId");
  if (pathname.match(/^\/reports\/[^/]+$/) && contextCycleId && !pathname.includes("cycles")) {
    const cycle = reportCycles.find((c) => c.id === contextCycleId);
    if (cycle) {
      const rptIdx = entries.findIndex((e) => e.href.startsWith("/reports"));
      if (rptIdx !== -1) {
        // Replace "Reports" entry with Reports > CycleName hierarchy
        if (entries[rptIdx].label === "Reports") {
          entries.splice(rptIdx + 1, 0,
            { label: cycle.name, href: `/reports/cycles/${cycle.id}` },
          );
        } else {
          // It's the report detail entry — insert Reports + CycleName before it
          entries.splice(rptIdx, 0,
            { label: cycle.name, href: `/reports/cycles/${cycle.id}` },
          );
        }
      }
    }
  }

  // /reports/{id}?classId= → Home > Classes > ClassName > Report - StudentName
  // (only if no cycleId context — cycleId takes priority)
  if (pathname.match(/^\/reports\/[^/]+$/) && contextClassId && !contextCycleId && !pathname.includes("cycles")) {
    const cls = classes.find((c) => c.id === contextClassId);
    const rptIdx = entries.findIndex((e) => e.href.startsWith("/reports"));
    if (rptIdx !== -1) {
      // Remove the "Reports" list-page entry if it exists
      if (entries[rptIdx].label === "Reports") {
        entries.splice(rptIdx, 1,
          { label: "Classes", href: "/classes" },
          { label: cls?.name ?? contextClassId, href: `/classes/${contextClassId}?tab=reports` },
        );
      } else {
        entries.splice(rptIdx, 0,
          { label: "Classes", href: "/classes" },
          { label: cls?.name ?? contextClassId, href: `/classes/${contextClassId}?tab=reports` },
        );
      }
    }
  }

  // Inject student context breadcrumb when navigating from a student profile
  // via query params (e.g., /assessments/abc?studentId=stu_01 or /portfolio?studentId=stu_01)
  const contextStudentId = searchParams.get("studentId");
  if (contextStudentId) {
    const student = students.find((s) => s.id === contextStudentId);
    if (student) {
      entries.unshift({
        label: `${student.firstName} ${student.lastName}`,
        href: `/students/${contextStudentId}`,
      });
    }
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
