"use client";

import { useMemo, useState } from "react";
import { Eye, Grid2x2, Layers3, LibraryBig, NotebookTabs, ScrollText } from "lucide-react";
import { toast } from "sonner";
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
import {
  filterCurriculumTeams,
  filterTemplateLibrary,
  getAdminProgrammeOptions,
  getSelectedCurriculumTeam,
  getSelectedTemplate,
} from "@/features/admin/lib/admin-selectors";
import {
  AdminDetailDrawer,
  AdminMiniStat,
  AdminPanel,
  AdminRowLink,
  AdminToneBadge,
  AdminUtilityBar,
} from "@/features/admin/components/admin-ui";
import type { AdminProgramme } from "@/features/admin/data/admin-types";

const SUBJECT_GROUPS = [
  {
    group: "Transdisciplinary learning",
    subjects: ["Transdisciplinary programme"],
  },
  {
    group: "Sciences",
    subjects: ["Sciences"],
  },
  {
    group: "Humanities",
    subjects: ["Individuals and societies"],
  },
  {
    group: "Languages",
    subjects: ["English A: Language & Literature HL"],
  },
  {
    group: "Mathematics",
    subjects: ["Mathematics AA HL"],
  },
] as const;

const CURRICULUM_INSIGHTS = [
  {
    id: "insight-vertical",
    title: "Vertical curriculum spread",
    description: "Trace subject and standards coverage across year levels to spot where strands disappear too early.",
    takeaway: "MYP sciences criterion B coverage is thinner in MYP 4 than MYP 5.",
  },
  {
    id: "insight-horizontal",
    title: "Horizontal planning consistency",
    description: "Compare shared templates, ATL prompts, and assessment reuse across classes in the same band.",
    takeaway: "Grade 10 science sections still diverge in shared lab report structures.",
  },
  {
    id: "insight-family",
    title: "Family-safe curriculum signals",
    description: "Check whether published unit context and evidence cues stay coherent for family-facing visibility.",
    takeaway: "PYP visibility is strong; DP milestone explanations need tighter family language.",
  },
] as const;

const CURRICULUM_STANDARDS = [
  { id: "standards-myp-sci", name: "MYP Sciences criteria", subjectGroup: "Sciences", programme: "MYP", itemCount: 32, updatedAt: "Updated yesterday", status: "Published", tone: "success" as const },
  { id: "standards-myp-atl", name: "MYP ATL skills", subjectGroup: "Whole school", programme: "MYP", itemCount: 20, updatedAt: "Updated this week", status: "Active", tone: "info" as const },
  { id: "standards-dp-course", name: "DP course performance frameworks", subjectGroup: "Diploma courses", programme: "DP", itemCount: 18, updatedAt: "Updated 2 days ago", status: "Healthy", tone: "success" as const },
  { id: "standards-pyp-outcomes", name: "PYP transdisciplinary outcomes", subjectGroup: "Transdisciplinary", programme: "PYP", itemCount: 24, updatedAt: "Needs review", status: "Review due", tone: "warning" as const },
] as const;

const CURRICULUM_POLICIES = [
  { id: "policy-1", title: "Assessment and reporting handbook", audience: "Teachers and coordinators", programme: "Whole school", updatedAt: "Updated 5 days ago", status: "Published", tone: "success" as const },
  { id: "policy-2", title: "Family curriculum visibility guidelines", audience: "Leadership and family engagement", programme: "Whole school", updatedAt: "Updated yesterday", status: "In review", tone: "warning" as const },
  { id: "policy-3", title: "PYP evidence moderation notes", audience: "PYP teams", programme: "PYP", updatedAt: "Updated today", status: "Shared", tone: "info" as const },
  { id: "policy-4", title: "DP milestone publishing checklist", audience: "DP coordinators", programme: "DP", updatedAt: "Updated 2 days ago", status: "Published", tone: "success" as const },
] as const;

const COVERAGE_COLUMNS = ["Grade 4", "Grade 5", "MYP 4", "MYP 5", "DP 1", "DP 2"] as const;

const COVERAGE_ROWS = [
  { label: "Inquiry prompts", programme: "PYP", values: [3, 4, 0, 0, 0, 0] },
  { label: "Shared assessments", programme: "MYP", values: [0, 0, 2, 3, 0, 0] },
  { label: "Criteria-linked units", programme: "MYP", values: [0, 0, 5, 6, 0, 0] },
  { label: "Milestone checkpoints", programme: "DP", values: [0, 0, 0, 0, 3, 4] },
  { label: "Family-safe published units", programme: "Whole school", values: [5, 4, 3, 3, 2, 2] },
] as const;

const HORIZONTAL_COLUMNS = [
  { id: "planning", label: "Planning" },
  { id: "units", label: "Units" },
  { id: "assessment", label: "Assessment" },
  { id: "atl", label: "ATL" },
  { id: "criteria", label: "Criteria / readiness" },
] as const;

type DrawerState =
  | { kind: "team"; id: string }
  | { kind: "template"; id: string }
  | { kind: "standards"; id: string }
  | { kind: "policy"; id: string }
  | null;

function getSubjectGroupLabel(subject: string) {
  return SUBJECT_GROUPS.find((group) => group.subjects.some((item) => item === subject))?.group ?? "Other";
}

export default function AdminCurriculumPage() {
  const [programme, setProgramme] = useState<AdminProgramme>("All");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [insightPerspective, setInsightPerspective] = useState<"vertical" | "horizontal">("vertical");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [drawerState, setDrawerState] = useState<DrawerState>(null);

  const filteredTeams = filterCurriculumTeams(programme, query);
  const filteredTemplates = filterTemplateLibrary(programme, query).filter((template) => {
    if (templateCategory === "all") return true;
    if (templateCategory === "planning") return template.scope.toLowerCase().includes("unit");
    if (templateCategory === "assessment") return template.sections.some((section) => section.toLowerCase().includes("criteria"));
    if (templateCategory === "reporting") return template.sections.some((section) => section.toLowerCase().includes("comment"));
    return template.scope.toLowerCase().includes("dataset");
  });

  const groupedSubjects = useMemo(() => {
    return SUBJECT_GROUPS.map((group) => ({
      group: group.group,
      rows: filteredTeams.filter((team) => group.subjects.some((item) => item === team.subject)),
    })).filter((group) => group.rows.length > 0);
  }, [filteredTeams]);

  const standardsRows = CURRICULUM_STANDARDS.filter(
    (row) => programme === "All" || row.programme === programme,
  ).filter((row) =>
    [row.name, row.subjectGroup, row.status].join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );

  const policyRows = CURRICULUM_POLICIES.filter(
    (row) => programme === "All" || row.programme === "Whole school" || row.programme === programme,
  ).filter((row) =>
    [row.title, row.audience, row.programme].join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );

  const selectedTeam =
    drawerState?.kind === "team" ? getSelectedCurriculumTeam(drawerState.id) : null;
  const selectedTemplate =
    drawerState?.kind === "template" ? getSelectedTemplate(drawerState.id) : null;
  const selectedStandards =
    drawerState?.kind === "standards"
      ? standardsRows.find((row) => row.id === drawerState.id) ?? null
      : null;
  const selectedPolicy =
    drawerState?.kind === "policy"
      ? policyRows.find((row) => row.id === drawerState.id) ?? null
      : null;

  const overviewHighlights = useMemo(() => {
    return filteredTeams.slice(0, 4).map((team) => ({
      id: team.id,
      title: `${team.programme} · ${team.subject}`,
      description: `${team.gradeBand} · ${team.lead}`,
      helper: team.priority,
      tone: team.tone,
      metric: `${team.planningCompletion}% planned`,
      tab: "subjects",
    }));
  }, [filteredTeams]);

  const horizontalRows = useMemo(() => {
    return filteredTeams.map((team) => {
      const readinessScore =
        team.criteriaCoverage > 0
          ? team.criteriaCoverage
          : Math.round((team.planningCompletion + team.unitCoverage + team.assessmentAlignment) / 3);

      return {
        id: team.id,
        label: team.teacherPreview.className,
        subtitle: `${team.subject} · ${team.gradeBand}`,
        values: [
          team.planningCompletion,
          team.unitCoverage,
          team.assessmentAlignment,
          team.atlCoverage,
          readinessScore,
        ],
      };
    });
  }, [filteredTeams]);

  const selectedInsightCardId =
    insightPerspective === "horizontal" ? "insight-horizontal" : "insight-vertical";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum oversight"
        description="A school-wide oversight and setup module for subjects, planning insights, standards frameworks, reusable templates, and curriculum-facing policies."
        primaryAction={{
          label: "Queue review pack",
          onClick: () => toast.success("Curriculum review pack added to the demo queue"),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">Toddle-shaped oversight module</AdminToneBadge>
          <AdminToneBadge tone="info">School-wide, not teacher-level authoring</AdminToneBadge>
          <AdminToneBadge tone="warning">Read-only governance workflow</AdminToneBadge>
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
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search teams, subjects, standards, policies, or templates"
          className="h-9 min-w-[220px] max-w-[360px] bg-white text-[13px]"
        />
      </AdminUtilityBar>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-[18px] border border-border/80 bg-[#fcfcfd] p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            {overviewHighlights.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className="rounded-[20px] border border-border/80 bg-white p-4 text-left shadow-1 transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-2 text-[16px] font-semibold tracking-tight text-foreground">{item.title}</p>
                  </div>
                  <AdminToneBadge tone={item.tone}>{item.metric}</AdminToneBadge>
                </div>
                <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{item.helper}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
            <AdminPanel title="Cross-class visibility" description="A launchpad into deeper subject, standards, and planning review without exposing teacher-private drafting.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Planning</TableHead>
                    <TableHead>Alignment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="whitespace-normal">
                        <div>
                          <p className="font-medium text-foreground">{team.subject}</p>
                          <p className="text-[12px] text-muted-foreground">
                            {team.gradeBand} · {team.lead}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{team.programme}</TableCell>
                      <TableCell>{team.planningCompletion}%</TableCell>
                      <TableCell>{team.assessmentAlignment}%</TableCell>
                      <TableCell>
                        <AdminToneBadge tone={team.tone}>{team.status}</AdminToneBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Open" onClick={() => setDrawerState({ kind: "team", id: team.id })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Module launchpad" description="Use this page as the calm entry point into deeper curriculum surfaces.">
              <div className="space-y-3">
                {[
                  { label: "Subjects", body: "Grouped rows with mapped grades, classes, and unit breadth.", tab: "subjects", icon: LibraryBig },
                  { label: "Insights", body: "Coverage matrix plus vertical and horizontal planning views.", tab: "insights", icon: Grid2x2 },
                  { label: "Standards", body: "Framework oversight with counts, updates, and status.", tab: "standards", icon: Layers3 },
                  { label: "Policies", body: "Searchable governance documents and curriculum-facing notes.", tab: "policies", icon: ScrollText },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveTab(item.tab)}
                      className="w-full rounded-2xl border border-border/80 bg-[#fcfcfd] px-4 py-3 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff2f0] p-2.5">
                          <Icon className="h-4 w-4 text-[#c24e3f]" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{item.label}</p>
                          <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{item.body}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <AdminPanel title="School-wide curriculum view" description="Subject-group grouped rows with mapped grade scope, unit counts, and class coverage.">
            <div className="space-y-5">
              {groupedSubjects.map((group) => (
                <div key={group.group} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-foreground">{group.group}</h3>
                    <AdminToneBadge tone="neutral">{group.rows.length} subject lines</AdminToneBadge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Programme / grade scope</TableHead>
                        <TableHead>Units</TableHead>
                        <TableHead>Classes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-normal">
                            <div>
                              <p className="font-medium text-foreground">{row.subject}</p>
                              <p className="text-[12px] text-muted-foreground">{getSubjectGroupLabel(row.subject)}</p>
                            </div>
                          </TableCell>
                          <TableCell>{row.programme} · {row.gradeBand}</TableCell>
                          <TableCell>{Math.round(row.unitCoverage / 10)}</TableCell>
                          <TableCell>{row.classes.length}</TableCell>
                          <TableCell><AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge></TableCell>
                          <TableCell className="text-right">
                            <AdminRowLink label="Inspect" onClick={() => setDrawerState({ kind: "team", id: row.id })} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            {CURRICULUM_INSIGHTS.map((insight) => (
              <button
                key={insight.id}
                type="button"
                onClick={() =>
                  setInsightPerspective(insight.id === "insight-horizontal" ? "horizontal" : "vertical")
                }
                className={`rounded-[20px] border p-4 text-left shadow-1 transition hover:border-[#ffc1b7] hover:bg-[#fffaf9] ${
                  insight.id === selectedInsightCardId
                    ? "border-[#ffc1b7] bg-[#fffaf9]"
                    : "border-border/80 bg-white"
                }`}
              >
                <p className="text-[14px] font-medium text-foreground">{insight.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{insight.description}</p>
                <div className="mt-3 rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-3">
                  <p className="text-[12px] text-[#b9483a]">{insight.takeaway}</p>
                </div>
              </button>
            ))}
          </div>

          <AdminPanel title="Planning insights" description="A read-only oversight surface with vertical and horizontal perspectives, filters, and one credible coverage matrix.">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <Tabs value={insightPerspective} onValueChange={(value) => setInsightPerspective(value as "vertical" | "horizontal")}>
                <TabsList>
                  <TabsTrigger value="vertical">Vertical overview</TabsTrigger>
                  <TabsTrigger value="horizontal">Horizontal overview</TabsTrigger>
                </TabsList>
              </Tabs>
              <AdminToneBadge tone="info">
                {insightPerspective === "vertical" ? "Compare year-level spread" : "Compare section consistency"}
              </AdminToneBadge>
            </div>
            {insightPerspective === "vertical" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 text-left font-medium text-muted-foreground">
                        Curriculum element
                      </th>
                      {COVERAGE_COLUMNS.map((column) => (
                        <th key={column} className="px-2 py-2 text-center font-medium text-muted-foreground">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COVERAGE_ROWS.filter(
                      (row) => programme === "All" || row.programme === programme || row.programme === "Whole school",
                    ).map((row) => (
                      <tr key={row.label} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          <div>
                            <p className="font-medium text-foreground">{row.label}</p>
                            <p className="text-[11px] text-muted-foreground">{row.programme}</p>
                          </div>
                        </td>
                        {row.values.map((value, index) => (
                          <td key={`${row.label}-${COVERAGE_COLUMNS[index]}`} className="px-2 py-2 text-center">
                            <span className="inline-flex min-w-[30px] items-center justify-center rounded-full bg-[#fff2f0] px-2 py-1 text-[11px] font-medium text-[#b9483a]">
                              {value}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 text-left font-medium text-muted-foreground">
                        Class / section
                      </th>
                      {HORIZONTAL_COLUMNS.map((column) => (
                        <th key={column.id} className="px-2 py-2 text-center font-medium text-muted-foreground">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horizontalRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          <div>
                            <p className="font-medium text-foreground">{row.label}</p>
                            <p className="text-[11px] text-muted-foreground">{row.subtitle}</p>
                          </div>
                        </td>
                        {row.values.map((value, index) => {
                          const toneClass =
                            value >= 90
                              ? "bg-[#f3fbf6] text-[#137a3d]"
                              : value >= 80
                                ? "bg-[#f3f7ff] text-[#285db6]"
                                : value >= 70
                                  ? "bg-[#fff8e8] text-[#a76b00]"
                                  : "bg-[#fff2f0] text-[#b9483a]";

                          return (
                            <td key={`${row.id}-${HORIZONTAL_COLUMNS[index].id}`} className="px-2 py-2 text-center">
                              <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1 text-[11px] font-medium ${toneClass}`}>
                                {value}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminPanel>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          <AdminPanel title="Standards and framework oversight" description="Grouped frameworks with counts, update metadata, and a preview path rather than full authoring.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Standard set</TableHead>
                  <TableHead>Subject group</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standardsRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                    <TableCell>{row.subjectGroup}</TableCell>
                    <TableCell>{row.programme}</TableCell>
                    <TableCell>{row.itemCount}</TableCell>
                    <TableCell>{row.updatedAt}</TableCell>
                    <TableCell><AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge></TableCell>
                    <TableCell className="text-right">
                      <AdminRowLink label="Open" onClick={() => setDrawerState({ kind: "standards", id: row.id })} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <AdminUtilityBar
            actions={
              <Button variant="outline" size="sm" onClick={() => toast.success("Template create flow opened in the demo")}>
                <NotebookTabs className="mr-1.5 h-3.5 w-3.5" />
                Create template
              </Button>
            }
          >
            <Select value={templateCategory} onValueChange={setTemplateCategory}>
              <SelectTrigger className="h-9 w-[190px] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All template categories</SelectItem>
                <SelectItem value="planning">Planning templates</SelectItem>
                <SelectItem value="assessment">Assessment templates</SelectItem>
                <SelectItem value="reporting">Reporting templates</SelectItem>
                <SelectItem value="datasets">Reference datasets</SelectItem>
              </SelectContent>
            </Select>
          </AdminUtilityBar>

          <AdminPanel title="Template library" description="Categorised, reusable, and school-wide. This stays governance-heavy rather than turning into a full authoring suite.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Adoption</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="whitespace-normal">
                      <div>
                        <p className="font-medium text-foreground">{template.name}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {template.owner} · {template.lastUpdated}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{template.programme}</TableCell>
                    <TableCell>{template.scope}</TableCell>
                    <TableCell>{template.adoptionRate}%</TableCell>
                    <TableCell><AdminToneBadge tone={template.tone}>{template.status}</AdminToneBadge></TableCell>
                    <TableCell className="text-right">
                      <AdminRowLink label="Open" onClick={() => setDrawerState({ kind: "template", id: template.id })} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <AdminPanel title="Policies and resources" description="A searchable curriculum-facing document surface with status, audience, and update metadata.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policyRows.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium text-foreground">{policy.title}</TableCell>
                    <TableCell>{policy.audience}</TableCell>
                    <TableCell>{policy.programme}</TableCell>
                    <TableCell>{policy.updatedAt}</TableCell>
                    <TableCell><AdminToneBadge tone={policy.tone}>{policy.status}</AdminToneBadge></TableCell>
                    <TableCell className="text-right">
                      <AdminRowLink label="Open" onClick={() => setDrawerState({ kind: "policy", id: policy.id })} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>
      </Tabs>

      <AdminDetailDrawer
        open={Boolean(drawerState)}
        onOpenChange={(open) => {
          if (!open) setDrawerState(null);
        }}
        title={
          selectedTeam?.subject ??
          selectedTemplate?.name ??
          selectedStandards?.name ??
          selectedPolicy?.title ??
          "Curriculum detail"
        }
        description={
          selectedTeam
            ? `${selectedTeam.programme} · ${selectedTeam.gradeBand}`
            : selectedTemplate
              ? `${selectedTemplate.programme} · ${selectedTemplate.scope}`
              : selectedStandards
                ? `${selectedStandards.programme} · ${selectedStandards.subjectGroup}`
                : selectedPolicy
                  ? `${selectedPolicy.programme} · ${selectedPolicy.audience}`
                  : undefined
        }
        primaryLabel={selectedTeam ? "Schedule QA review" : "Share preview"}
        secondaryLabel="Copy summary"
        onPrimary={() => toast.success("Curriculum action queued in the demo")}
        onSecondary={() => toast.message("Curriculum summary copied")}
      >
        {selectedTeam ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminMiniStat label="Planning" value={`${selectedTeam.planningCompletion}%`} helper={selectedTeam.recentUpdate} tone={selectedTeam.tone} />
              <AdminMiniStat label="Unit coverage" value={`${selectedTeam.unitCoverage}%`} helper={selectedTeam.priority} tone={selectedTeam.tone} />
              <AdminMiniStat label="Assessment alignment" value={`${selectedTeam.assessmentAlignment}%`} helper={`${selectedTeam.classes.length} classes in scope`} tone={selectedTeam.tone} />
            </div>
            <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Teacher planning preview</p>
              <p className="mt-2 text-[15px] font-medium text-foreground">{selectedTeam.teacherPreview.className}</p>
              <p className="text-[12px] text-muted-foreground">{selectedTeam.teacherPreview.unitTitle}</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedTeam.teacherPreview.note}</p>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
                <Eye className="h-4 w-4" />
                {selectedTeam.teacherPreview.nextReview}
              </div>
            </div>
          </div>
        ) : selectedTemplate ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminMiniStat label="Adoption" value={`${selectedTemplate.adoptionRate}%`} helper={selectedTemplate.status} tone={selectedTemplate.tone} />
              <AdminMiniStat label="Used by" value={`${selectedTemplate.usedBy.length} teams`} helper={selectedTemplate.lastUpdated} tone="info" />
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">{selectedTemplate.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTemplate.sections.map((section) => (
                  <AdminToneBadge key={section} tone="neutral">{section}</AdminToneBadge>
                ))}
              </div>
            </div>
          </div>
        ) : selectedStandards ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminMiniStat label="Items" value={String(selectedStandards.itemCount)} helper={selectedStandards.subjectGroup} tone={selectedStandards.tone} />
              <AdminMiniStat label="Status" value={selectedStandards.status} helper={selectedStandards.updatedAt} tone={selectedStandards.tone} />
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">
                This remains a framework oversight surface. Leadership can preview scale, freshness, and readiness without opening a full standards-authoring workflow.
              </p>
            </div>
          </div>
        ) : selectedPolicy ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Audience</p>
              <p className="mt-2 text-[14px] font-medium text-foreground">{selectedPolicy.audience}</p>
              <p className="text-[12px] text-muted-foreground">{selectedPolicy.updatedAt}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">
                Policies act as searchable, shareable governance documents. This keeps curriculum setup closer to Toddle’s operational shape without building document management depth.
              </p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
