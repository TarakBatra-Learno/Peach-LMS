"use client";

import { useState } from "react";
import { Globe2, ShieldAlert, Sparkles } from "lucide-react";
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
import { filterAnnouncements, filterModerationQueue, getAdminProgrammeOptions, getSelectedAnnouncement, getSelectedModerationItem } from "@/features/admin/lib/admin-selectors";
import { AdminDetailDrawer, AdminKpiCard, AdminPanel, AdminPortalPreview, AdminRowLink, AdminToneBadge } from "@/features/admin/components/admin-ui";
import type { AdminProgramme } from "@/features/admin/data/admin-types";

export default function AdminCommunicationsPage() {
  const [programme, setProgramme] = useState<AdminProgramme>("All");
  const [moderationStatus, setModerationStatus] = useState("all");
  const [moderationQuery, setModerationQuery] = useState("");
  const [announcementStatus, setAnnouncementStatus] = useState("all");
  const [selectedModerationId, setSelectedModerationId] = useState<string | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [composerPreviewOpen, setComposerPreviewOpen] = useState(false);

  const moderationRows = filterModerationQueue(moderationStatus, moderationQuery);
  const announcementRows = filterAnnouncements(programme, announcementStatus);
  const selectedModeration = getSelectedModerationItem(selectedModerationId);
  const selectedAnnouncement = getSelectedAnnouncement(selectedAnnouncementId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication governance"
        description="School-wide communications oversight with moderation, analytics, announcement management, and privacy controls."
        primaryAction={{
          label: "Preview announcement composer",
          onClick: () => setComposerPreviewOpen(true),
        }}
      />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            {adminDemoData.communications.metrics.map((metric) => (
              <AdminKpiCard
                key={metric.id}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                delta="Governance view"
                tone={metric.tone}
                icon={metric.id === "comms-privacy" ? ShieldAlert : metric.id === "comms-open" ? Globe2 : Sparkles}
              />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
            <AdminPanel title="Family engagement by language" description="A human governance signal instead of a heavy analytics dashboard.">
              <div className="space-y-4">
                {adminDemoData.communications.languageEngagement.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-border/80 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{row.language}</p>
                        <p className="text-[12px] text-muted-foreground">{row.families} families</p>
                      </div>
                      <AdminToneBadge tone={row.tone}>{row.openRate}% open</AdminToneBadge>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Open rate</p>
                        <div className="mt-2 h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-[#c24e3f]" style={{ width: `${row.openRate}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Response rate</p>
                        <div className="mt-2 h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-[#2563eb]" style={{ width: `${row.responseRate}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Governance reading guide" description="This keeps communications calm and leadership-friendly.">
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
                  <p className="text-[14px] font-medium text-foreground">Moderation is the strongest demo surface.</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    It shows governance, privacy, and family communication context without pretending to be a full support case-management system.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[14px] font-medium text-foreground">Announcements stay broad, not operationally deep.</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    The point is to show preview, governance, and audience readiness, not a real multi-channel sending engine.
                  </p>
                </div>
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={moderationStatus} onValueChange={setModerationStatus}>
              <SelectTrigger className="h-9 w-[180px] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All moderation states</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="needs response">Needs response</SelectItem>
                <SelectItem value="in review">In review</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={moderationQuery}
              onChange={(event) => setModerationQuery(event.target.value)}
              placeholder="Search flagged threads, channels, or owners"
              className="h-9 max-w-[320px] bg-white text-[13px]"
            />
          </div>

          <AdminPanel title="Moderation queue" description="Flagged conversations, keyword alerts, and confidentiality-sensitive family interactions.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thread</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moderationRows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-normal">
                      <div>
                        <p className="font-medium text-foreground">{item.subject}</p>
                        <p className="text-[12px] text-muted-foreground">{item.family} · {item.timestamp}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.channel}</TableCell>
                    <TableCell>{item.programme}</TableCell>
                    <TableCell>{item.flagReason}</TableCell>
                    <TableCell><AdminToneBadge tone={item.tone}>{item.status}</AdminToneBadge></TableCell>
                    <TableCell className="text-right">
                      <AdminRowLink label="Review" onClick={() => setSelectedModerationId(item.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <div className="flex flex-wrap gap-2">
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
            <Select value={announcementStatus} onValueChange={setAnnouncementStatus}>
              <SelectTrigger className="h-9 w-[180px] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All announcement states</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <AdminPanel title="Announcement library" description="School-wide announcements with governance state, audience, and preview capability.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Announcement</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead className="text-right">Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcementRows.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="whitespace-normal">
                        <div>
                          <p className="font-medium text-foreground">{announcement.title}</p>
                          <p className="text-[12px] text-muted-foreground">{announcement.sentBy} · {announcement.scheduledFor}</p>
                        </div>
                      </TableCell>
                      <TableCell>{announcement.audience}</TableCell>
                      <TableCell><AdminToneBadge tone={announcement.tone}>{announcement.status}</AdminToneBadge></TableCell>
                      <TableCell>{announcement.engagement}</TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Open" onClick={() => setSelectedAnnouncementId(announcement.id)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Family-facing preview" description="A mirrored preview fragment that keeps continuity with the family portal without routing into it.">
              <AdminPortalPreview
                title={selectedAnnouncement?.previewTitle ?? adminDemoData.communications.announcements[0].previewTitle}
                subtitle={selectedAnnouncement?.previewBody ?? adminDemoData.communications.announcements[0].previewBody}
                accentLabel="Family-safe announcement preview"
              />
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
            <AdminPanel title="Privacy and confidentiality controls" description="Retention windows, access surfaces, and governance notes for leadership review.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Control</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminDemoData.communications.privacyControls.map((control) => (
                    <TableRow key={control.id}>
                      <TableCell className="whitespace-normal">
                        <div>
                          <p className="font-medium text-foreground">{control.name}</p>
                          <p className="text-[12px] text-muted-foreground">{control.note}</p>
                        </div>
                      </TableCell>
                      <TableCell>{control.scope}</TableCell>
                      <TableCell>{control.retention}</TableCell>
                      <TableCell>{control.access}</TableCell>
                      <TableCell><AdminToneBadge tone={control.tone}>{control.status}</AdminToneBadge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Audit log excerpts" description="Presentational only, but useful for making the governance surface feel credible.">
              <div className="space-y-3">
                {adminDemoData.communications.auditLog.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/80 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-medium text-foreground">{item.action}</p>
                      <AdminToneBadge tone="neutral">{item.timestamp}</AdminToneBadge>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">{item.actor} · {item.module}</p>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.note}</p>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>
      </Tabs>

      <AdminDetailDrawer
        open={Boolean(selectedModeration || selectedAnnouncement || composerPreviewOpen)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedModerationId(null);
            setSelectedAnnouncementId(null);
            setComposerPreviewOpen(false);
          }
        }}
        title={
          composerPreviewOpen
            ? "Announcement composer preview"
            : selectedModeration?.subject ?? selectedAnnouncement?.title ?? "Communication detail"
        }
        description={
          composerPreviewOpen
            ? "Demo-only announcement drafting surface"
            : selectedModeration
              ? `${selectedModeration.channel} · ${selectedModeration.owner}`
              : selectedAnnouncement
                ? `${selectedAnnouncement.audience} · ${selectedAnnouncement.sentBy}`
                : undefined
        }
        primaryLabel={
          composerPreviewOpen
            ? "Queue approval"
            : selectedModeration
              ? "Escalate thread"
              : "Schedule send"
        }
        secondaryLabel={composerPreviewOpen ? "Save draft" : "Copy summary"}
        onPrimary={() =>
          toast.success(
            composerPreviewOpen
              ? "Announcement moved to approval queue in the demo"
              : selectedModeration
                ? "Moderation escalation recorded in the demo"
                : "Announcement scheduling preview updated"
          )
        }
        onSecondary={() => toast.message("Communication summary copied for the demo")}
      >
        {selectedModeration ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Flagged preview</p>
              <p className="mt-2 text-[13px] leading-7 text-foreground">{selectedModeration.preview}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Reason</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedModeration.flagReason}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Confidentiality</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedModeration.confidentiality}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Governance note</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                This queue intentionally shows moderation posture, privacy sensitivity, and ownership without pretending to offer a full case-management system.
              </p>
            </div>
          </div>
        ) : selectedAnnouncement ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Summary</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedAnnouncement.summary}</p>
            </div>
            <AdminPortalPreview
              title={selectedAnnouncement.previewTitle}
              subtitle={selectedAnnouncement.previewBody}
              accentLabel={`${selectedAnnouncement.audience} preview`}
            />
          </div>
        ) : composerPreviewOpen ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Audience</p>
              <p className="mt-2 text-[15px] font-medium text-foreground">Whole school families</p>
              <p className="text-[12px] text-muted-foreground">Staggered by programme release windows</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Preview copy</p>
              <p className="mt-2 text-[14px] font-medium text-foreground">Term 2 report release update</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Families will receive programme-specific report release windows, followed by adviser support availability and family-friendly next steps.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Translation</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">English + Mandarin</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Approval flow</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">Leadership review pending</p>
              </div>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
