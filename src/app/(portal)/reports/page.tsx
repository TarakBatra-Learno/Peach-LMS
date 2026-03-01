"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LayoutTemplate, CalendarRange } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function ReportsPage() {
  const loading = useMockLoading();
  const reportCycles = useStore((s) => s.reportCycles);
  const reportTemplates = useStore((s) => s.reportTemplates);
  const classes = useStore((s) => s.classes);

  // Sort & filter state for report cycles
  const [cycleSort, setCycleSort] = useState("name");
  const [cycleStatusFilter, setCycleStatusFilter] = useState("all");
  const [cycleYearFilter, setCycleYearFilter] = useState("all");

  // Derive unique academic years from cycles
  const academicYears = useMemo(() => {
    const years = new Set(reportCycles.map((c) => c.academicYear));
    return Array.from(years).sort();
  }, [reportCycles]);

  // Filtered & sorted report cycles
  const filteredCycles = useMemo(() => {
    let result = [...reportCycles];
    if (cycleStatusFilter !== "all") {
      result = result.filter((c) => c.status === cycleStatusFilter);
    }
    if (cycleYearFilter !== "all") {
      result = result.filter((c) => c.academicYear === cycleYearFilter);
    }
    result.sort((a, b) => {
      switch (cycleSort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "startDate":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case "endDate":
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case "status": {
          const order: Record<string, number> = { open: 0, closing: 1, closed: 2 };
          return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        }
        default:
          return 0;
      }
    });
    return result;
  }, [reportCycles, cycleStatusFilter, cycleYearFilter, cycleSort]);

  if (loading)
    return (
      <>
        <PageHeader title="Reports" />
        <CardGridSkeleton count={4} />
      </>
    );

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Manage report cycles, templates, and student reports"
      />

      <Tabs defaultValue="cycles" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="cycles">Report Cycles</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* ── Report Cycles ── */}
        <TabsContent value="cycles">
          <FilterBar
            filters={[
              {
                key: "sort",
                label: "Sort by",
                options: [
                  { value: "name", label: "Name" },
                  { value: "startDate", label: "Start date" },
                  { value: "endDate", label: "End date" },
                  { value: "status", label: "Status" },
                ],
                value: cycleSort,
                onChange: setCycleSort,
              },
              {
                key: "status",
                label: "Status",
                options: [
                  { value: "all", label: "All statuses" },
                  { value: "open", label: "Open" },
                  { value: "closing", label: "Closing" },
                  { value: "closed", label: "Closed" },
                ],
                value: cycleStatusFilter,
                onChange: setCycleStatusFilter,
              },
              {
                key: "year",
                label: "Academic year",
                options: [
                  { value: "all", label: "All years" },
                  ...academicYears.map((y) => ({ value: y, label: y })),
                ],
                value: cycleYearFilter,
                onChange: setCycleYearFilter,
              },
            ]}
          />
          {filteredCycles.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="No report cycles"
              description={reportCycles.length === 0 ? "Report cycles will appear here once configured." : "No cycles match your current filters."}
            />
          ) : (
            <div className="space-y-2">
              {filteredCycles.map((cycle) => {
                const cycleClasses = classes.filter((c) =>
                  cycle.classIds.includes(c.id)
                );
                return (
                  <Link
                    key={cycle.id}
                    href={`/reports/cycles/${cycle.id}`}
                  >
                    <Card className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:border-border/80 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[14px] font-medium">
                              {cycle.name}
                            </p>
                            <StatusBadge status={cycle.status} />
                          </div>
                          <p className="text-[12px] text-muted-foreground">
                            {cycle.term} &middot; {cycle.academicYear}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-[12px] text-muted-foreground shrink-0">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {cycleClasses.length} class
                            {cycleClasses.length !== 1 && "es"}
                          </span>
                          <span>
                            {format(parseISO(cycle.startDate), "MMM d")} -{" "}
                            {format(parseISO(cycle.endDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Templates ── */}
        <TabsContent value="templates">
          {reportTemplates.length === 0 ? (
            <EmptyState
              icon={LayoutTemplate}
              title="No templates"
              description="Report templates will appear here once created."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map((template) => (
                <Card key={template.id} className="p-5 gap-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-[14px] font-semibold">
                      {template.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[11px] shrink-0"
                    >
                      {template.programme}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    <span>
                      {template.sections.length} section
                      {template.sections.length !== 1 && "s"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.sections.slice(0, 4).map((section) => (
                      <Badge
                        key={section.id}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {section.label}
                      </Badge>
                    ))}
                    {template.sections.length > 4 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px]"
                      >
                        +{template.sections.length - 4} more
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
