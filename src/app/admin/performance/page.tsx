"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import {
  filterStudentAnalytics,
  getAdminProgrammeOptions,
  getSelectedStudent,
} from "@/features/admin/lib/admin-selectors";
import {
  AdminDetailDrawer,
  AdminKpiCard,
  AdminMiniStat,
  AdminPanel,
  AdminRowLink,
  AdminToneBadge,
  AdminUtilityBar,
} from "@/features/admin/components/admin-ui";
import type { AdminProgramme } from "@/features/admin/data/admin-types";
import { useStore } from "@/stores";
import { getAdminStudentWorkspaceHref } from "@/lib/admin-embed-routes";

const PERFORMANCE_ICONS = {
  "metric-mastery": BarChart3,
  "metric-watchlist": Sparkles,
  "metric-release": Download,
  "metric-reports": Sparkles,
} as const;

const YEAR_GROUP_SUMMARIES = [
  { id: "year-pyp-4", label: "Grade 4", programme: "PYP", students: 86, onTrack: 82, flaggedClasses: 1, reportReady: 88, tone: "success" as const },
  { id: "year-myp-4", label: "MYP 4", programme: "MYP", students: 94, onTrack: 77, flaggedClasses: 2, reportReady: 71, tone: "warning" as const },
  { id: "year-myp-5", label: "MYP 5", programme: "MYP", students: 97, onTrack: 74, flaggedClasses: 3, reportReady: 68, tone: "warning" as const },
  { id: "year-dp-1", label: "DP 1", programme: "DP", students: 71, onTrack: 84, flaggedClasses: 1, reportReady: 79, tone: "info" as const },
  { id: "year-dp-2", label: "DP 2", programme: "DP", students: 73, onTrack: 81, flaggedClasses: 1, reportReady: 82, tone: "success" as const },
] as const;

const REPORT_WORKFLOW_ROWS = [
  { id: "workflow-myp-t2", cycle: "MYP Term 2", programme: "MYP", deadline: "Mar 22", pending: 26, ready: 18, locked: 7, shared: 0, excluded: 2, tone: "warning" as const },
  { id: "workflow-dp-t2", cycle: "DP Term 2", programme: "DP", deadline: "Mar 25", pending: 12, ready: 10, locked: 4, shared: 0, excluded: 1, tone: "info" as const },
  { id: "workflow-pyp-t2", cycle: "PYP learning narrative", programme: "PYP", deadline: "Mar 18", pending: 8, ready: 14, locked: 6, shared: 3, excluded: 0, tone: "success" as const },
] as const;

const GRADEBOOK_CONFIG_ROWS = [
  { id: "config-myp", scope: "MYP subject classes", gradingScale: "Criteria + released results", releaseRule: "Teacher marks ready, then publishes per student", calculation: "Released evidence only", tone: "info" as const },
  { id: "config-dp", scope: "DP courses", gradingScale: "Course grades + milestone visibility", releaseRule: "Teacher release with family-safe gating", calculation: "Assessment mix by course", tone: "success" as const },
  { id: "config-pyp", scope: "PYP homeroom", gradingScale: "Narrative and evidence-first", releaseRule: "Narrative publishing only", calculation: "No score-first aggregation", tone: "peach" as const },
] as const;

export default function AdminPerformancePage() {
  const router = useRouter();
  const liveStudents = useStore((store) => store.students);
  const [programme, setProgramme] = useState<AdminProgramme>("All");
  const [studentQuery, setStudentQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("term-2");
  const [gradebookView, setGradebookView] = useState<"class" | "student">("class");
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

  const yearRows = YEAR_GROUP_SUMMARIES.filter(
    (row) => programme === "All" || row.programme === programme,
  );
  const reportRows = REPORT_WORKFLOW_ROWS.filter(
    (row) => programme === "All" || row.programme === programme,
  );
  const gradebookRows = adminDemoData.performance.gradebooks.filter(
    (row) => programme === "All" || row.programme === programme,
  );
  const ongoingReports = adminDemoData.performance.reports.filter(
    (row) => (programme === "All" || row.programme === programme) && row.status !== "Distributed",
  );
  const previousReports = adminDemoData.performance.reports.filter(
    (row) => (programme === "All" || row.programme === programme) && row.status === "Distributed",
  );

  const matchedLiveStudent = selectedStudent
    ? liveStudents.find(
        (student) => `${student.firstName} ${student.lastName}`.toLowerCase() === selectedStudent.name.toLowerCase(),
      ) ?? null
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance oversight"
        description="A school-wide academic oversight module for year-group performance, gradebook readiness, standards mastery, report workflow, and student drill-down."
        primaryAction={{
          label: "Prepare dean summary",
          onClick: () => toast.success("Dean summary prepared with the current filters"),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">School-wide academic oversight</AdminToneBadge>
          <AdminToneBadge tone="info">Year-group and class drill paths</AdminToneBadge>
          <AdminToneBadge tone="warning">Student drill-in uses the live profile</AdminToneBadge>
        </div>
      </PageHeader>

      <AdminUtilityBar>
        <Select value={programme} onValueChange={(value) => setProgramme(value as AdminProgramme)}>
          <SelectTrigger className="h-9 w-[140px] bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAdminProgrammeOptions().map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="h-9 w-[170px] bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="term-2">Term 2</SelectItem>
            <SelectItem value="term-1">Term 1</SelectItem>
            <SelectItem value="year-to-date">Year to date</SelectItem>
          </SelectContent>
        </Select>
      </AdminUtilityBar>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-[18px] border border-border/80 bg-[#fcfcfd] p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <AdminPanel title="Year-group performance overview" description="Start at year-group scale, then move into class readiness and student drill-down.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {yearRows.map((row) => (
                  <div key={row.id} className="rounded-[20px] border border-border/80 bg-white p-4 shadow-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">{row.programme}</p>
                        <p className="mt-2 text-[16px] font-semibold tracking-tight text-foreground">{row.label}</p>
                      </div>
                      <AdminToneBadge tone={row.tone}>{row.students} students</AdminToneBadge>
                    </div>
                    <div className="mt-4 space-y-3">
                      <AdminMiniStat label="On track" value={`${row.onTrack}%`} helper={`${row.flaggedClasses} flagged classes`} tone={row.tone} />
                      <AdminMiniStat label="Report readiness" value={`${row.reportReady}%`} helper={`Current period: ${periodFilter.replace("-", " ")}`} tone={row.reportReady < 75 ? "warning" : "success"} />
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Flagged classes and cohorts" description="A clear next-step view for coordinators and deans.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Unreleased</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradebookRows.slice(0, 5).map((row) => (
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
                      <TableCell><AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="gradebook" className="space-y-4">
          <AdminUtilityBar>
            <Tabs value={gradebookView} onValueChange={(value) => setGradebookView(value as "class" | "student")}>
              <TabsList>
                <TabsTrigger value="class">Class view</TabsTrigger>
                <TabsTrigger value="student">Student view</TabsTrigger>
              </TabsList>
            </Tabs>
          </AdminUtilityBar>

          <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
            <AdminPanel title="Gradebook oversight" description="A year-group entry layer with class and student perspectives rather than a chart-only surface.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{gradebookView === "class" ? "Class" : "Student / class"}</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Unreleased</TableHead>
                    <TableHead>Missing</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradebookView === "class"
                    ? gradebookRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-normal">
                            <div>
                              <p className="font-medium text-foreground">{row.className}</p>
                              <p className="text-[12px] text-muted-foreground">{row.teacher}</p>
                            </div>
                          </TableCell>
                          <TableCell>{row.completion}%</TableCell>
                          <TableCell>{row.unreleased}</TableCell>
                          <TableCell>{row.missing}</TableCell>
                          <TableCell><AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge></TableCell>
                        </TableRow>
                      ))
                    : studentRows.slice(0, 6).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-normal">
                            <div>
                              <p className="font-medium text-foreground">{row.name}</p>
                              <p className="text-[12px] text-muted-foreground">{row.homeroom}</p>
                            </div>
                          </TableCell>
                          <TableCell>{row.mastery}%</TableCell>
                          <TableCell>{row.gradingVisibility}</TableCell>
                          <TableCell>{row.latestReportStatus}</TableCell>
                          <TableCell><AdminToneBadge tone={row.tone}>{row.risk}</AdminToneBadge></TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Grading configuration summary" description="A read-only admin reference surface for how grading behaves by programme.">
              <div className="space-y-3">
                {GRADEBOOK_CONFIG_ROWS
                  .filter((row) => programme === "All" || row.scope.includes(programme))
                  .map((row) => (
                    <div key={row.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-medium text-foreground">{row.scope}</p>
                        <AdminToneBadge tone={row.tone}>{row.gradingScale}</AdminToneBadge>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{row.releaseRule}</p>
                      <p className="mt-2 text-[12px] text-muted-foreground">{row.calculation}</p>
                    </div>
                  ))}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
            <AdminPanel title="Standards mastery tracking" description="Group standards and criteria into readable frameworks instead of turning this into a heavy analytics tool.">
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
                        <AdminMiniStat label="On track" value={`${row.onTrack}%`} tone="success" />
                        <AdminMiniStat label="Watch" value={`${row.watch}%`} tone="warning" />
                        <AdminMiniStat label="Intervention" value={`${row.intervention}%`} tone="danger" />
                      </div>
                    </div>
                  ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Framework reading guide" description="The admin value here is framework oversight and teaching quality signals, not raw standards authoring.">
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
                  <p className="text-[14px] font-medium text-foreground">MYP criteria are the strongest school-wide story.</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Criterion B in sciences continues to be the clearest signal across curriculum, gradebook, and reporting oversight.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[14px] font-medium text-foreground">DP is best read as pacing plus milestone quality.</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Course performance remains healthy overall, but leadership wants tighter milestone communication in Math AA HL and English coursework.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[14px] font-medium text-foreground">PYP stays intentionally lighter.</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Agency, reflection, and evidence coverage matter more here than forcing a score-led mastery model onto PYP.
                  </p>
                </div>
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <AdminPanel title="Ongoing report cycles" description="Report cycles grouped by urgency, deadline, and workflow posture.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Ready</TableHead>
                    <TableHead>Distributed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ongoingReports.map((row) => (
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
                      <TableCell><AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Previous report cycles" description="Keep one previous section visible to prove continuity and workflow history.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Ready</TableHead>
                    <TableHead>Distributed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previousReports.map((row) => (
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
                      <TableCell><AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>
          </div>

          <AdminPanel title="Report workflow matrix" description="A grade-level workflow breakdown with the status states leadership actually needs to scan.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Ready</TableHead>
                  <TableHead>Locked</TableHead>
                  <TableHead>Shared</TableHead>
                  <TableHead>Excluded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-normal">
                      <div>
                        <p className="font-medium text-foreground">{row.cycle}</p>
                        <p className="text-[12px] text-muted-foreground">{row.programme}</p>
                      </div>
                    </TableCell>
                    <TableCell>{row.deadline}</TableCell>
                    <TableCell>{row.pending}</TableCell>
                    <TableCell>{row.ready}</TableCell>
                    <TableCell>{row.locked}</TableCell>
                    <TableCell>{row.shared}</TableCell>
                    <TableCell>{row.excluded}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <AdminUtilityBar>
            <Input
              value={studentQuery}
              onChange={(event) => setStudentQuery(event.target.value)}
              placeholder="Search students, homerooms, or communication flags"
              className="h-9 min-w-[220px] max-w-[320px] bg-white text-[13px]"
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
          </AdminUtilityBar>

          <AdminPanel title="Individual student analytics" description="A leadership watchlist with a preview drawer and a direct path into the live student profile where a real seeded learner exists.">
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
      </Tabs>

      <AdminDetailDrawer
        open={Boolean(selectedStudent)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null);
        }}
        title={selectedStudent?.name ?? "Student preview"}
        description={selectedStudent ? `${selectedStudent.programme} · ${selectedStudent.gradeBand}` : undefined}
        primaryLabel={matchedLiveStudent ? "Open live student profile" : "Flag for dean review"}
        secondaryLabel="Share summary"
        onPrimary={() => {
          if (matchedLiveStudent) {
            router.push(getAdminStudentWorkspaceHref(matchedLiveStudent.id));
            return;
          }
          toast.success("Student added to the dean watchlist in the demo");
        }}
        onSecondary={() => toast.message("Holistic student summary copied into the demo briefing")}
      >
        {selectedStudent ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminMiniStat label="Attendance" value={`${selectedStudent.attendance}%`} tone={selectedStudent.attendance < 94 ? "warning" : "success"} />
              <AdminMiniStat label="Mastery" value={`${selectedStudent.mastery}%`} tone={selectedStudent.tone} />
              <AdminMiniStat label="Risk" value={selectedStudent.risk} tone={selectedStudent.tone} />
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

            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">{selectedStudent.summary}</p>
              <div className="mt-3 space-y-2 text-[13px] text-muted-foreground">
                <p><span className="font-medium text-foreground">Family preview:</span> {selectedStudent.parentPreview}</p>
                <p><span className="font-medium text-foreground">Student preview:</span> {selectedStudent.studentPreview}</p>
                <p><span className="font-medium text-foreground">Support note:</span> {selectedStudent.supportNote}</p>
              </div>
            </div>

            {matchedLiveStudent ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={getAdminStudentWorkspaceHref(matchedLiveStudent.id)}>
                  Open live profile for matched student
                </Link>
              </Button>
            ) : (
              <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
                <p className="text-[13px] leading-6 text-muted-foreground">
                  This record is part of the broader admin demo model. Where a live learner profile exists, the real drill-in remains the live student workspace rather than a duplicate admin analytics page.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
