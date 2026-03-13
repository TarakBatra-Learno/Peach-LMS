"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
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
import { AdminDetailDrawer, AdminPanel, AdminPortalPreview, AdminRowLink, AdminToneBadge } from "@/features/admin/components/admin-ui";

type OperationsDetailState =
  | { kind: "attendance"; id: string }
  | { kind: "issue"; id: string }
  | { kind: "domain"; id: string }
  | null;

export default function AdminOperationsPage() {
  const [detailState, setDetailState] = useState<OperationsDetailState>(null);

  const selectedAttendance =
    detailState?.kind === "attendance"
      ? adminDemoData.operations.attendance.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedIssue =
    detailState?.kind === "issue"
      ? adminDemoData.operations.timetableIssues.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedDomain =
    detailState?.kind === "domain"
      ? adminDemoData.operations.domains.find((item) => item.id === detailState.id) ?? null
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations management"
        description="Attendance compliance, timetable and calendar oversight, and brand/domain governance for the Peach school experience."
        primaryAction={{
          label: "Send ops digest",
          onClick: () => toast.success("Operations digest prepared for the demo"),
        }}
      />

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="calendar">Timetable &amp; calendar</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            {adminDemoData.operations.attendance.map((record) => (
              <AdminPanel key={record.id} title={`${record.programme} attendance`} description={`${record.gradeBand} · ${record.owner}`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Completion</p>
                    <p className="mt-2 text-[24px] font-semibold tracking-tight">{record.completion}%</p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Chronic absence</p>
                    <p className="mt-2 text-[24px] font-semibold tracking-tight">{record.chronicAbsence}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <AdminToneBadge tone={record.tone}>{record.status}</AdminToneBadge>
                    <AdminToneBadge tone="neutral">{record.latePattern} late patterns</AdminToneBadge>
                  </div>
                  <AdminRowLink label="Details" onClick={() => setDetailState({ kind: "attendance", id: record.id })} />
                </div>
              </AdminPanel>
            ))}
          </div>

          <AdminPanel title="Attendance compliance board" description="A leadership-friendly board of completion, unresolved items, and chronic patterns.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Programme</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Unresolved</TableHead>
                  <TableHead>Chronic absence</TableHead>
                  <TableHead>Late patterns</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminDemoData.operations.attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-normal">
                      <div>
                        <p className="font-medium text-foreground">{record.programme}</p>
                        <p className="text-[12px] text-muted-foreground">{record.gradeBand}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.completion}%</TableCell>
                    <TableCell>{record.unresolved}</TableCell>
                    <TableCell>{record.chronicAbsence}</TableCell>
                    <TableCell>{record.latePattern}</TableCell>
                    <TableCell><AdminToneBadge tone={record.tone}>{record.status}</AdminToneBadge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
            <AdminPanel title="Timetable issue queue" description="Room conflicts, cover signals, and calendar overlaps that matter to leadership.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminDemoData.operations.timetableIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="whitespace-normal">
                        <div>
                          <p className="font-medium text-foreground">{issue.type}</p>
                          <p className="text-[12px] text-muted-foreground">{issue.className} · {issue.summary}</p>
                        </div>
                      </TableCell>
                      <TableCell>{issue.programme}</TableCell>
                      <TableCell><AdminToneBadge tone={issue.tone}>{issue.severity}</AdminToneBadge></TableCell>
                      <TableCell>{issue.owner}</TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Open" onClick={() => setDetailState({ kind: "issue", id: issue.id })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Upcoming calendar moments" description="A calm, school-wide summary of milestones and operational moments.">
              <div className="space-y-3">
                {adminDemoData.operations.calendarMoments.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/80 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{item.title}</p>
                        <p className="text-[12px] text-muted-foreground">{item.date} · {item.audience}</p>
                      </div>
                      <AdminToneBadge tone={item.tone}>{item.status}</AdminToneBadge>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.note}</p>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
            <AdminPanel title="Custom domains and brand status" description="Domain verification, SSL state, and rollout confidence for the portal family.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SSL</TableHead>
                    <TableHead>DNS</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminDemoData.operations.domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className="whitespace-normal">
                        <div>
                          <p className="font-medium text-foreground">{domain.domain}</p>
                          <p className="text-[12px] text-muted-foreground">{domain.lastChecked}</p>
                        </div>
                      </TableCell>
                      <TableCell><AdminToneBadge tone={domain.tone}>{domain.status}</AdminToneBadge></TableCell>
                      <TableCell>{domain.ssl}</TableCell>
                      <TableCell>{domain.dns}</TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Details" onClick={() => setDetailState({ kind: "domain", id: domain.id })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel
              title="Branding previews across portals"
              description="A mirrored branding story across teacher, student, family, and admin experiences."
              actionLabel="Preview rollout"
              onAction={() => toast.success("Brand rollout preview opened in the demo")}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {adminDemoData.operations.brandingPreviews.map((preview) => (
                  <AdminPortalPreview
                    key={preview.id}
                    title={preview.heading}
                    subtitle={preview.subheading}
                    accentLabel={preview.accentLabel}
                  />
                ))}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>
      </Tabs>

      <AdminDetailDrawer
        open={Boolean(detailState)}
        onOpenChange={(open) => {
          if (!open) setDetailState(null);
        }}
        title={selectedAttendance?.programme ?? selectedIssue?.type ?? selectedDomain?.domain ?? "Operations detail"}
        description={
          selectedAttendance
            ? `${selectedAttendance.gradeBand} · ${selectedAttendance.owner}`
            : selectedIssue
              ? `${selectedIssue.className} · ${selectedIssue.owner}`
              : selectedDomain
                ? selectedDomain.lastChecked
                : undefined
        }
        primaryLabel="Acknowledge"
        secondaryLabel="Copy summary"
        onPrimary={() => toast.success("Operations follow-up acknowledged in the demo")}
        onSecondary={() => toast.message("Operations summary copied")}
      >
        {selectedAttendance ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Completion</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedAttendance.completion}%</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Unresolved items</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedAttendance.unresolved}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">
                Chronic absence remains the cleanest operations-to-leadership bridge in this demo. It gives decision-makers something concrete without building a full attendance case engine.
              </p>
            </div>
          </div>
        ) : selectedIssue ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Issue summary</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedIssue.summary}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Severity</p>
                <div className="mt-2">
                  <AdminToneBadge tone={selectedIssue.tone}>{selectedIssue.severity}</AdminToneBadge>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Target window</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedIssue.dueLabel}</p>
              </div>
            </div>
          </div>
        ) : selectedDomain ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Status</p>
                <div className="mt-2">
                  <AdminToneBadge tone={selectedDomain.tone}>{selectedDomain.status}</AdminToneBadge>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">SSL</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedDomain.ssl}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">DNS</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedDomain.dns}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">
                Domain and branding configuration are presented as leadership-ready status surfaces, not real infrastructure controls. That keeps the portal credible without implying a production admin backend.
              </p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
