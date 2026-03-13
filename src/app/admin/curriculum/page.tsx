"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
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
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import { filterCurriculumTeams, filterTemplateLibrary, getAdminProgrammeOptions, getSelectedCurriculumTeam, getSelectedTemplate } from "@/features/admin/lib/admin-selectors";
import { AdminDetailDrawer, AdminMetricBar, AdminPanel, AdminRowLink, AdminToneBadge } from "@/features/admin/components/admin-ui";
import type { AdminProgramme } from "@/features/admin/data/admin-types";

export default function AdminCurriculumPage() {
  const [programme, setProgramme] = useState<AdminProgramme>("All");
  const [query, setQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const filteredTeams = filterCurriculumTeams(programme, query);
  const filteredTemplates = filterTemplateLibrary(programme, query);
  const selectedTeam = getSelectedCurriculumTeam(selectedTeamId);
  const selectedTemplate = getSelectedTemplate(selectedTemplateId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum oversight"
        description="School-wide curriculum oversight, planning quality signals, cross-class visibility, and shared template governance."
        primaryAction={{
          label: "Queue review pack",
          onClick: () => toast.success("Curriculum review pack added to the demo queue"),
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
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search teams, classes, leads, or templates"
            className="h-9 max-w-[320px] bg-white text-[13px]"
          />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            {filteredTeams.slice(0, 3).map((team) => (
              <AdminPanel key={team.id} title={`${team.programme} · ${team.subject}`} description={`${team.gradeBand} · Led by ${team.lead}`}>
                <div className="space-y-3">
                  <AdminMetricBar label="Planning completion" value={team.planningCompletion} tone={team.tone} helper={team.recentUpdate} />
                  <AdminMetricBar label="Unit coverage" value={team.unitCoverage} tone={team.tone} helper={`Priority: ${team.priority}`} />
                  <AdminMetricBar label="Assessment alignment" value={team.assessmentAlignment} tone={team.tone} helper={`${team.classes.length} classes in scope`} />
                  <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Teacher planning preview</p>
                    <p className="mt-2 text-[14px] font-medium text-foreground">{team.teacherPreview.className}</p>
                    <p className="text-[12px] text-muted-foreground">{team.teacherPreview.unitTitle}</p>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{team.teacherPreview.note}</p>
                  </div>
                </div>
              </AdminPanel>
            ))}
          </div>

          <AdminPanel title="Cross-class visibility" description="A school-level view of planning quality and class readiness, without exposing internal teacher drafting detail.">
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
                        <p className="text-[12px] text-muted-foreground">{team.gradeBand} · {team.lead}</p>
                      </div>
                    </TableCell>
                    <TableCell>{team.programme}</TableCell>
                    <TableCell>{team.planningCompletion}%</TableCell>
                    <TableCell>{team.assessmentAlignment}%</TableCell>
                    <TableCell><AdminToneBadge tone={team.tone}>{team.status}</AdminToneBadge></TableCell>
                    <TableCell className="text-right">
                      <AdminRowLink label="Open" onClick={() => setSelectedTeamId(team.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
            <AdminPanel title="Curriculum analytics" description="MYP and DP coverage are intentionally more legible here, with PYP represented as a lighter but real summary layer.">
              <div className="space-y-4">
                {adminDemoData.curriculum.gaps
                  .filter((gap) => programme === "All" || gap.programme === programme)
                  .map((gap) => (
                    <AdminMetricBar
                      key={gap.id}
                      label={gap.framework}
                      value={gap.coverage}
                      tone={gap.tone}
                      helper={`${gap.note} Target ${gap.target}%`}
                    />
                  ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Planning insights and cross-class pacing" description="Useful for spotting pacing drift, shared assessment reuse, and curriculum quality gaps.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Shared assessments</TableHead>
                    <TableHead>ATL</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminDemoData.curriculum.crossClass
                    .filter((item) => programme === "All" || item.programme === programme)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-medium text-foreground">{item.className}</p>
                            <p className="text-[12px] text-muted-foreground">{item.subject} · {item.pacing}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.programme}</TableCell>
                        <TableCell>{item.mappedUnits}</TableCell>
                        <TableCell>{item.sharedAssessments}</TableCell>
                        <TableCell>{item.atlCoverage}%</TableCell>
                        <TableCell>{item.criteriaCoverage > 0 ? `${item.criteriaCoverage}%` : "Course model"}</TableCell>
                        <TableCell><AdminToneBadge tone={item.tone}>{item.risk}</AdminToneBadge></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
            <AdminPanel
              title="Template library"
              description="Shared templates are represented as governance objects rather than deep authoring workflows."
              actionLabel="Publish update"
              onAction={() => toast.success("Template governance update prepared for the demo")}
            >
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
                          <p className="text-[12px] text-muted-foreground">{template.owner} · {template.lastUpdated}</p>
                        </div>
                      </TableCell>
                      <TableCell>{template.programme}</TableCell>
                      <TableCell>{template.scope}</TableCell>
                      <TableCell>{template.adoptionRate}%</TableCell>
                      <TableCell><AdminToneBadge tone={template.tone}>{template.status}</AdminToneBadge></TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Open" onClick={() => setSelectedTemplateId(template.id)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Template governance takeaways" description="One strong template signal can carry a demo without building a full authoring platform.">
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">What leaders can see</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Adoption rate, programme coverage, recent edits, and which teams are using the latest approved structure.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">What leaders do not need here</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Full district authoring, version history complexity, or real write-through governance. This remains a polished read-only mock-up.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Suggested next demo beat</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Open the MYP subject report narrative template to show how common structures can align teacher workflows without exposing internal drafting detail.
                  </p>
                </div>
              </div>
            </AdminPanel>
          </div>
        </TabsContent>
      </Tabs>

      <AdminDetailDrawer
        open={Boolean(selectedTeam || selectedTemplate)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTeamId(null);
            setSelectedTemplateId(null);
          }
        }}
        title={selectedTeam?.subject ?? selectedTemplate?.name ?? "Curriculum detail"}
        description={
          selectedTeam
            ? `${selectedTeam.programme} · ${selectedTeam.gradeBand}`
            : selectedTemplate
              ? `${selectedTemplate.programme} · ${selectedTemplate.scope}`
              : undefined
        }
        primaryLabel={selectedTeam ? "Schedule QA review" : "Share template preview"}
        secondaryLabel={selectedTeam ? "Create notes" : "Duplicate for pilot"}
        onPrimary={() => toast.success(selectedTeam ? "QA review scheduled in the demo" : "Template preview shared in the demo")}
        onSecondary={() => toast.message(selectedTeam ? "Leadership notes opened in the demo" : "Template duplicated into a pilot draft")}
      >
        {selectedTeam ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Class coverage</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTeam.classes.map((entry) => (
                  <AdminToneBadge key={entry} tone="neutral">{entry}</AdminToneBadge>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <AdminMetricBar label="Planning completion" value={selectedTeam.planningCompletion} tone={selectedTeam.tone} helper={selectedTeam.recentUpdate} />
              <AdminMetricBar label="Unit coverage" value={selectedTeam.unitCoverage} tone={selectedTeam.tone} helper={selectedTeam.priority} />
              <AdminMetricBar label="Assessment alignment" value={selectedTeam.assessmentAlignment} tone={selectedTeam.tone} helper={`ATL ${selectedTeam.atlCoverage}% · Criteria ${selectedTeam.criteriaCoverage || 0}%`} />
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
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">{selectedTemplate.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Adoption</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedTemplate.adoptionRate}%</p>
                <p className="text-[12px] text-muted-foreground">{selectedTemplate.status}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Used by</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedTemplate.usedBy.length} teams</p>
                <p className="text-[12px] text-muted-foreground">{selectedTemplate.lastUpdated}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Included sections</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTemplate.sections.map((section) => (
                  <AdminToneBadge key={section} tone="info">{section}</AdminToneBadge>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Live usage</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTemplate.usedBy.map((entry) => (
                  <AdminToneBadge key={entry} tone="neutral">{entry}</AdminToneBadge>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
