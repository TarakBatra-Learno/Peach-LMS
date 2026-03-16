"use client";

import { useMemo, useState } from "react";
import { Globe2, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { Switch } from "@/components/ui/switch";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import {
  filterModerationQueue,
  getAdminProgrammeOptions,
  getSelectedAnnouncement,
  getSelectedModerationItem,
} from "@/features/admin/lib/admin-selectors";
import {
  AdminDetailDrawer,
  AdminKpiCard,
  AdminPanel,
  AdminPortalPreview,
  AdminToneBadge,
  AdminUtilityBar,
} from "@/features/admin/components/admin-ui";
import type { AdminProgramme } from "@/features/admin/data/admin-types";

const COMMUNICATION_TREND = [
  { label: "Week 1", announcements: 14, readRate: 78, activeThreads: 26 },
  { label: "Week 2", announcements: 11, readRate: 81, activeThreads: 24 },
  { label: "Week 3", announcements: 16, readRate: 84, activeThreads: 31 },
  { label: "Week 4", announcements: 13, readRate: 82, activeThreads: 28 },
] as const;

const NOTIFICATION_GROUPS = {
  staff: [
    { category: "Academic workflow", trigger: "Report deadline reminders", channels: { inApp: true, email: true, push: false } },
    { category: "Academic workflow", trigger: "Grade release changes", channels: { inApp: true, email: false, push: false } },
    { category: "Operations", trigger: "Attendance compliance misses", channels: { inApp: true, email: true, push: true } },
    { category: "Communications", trigger: "Moderation escalations", channels: { inApp: true, email: true, push: true } },
  ],
  students: [
    { category: "Learning", trigger: "New assignments and due changes", channels: { inApp: true, email: false, push: true } },
    { category: "Learning", trigger: "Released grades and reports", channels: { inApp: true, email: false, push: true } },
    { category: "Community", trigger: "Whole-school announcements", channels: { inApp: true, email: false, push: true } },
  ],
  families: [
    { category: "Family updates", trigger: "Published reports", channels: { inApp: true, email: true, push: false } },
    { category: "Family updates", trigger: "Attendance alerts", channels: { inApp: true, email: true, push: true } },
    { category: "Community", trigger: "Announcements and events", channels: { inApp: true, email: true, push: false } },
    { category: "Translation", trigger: "Translated message availability", channels: { inApp: true, email: false, push: false } },
  ],
} as const;

const VISIBILITY_ROWS = [
  { module: "Class channels", staff: true, students: true, families: false, note: "Families use channel participation only when explicitly enabled." },
  { module: "Announcements", staff: true, students: true, families: true, note: "Whole-school and programme-facing by default." },
  { module: "Portfolio evidence", staff: true, students: true, families: true, note: "Family view remains shared-only and published-safe." },
  { module: "Report drafts", staff: true, students: false, families: false, note: "Draft reporting stays internal until publish/distribution." },
  { module: "Incident threads", staff: true, students: false, families: false, note: "Private pastoral context never surfaces in family channels." },
] as const;

const ANNOUNCEMENT_FOLDERS = [
  { id: "inbox", label: "Inbox" },
  { id: "drafts", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "sent", label: "Sent" },
  { id: "trash", label: "Trash" },
] as const;

export default function AdminCommunicationsPage() {
  const [programme, setProgramme] = useState<AdminProgramme>("All");
  const [moderationStatus, setModerationStatus] = useState("all");
  const [moderationQuery, setModerationQuery] = useState("");
  const [analyticsAudience, setAnalyticsAudience] = useState("families");
  const [announcementFolder, setAnnouncementFolder] = useState<(typeof ANNOUNCEMENT_FOLDERS)[number]["id"]>("inbox");
  const [selectedModerationId, setSelectedModerationId] = useState<string | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(
    adminDemoData.communications.announcements[0]?.id ?? null,
  );
  const [composerPreviewOpen, setComposerPreviewOpen] = useState(false);
  const [notificationAudience, setNotificationAudience] = useState<"staff" | "students" | "families">("families");
  const [notificationState, setNotificationState] = useState(() => {
    const initial: Record<string, boolean> = {};
    Object.entries(NOTIFICATION_GROUPS).forEach(([audience, rows]) => {
      rows.forEach((row) => {
        Object.entries(row.channels).forEach(([channel, enabled]) => {
          initial[`${audience}:${row.trigger}:${channel}`] = enabled;
        });
      });
    });
    return initial;
  });

  const moderationRows = filterModerationQueue(moderationStatus, moderationQuery);
  const selectedModeration = getSelectedModerationItem(selectedModerationId);

  const announcementRows = useMemo(() => {
    const baseRows = adminDemoData.communications.announcements.filter(
      (announcement) =>
        (programme === "All" ||
          announcement.programme === "Whole School" ||
          announcement.programme === programme),
    );
    if (announcementFolder === "inbox") return baseRows;
    if (announcementFolder === "drafts") return baseRows.filter((announcement) => announcement.status.toLowerCase() === "draft");
    if (announcementFolder === "scheduled") return baseRows.filter((announcement) => announcement.status.toLowerCase() === "scheduled");
    if (announcementFolder === "sent") return baseRows.filter((announcement) => announcement.status.toLowerCase() === "sent");
    return [
      {
        ...baseRows[0],
        id: "trash-1",
        title: "Superseded bus route update",
        audience: "Families",
        programme: "Whole School",
        status: "Trash",
        scheduledFor: "Archived yesterday",
        sentBy: "Operations office",
        engagement: "N/A",
        summary: "Old version removed after route changes were corrected.",
        previewTitle: "Superseded bus route update",
        previewBody: "This item has been moved to trash and is retained only for audit history in the demo.",
        tone: "neutral" as const,
      },
    ];
  }, [announcementFolder, programme]);

  const selectedAnnouncement =
    announcementRows.find((announcement) => announcement.id === selectedAnnouncementId) ??
    getSelectedAnnouncement(selectedAnnouncementId) ??
    announcementRows[0] ??
    null;

  const folderCounts = useMemo(() => {
    return {
      inbox: adminDemoData.communications.announcements.length,
      drafts: adminDemoData.communications.announcements.filter((item) => item.status.toLowerCase() === "draft").length,
      scheduled: adminDemoData.communications.announcements.filter((item) => item.status.toLowerCase() === "scheduled").length,
      sent: adminDemoData.communications.announcements.filter((item) => item.status.toLowerCase() === "sent").length,
      trash: 1,
    };
  }, []);

  const analyticsCards = [
    { label: "Announcements this term", value: "54", detail: "Whole-school, programme, and family-facing notices", tone: "peach" as const },
    { label: "Read rate", value: analyticsAudience === "families" ? "82%" : analyticsAudience === "students" ? "76%" : "89%", detail: `Audience: ${analyticsAudience}`, tone: "info" as const },
    { label: "Active conversations", value: analyticsAudience === "families" ? "31" : analyticsAudience === "students" ? "24" : "12", detail: "Open communication threads in the current week", tone: "success" as const },
    { label: "Messages this week", value: analyticsAudience === "families" ? "126" : analyticsAudience === "students" ? "118" : "42", detail: "Demo-only communication volume", tone: "warning" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication governance"
        description="A governance layer for announcement management, audience-level notification controls, communication analytics, moderation, and visibility rules."
        primaryAction={{
          label: "Preview announcement composer",
          onClick: () => setComposerPreviewOpen(true),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">Governance-first, not chat-first</AdminToneBadge>
          <AdminToneBadge tone="info">Foldered announcement management</AdminToneBadge>
          <AdminToneBadge tone="warning">Audience visibility and moderation controls</AdminToneBadge>
        </div>
      </PageHeader>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-[18px] border border-border/80 bg-[#fcfcfd] p-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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

          <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
            <AdminPanel title="Recent communication health" description="A leadership launchpad into analytics, announcements, and moderation.">
              <div className="space-y-3">
                {adminDemoData.communications.announcements.slice(0, 3).map((announcement) => (
                  <button
                    key={announcement.id}
                    type="button"
                    onClick={() => {
                      setSelectedAnnouncementId(announcement.id);
                      setAnnouncementFolder("inbox");
                    }}
                    className="w-full rounded-2xl border border-border/80 bg-white px-4 py-3 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{announcement.title}</p>
                        <p className="text-[12px] text-muted-foreground">{announcement.audience} · {announcement.sentBy}</p>
                      </div>
                      <AdminToneBadge tone={announcement.tone}>{announcement.status}</AdminToneBadge>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{announcement.summary}</p>
                  </button>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Moderation and privacy exceptions" description="Keep the highest-risk communication governance work visible without turning this into a case-management product.">
              <div className="space-y-3">
                {moderationRows.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/80 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{item.subject}</p>
                        <p className="text-[12px] text-muted-foreground">{item.family} · {item.channel}</p>
                      </div>
                      <AdminToneBadge tone={item.tone}>{item.status}</AdminToneBadge>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.flagReason}</p>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AdminUtilityBar>
            <Select value={analyticsAudience} onValueChange={setAnalyticsAudience}>
              <SelectTrigger className="h-9 w-[160px] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="families">Families</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
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
          </AdminUtilityBar>

          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            {analyticsCards.map((metric) => (
              <AdminKpiCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                delta="Current filter"
                tone={metric.tone}
              />
            ))}
          </div>

          <AdminPanel title="Communication analytics" description="Keep analytics legible and supportive, not BI-heavy.">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={COMMUNICATION_TREND} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#8a94a6" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8a94a6" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="announcements" fill="#c24e3f" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="activeThreads" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <AdminUtilityBar>
            <Tabs
              value={notificationAudience}
              onValueChange={(value) => setNotificationAudience(value as "staff" | "students" | "families")}
            >
              <TabsList>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="families">Families</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={moderationStatus} onValueChange={setModerationStatus}>
              <SelectTrigger className="h-9 w-[180px] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All exception states</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="needs response">Needs response</SelectItem>
                <SelectItem value="in review">In review</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={moderationQuery}
              onChange={(event) => setModerationQuery(event.target.value)}
              placeholder="Search flagged threads, channels, or owners"
              className="h-9 min-w-[220px] max-w-[320px] bg-white text-[13px]"
            />
          </AdminUtilityBar>

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <AdminPanel title="Moderation controls" description="Audience-level trigger by channel controls, modeled after a notification manager rather than a chat inbox.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">In-app</TableHead>
                    <TableHead className="text-center">Email</TableHead>
                    <TableHead className="text-center">Push</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {NOTIFICATION_GROUPS[notificationAudience].map((row) => (
                    <TableRow key={`${notificationAudience}-${row.trigger}`}>
                      <TableCell className="font-medium text-foreground">{row.trigger}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      {(["inApp", "email", "push"] as const).map((channel) => (
                        <TableCell key={channel} className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={notificationState[`${notificationAudience}:${row.trigger}:${channel}`]}
                              onCheckedChange={(checked) =>
                                setNotificationState((current) => ({
                                  ...current,
                                  [`${notificationAudience}:${row.trigger}:${channel}`]: checked,
                                }))
                              }
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Flagged thread queue" description="Keep one queue visible so the governance matrix still connects back to real moderation context.">
              <div className="space-y-3">
                {moderationRows.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedModerationId(item.id)}
                    className="w-full rounded-2xl border border-border/80 bg-white px-4 py-3 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{item.subject}</p>
                        <p className="text-[12px] text-muted-foreground">{item.family} · {item.owner}</p>
                      </div>
                      <AdminToneBadge tone={item.tone}>{item.status}</AdminToneBadge>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.flagReason}</p>
                  </button>
                ))}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
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
            <Button size="sm" onClick={() => setComposerPreviewOpen(true)}>
              New announcement
            </Button>
          </AdminUtilityBar>

          <div className="grid gap-4 xl:grid-cols-[220px,1fr,0.95fr]">
            <AdminPanel title="Folders" description="Inbox-style organization for announcement governance.">
              <div className="space-y-2">
                {ANNOUNCEMENT_FOLDERS.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setAnnouncementFolder(folder.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-[13px] transition ${
                      announcementFolder === folder.id
                        ? "border-[#ffc1b7] bg-[#fff2f0] text-[#b9483a]"
                        : "border-border/80 bg-white text-foreground hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                    }`}
                  >
                    <span>{folder.label}</span>
                    <AdminToneBadge tone={announcementFolder === folder.id ? "peach" : "neutral"}>
                      {folderCounts[folder.id]}
                    </AdminToneBadge>
                  </button>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Announcement list" description="List-detail interaction model with real-looking audience, author, date, and status context.">
              <div className="space-y-3">
                {announcementRows.map((announcement) => (
                  <button
                    key={announcement.id}
                    type="button"
                    onClick={() => setSelectedAnnouncementId(announcement.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedAnnouncement?.id === announcement.id
                        ? "border-[#ffc1b7] bg-[#fffaf9]"
                        : "border-border/80 bg-white hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{announcement.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {announcement.audience} · {announcement.sentBy} · {announcement.scheduledFor}
                        </p>
                      </div>
                      <AdminToneBadge tone={announcement.tone}>{announcement.status}</AdminToneBadge>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{announcement.summary}</p>
                  </button>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Announcement detail" description="A governance-side split pane rather than a routing detour into another portal.">
              {selectedAnnouncement ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/80 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{selectedAnnouncement.title}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {selectedAnnouncement.audience} · {selectedAnnouncement.sentBy}
                        </p>
                      </div>
                      <AdminToneBadge tone={selectedAnnouncement.tone}>{selectedAnnouncement.status}</AdminToneBadge>
                    </div>
                    <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{selectedAnnouncement.summary}</p>
                  </div>
                  <AdminPortalPreview
                    title={selectedAnnouncement.previewTitle}
                    subtitle={selectedAnnouncement.previewBody}
                    accentLabel="Family-safe preview fragment"
                  />
                </div>
              ) : null}
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
            <AdminPanel title="Module visibility matrix" description="A clear, read-only view of who can see what across major communication surfaces.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead className="text-center">Staff</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Families</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VISIBILITY_ROWS.map((row) => (
                    <TableRow key={row.module}>
                      <TableCell className="font-medium text-foreground">{row.module}</TableCell>
                      <TableCell className="text-center">{row.staff ? "Visible" : "Hidden"}</TableCell>
                      <TableCell className="text-center">{row.students ? "Visible" : "Hidden"}</TableCell>
                      <TableCell className="text-center">{row.families ? "Visible" : "Hidden"}</TableCell>
                      <TableCell className="whitespace-normal text-[12px] text-muted-foreground">{row.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Roles and access summary" description="Keep confidentiality and visibility legible alongside who actually holds those roles.">
              <div className="space-y-3">
                {adminDemoData.platform.permissionGroups.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-border/80 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-medium text-foreground">{group.name}</p>
                      <AdminToneBadge tone={group.tone}>{group.members} members</AdminToneBadge>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{group.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.surfaces.map((surface) => (
                        <AdminToneBadge key={surface} tone="neutral">{surface}</AdminToneBadge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>
        </TabsContent>
      </Tabs>

      <AdminDetailDrawer
        open={Boolean(selectedModeration || composerPreviewOpen)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedModerationId(null);
            setComposerPreviewOpen(false);
          }
        }}
        title={
          composerPreviewOpen
            ? "Announcement composer preview"
            : selectedModeration?.subject ?? "Communication detail"
        }
        description={
          composerPreviewOpen
            ? "Demo-only drafting surface"
            : selectedModeration
              ? `${selectedModeration.channel} · ${selectedModeration.owner}`
              : undefined
        }
        primaryLabel={composerPreviewOpen ? "Queue approval" : "Escalate thread"}
        secondaryLabel={composerPreviewOpen ? "Save draft" : "Copy summary"}
        onPrimary={() =>
          toast.success(
            composerPreviewOpen
              ? "Announcement moved to approval queue in the demo"
              : "Moderation escalation recorded in the demo",
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
          </div>
        ) : composerPreviewOpen ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Audience</p>
              <p className="mt-2 text-[14px] font-medium text-foreground">Families · Whole school</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Composer stays superficial in this pass. The important part is that announcements now live inside a foldered management surface with preview and governance state.
              </p>
            </div>
            <AdminPortalPreview
              title="Student-led conference booking opens Monday"
              subtitle="Conference booking opens Monday morning. Families can reserve a time for each child from the family calendar."
              accentLabel="Composed preview"
            />
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
