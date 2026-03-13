"use client";

import { useMemo, useState } from "react";
import { BarChart3, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import { filterStudentAnalytics, getAdminProgrammeOptions, getSelectedStudent } from "@/features/admin/lib/admin-selectors";
import { AdminDetailDrawer, AdminKpiCard, AdminMetricBar, AdminPanel, AdminRowLink, AdminToneBadge } from "@/features/admin/components/admin-ui";
import type { AdminProgramme } from "@/features/admin/data/admin-types";

const PERFORMANCE_ICONS = {
  "metric-mastery": BarChart3,
  "metric-watchlist": Sparkles,
  "metric-release": Download,
  "metric-reports": Sparkles,
} as const;

export default function AdminPerformancePage() {
  const [programme, setProgramme] = useState<AdminProgramme>("All");
  const [studentQuery, setStudentQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const studentRows = filterStudentAnalytics(programme, studentQuery, riskFilter);
  const selectedStudent = getSelectedStudent(selectedStudentId);

  const selectedStudentTrend = useMemo(() => {
    if (!selectedStudent) return [];
    const base = Math.max(68, selectedStudent.mastery - 6);
    return [
      { label: "Week 1", value: base },
      { label: "Week 2", value: base + 2 },
      { label: "Week 3", value: base + (selectedStudent.risk === "High" ? -1 : 3) },
      { label: "Week 4", value: selectedStudent.mastery },
    ];
  }, [selectedStudent]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance oversight"
        description="School-level performance dashboards, student analytics, mastery tracking, and oversight of gradebooks and reporting readiness."
        primaryAction={{
          label: "Prepare dean summary",
          onClick: () => toast.success("Dean summary prepared with the current filters"),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <Select value={programme} onValueChange={(value) => setProgramme(value as AdminProgramme)}>
            <SelectTrigger className="h-9 w-[140px] bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getAdminProgrammeOptions().map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <Tabs defaultValue="school" className="space-y-4">
        <TabsList>
          <TabsTrigger value="school">School</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="mastery">Mastery</TabsTrigger>
          <TabsTrigger value="reports">Reports &amp; gradebooks</TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            {adminDemoData.performance.schoolMetrics.map((metric) => {
              const Icon = PERFORMANCE_ICONS[metric.id as keyof typeof PERFORMANCE_ICONS];
              return (
                <AdminKpiCard
                  key={metric.id}
                  label={metric.label}
                  value={metric.value}
                  detail={metric.detail}
                  delta={metric.delta}
                  tone={metric.tone}
                  icon={Icon}
                />
              );
            })}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
            <AdminPanel title="Programme comparison trend" description="A calm school-level comparison rather than a cold BI surface.">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adminDemoData.performance.comparisonTrend} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
                    <XAxis dataKey="term" stroke="#8a94a6" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[70, 90]} stroke="#8a94a6" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="PYP" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="MYP" stroke="#c24e3f" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="DP" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>
            <AdminPanel title="Leadership takeaways" description="What a dean or head of school would pull from this view.">
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
                  <p className="text-[13px] leading-6 text-muted-foreground">
                    MYP remains the largest performance management opportunity: more students, more grading volume, and the clearest release timing inconsistencies.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[13px] leading-6 text-muted-foreground">
                    DP is academically strong overall, but the portal makes milestone communication and report readiness more legible than raw grades alone.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[13px] leading-6 text-muted-foreground">
                    PYP stays present as a summary layer with attendance, agency, and family communication signals rather than planner-heavy detail.
                  </p>
                </div>
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              value={studentQuery}
              onChange={(event) => setStudentQuery(event.target.value)}
              placeholder="Search students, homerooms, or communication flags"
              className="h-9 max-w-[320px] bg-white text-[13px]"
            />
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="h-9 w-[180px] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk levels</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="spotlight">Spotlight</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AdminPanel title="Individual student analytics" description="A leadership watchlist table plus a holistic drawer, not a full student information system.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Mastery</TableHead>
                  <TableHead>Report status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentRows.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="whitespace-normal">
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-[12px] text-muted-foreground">{student.gradeBand} · {student.homeroom}</p>
                      </div>
                    </TableCell>
                    <TableCell>{student.programme}</TableCell>
                    <TableCell>{student.attendance}%</TableCell>
                    <TableCell>{student.mastery}%</TableCell>
                    <TableCell>{student.latestReportStatus}</TableCell>
                    <TableCell>{student.gradingVisibility}</TableCell>
                    <TableCell><AdminToneBadge tone={student.tone}>{student.risk}</AdminToneBadge></TableCell>
                    <TableCell className="text-right">
                      <AdminRowLink label="Open" onClick={() => setSelectedStudentId(student.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="mastery" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
            <AdminPanel title="Standards and criteria mastery" description="A programme-aware mastery layer with strong MYP and DP visibility plus a lighter PYP summary.">
              <div className="space-y-4">
                {adminDemoData.performance.mastery
                  .filter((row) => programme === "All" || row.programme === programme)
                  .map((row) => (
                    <div key={row.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{row.strand}</p>
                          <p className="text-[12px] text-muted-foreground">{row.programme} · {row.framework}</p>
                        </div>
                        <AdminToneBadge tone={row.tone}>{row.mastery}% mastery</AdminToneBadge>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <AdminMetricBar label="On track" value={row.onTrack} tone="success" />
                        <AdminMetricBar label="Watch" value={row.watch} tone="warning" />
                        <AdminMetricBar label="Intervention" value={row.intervention} tone="danger" />
                      </div>
                    </div>
                  ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Mastery reading guide" description="This is intentionally a leadership reading surface, not a full standards database.">
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
                  <p className="text-[14px] font-medium text-foreground">MYP criteria remain the clearest admin story.</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Criterion B in sciences is the main school-wide quality signal. That aligns well with the curriculum page and the gradebook oversight table.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[14px] font-medium text-foreground">DP is most useful as a pacing and milestone story.</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Course performance is healthy, but leadership wants clearer milestone spacing in Math AA HL and cleaner family communication around IA checkpoints.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[14px] font-medium text-foreground">PYP stays visible without overbuilding.</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Agency, reflection, and family-safe evidence coverage are more valuable than trying to force a standards-heavy mastery model into the admin demo.
                  </p>
                </div>
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <AdminPanel title="Report oversight" description="Cycle readiness and distribution confidence by programme.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Ready</TableHead>
                    <TableHead>Distributed</TableHead>
                    <TableHead>At risk</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminDemoData.performance.reports
                    .filter((row) => programme === "All" || row.programme === programme)
                    .map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-medium text-foreground">{row.cycle}</p>
                            <p className="text-[12px] text-muted-foreground">{row.dueDate} · {row.owner}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.programme}</TableCell>
                        <TableCell>{row.readyPercent}%</TableCell>
                        <TableCell>{row.distributedPercent}%</TableCell>
                        <TableCell>{row.atRisk}</TableCell>
                        <TableCell><AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Gradebook oversight" description="Marked, missing, and unreleased grading signals by class.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Unreleased</TableHead>
                    <TableHead>Missing</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminDemoData.performance.gradebooks
                    .filter((row) => programme === "All" || row.programme === programme)
                    .map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-medium text-foreground">{row.className}</p>
                            <p className="text-[12px] text-muted-foreground">{row.programme} · {row.turnaround}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.teacher}</TableCell>
                        <TableCell>{row.completion}%</TableCell>
                        <TableCell>{row.unreleased}</TableCell>
                        <TableCell>{row.missing}</TableCell>
                        <TableCell><AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </AdminPanel>
          </div>
        </TabsContent>
      </Tabs>

      <AdminDetailDrawer
        open={Boolean(selectedStudent)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null);
        }}
        title={selectedStudent?.name ?? "Student preview"}
        description={selectedStudent ? `${selectedStudent.programme} · ${selectedStudent.gradeBand}` : undefined}
        primaryLabel="Flag for dean review"
        secondaryLabel="Share summary"
        onPrimary={() => toast.success("Student added to the dean watchlist in the demo")}
        onSecondary={() => toast.message("Holistic student summary copied into the demo briefing")}
      >
        {selectedStudent ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Attendance</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedStudent.attendance}%</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Mastery</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedStudent.mastery}%</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Risk</p>
                <div className="mt-2">
                  <AdminToneBadge tone={selectedStudent.tone}>{selectedStudent.risk}</AdminToneBadge>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Latest trend</p>
              <div className="mt-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedStudentTrend}>
                    <XAxis dataKey="label" stroke="#8a94a6" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[60, 95]} stroke="#8a94a6" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#c24e3f" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">What the student probably sees</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedStudent.studentPreview}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">What the family probably sees</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedStudent.parentPreview}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Leadership note</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedStudent.supportNote}</p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
