"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  BookOpenText,
  Building2,
  GraduationCap,
  Megaphone,
  School,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import { AdminDetailDrawer, AdminKpiCard, AdminListItem, AdminPanel, AdminRowLink, AdminToneBadge, AdminUtilityBar } from "@/features/admin/components/admin-ui";

const KPI_ICONS = {
  students: Users,
  staff: Users,
  classes: Building2,
  attendance: Activity,
  curriculum: BookOpenText,
  integrations: ShieldCheck,
} as const;

const MODULE_LAUNCHES = [
  { id: "classes", title: "Classes", description: "Operational class directory with live class drill-ins.", metric: "49 live classes", href: "/admin/classes", tone: "peach" as const, icon: School },
  { id: "students", title: "Students", description: "Master student roster with live student drill-ins.", metric: "724 student records", href: "/admin/students", tone: "info" as const, icon: GraduationCap },
  { id: "curriculum", title: "Curriculum", description: "Subjects, insights, standards, templates, and policy oversight.", metric: "6 oversight surfaces", href: "/admin/curriculum", tone: "warning" as const, icon: BookOpenText },
  { id: "performance", title: "Performance", description: "Gradebook, standards, reports, and watchlist analytics.", metric: "5 performance tabs", href: "/admin/performance", tone: "danger" as const, icon: Activity },
  { id: "communications", title: "Communications", description: "Dashboard, moderation, announcements, and privacy controls.", metric: "Inbox + matrix governance", href: "/admin/communications", tone: "warning" as const, icon: Megaphone },
  { id: "operations", title: "Operations", description: "Attendance, timetable, calendar, and branding settings.", metric: "5 operational modules", href: "/admin/operations", tone: "info" as const, icon: Building2 },
  { id: "platform", title: "Platform", description: "Users, integrations, exports, and plan settings.", metric: "6 settings modules", href: "/admin/platform", tone: "neutral" as const, icon: ShieldCheck },
] as const;

const HERO_CARD_LINKS = {
  "curriculum-health": "/admin/curriculum",
  "performance-risk": "/admin/performance",
  "communications-health": "/admin/communications",
  "platform-health": "/admin/platform",
} as const;

type OverviewDetailState =
  | { kind: "alert"; id: string }
  | { kind: "exception"; id: string }
  | null;

export default function AdminOverviewPage() {
  const [detailState, setDetailState] = useState<OverviewDetailState>(null);

  const selectedAlert =
    detailState?.kind === "alert"
      ? adminDemoData.overview.alerts.find((alert) => alert.id === detailState.id) ?? null
      : null;
  const selectedException =
    detailState?.kind === "exception"
      ? adminDemoData.overview.exceptions.find((item) => item.id === detailState.id) ?? null
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="School leadership overview"
        description="A single-school leadership layer for curriculum quality, academic performance, communication governance, operations, and platform health."
        primaryAction={{
          label: "Export leadership brief",
          onClick: () => toast.success("Leadership briefing pack queued for the demo"),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">Single-campus IB continuum school</AdminToneBadge>
          <AdminToneBadge tone="info">Native Peach admin preview</AdminToneBadge>
          <AdminToneBadge tone="warning">Read-only governance workflow</AdminToneBadge>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-6 md:grid-cols-2">
        {adminDemoData.overview.kpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.id as keyof typeof KPI_ICONS];
          return (
            <AdminKpiCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              detail={kpi.detail}
              delta={kpi.delta}
              tone={kpi.tone}
              icon={Icon}
            />
          );
        })}
      </div>

      <AdminUtilityBar>
        <AdminToneBadge tone="info">{adminDemoData.school.academicYear}</AdminToneBadge>
        <AdminToneBadge tone="neutral">{adminDemoData.school.termLabel}</AdminToneBadge>
        <span className="text-[13px] text-muted-foreground">{adminDemoData.school.dataFreshness}</span>
      </AdminUtilityBar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MODULE_LAUNCHES.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.id}
              href={module.href}
              className="rounded-[24px] border border-border/80 bg-white/95 p-5 shadow-1 transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-foreground">{module.title}</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{module.description}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-2.5">
                  <Icon className="h-4 w-4 text-[#b9483a]" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <AdminToneBadge tone={module.tone}>{module.metric}</AdminToneBadge>
                <span className="text-[13px] font-medium text-[#b9483a]">Open module</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {adminDemoData.overview.programmes.map((programme) => (
          <AdminPanel
            key={programme.programme}
            title={programme.programme}
            description={programme.headline}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Scale</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight">{programme.students} students</p>
                <p className="text-[12px] text-muted-foreground">{programme.classes} classes · {programme.staff} staff</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Health</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight">{programme.attendance}</p>
                <p className="text-[12px] text-muted-foreground">Attendance · {programme.curriculumCompletion} curriculum completion</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Leadership focus</p>
              <p className="mt-2 text-[13px] leading-6 text-foreground">{programme.focus}</p>
            </div>
          </AdminPanel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {adminDemoData.overview.heroCards.map((card) => (
          <Link key={card.id} href={HERO_CARD_LINKS[card.id as keyof typeof HERO_CARD_LINKS] ?? "/admin/overview"}>
            <AdminPanel title={card.title} description={card.takeaway} className="h-full transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <AdminToneBadge tone={card.tone}>{card.eyebrow}</AdminToneBadge>
                <span className="text-[13px] font-medium text-[#b9483a]">Open</span>
              </div>
              <div className="space-y-3">
                {card.details.map((detail) => (
                  <div key={detail} className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-3 text-[13px] leading-6 text-muted-foreground">
                    {detail}
                  </div>
                ))}
              </div>
            </AdminPanel>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <AdminPanel
          title="Operations exceptions and priority checks"
          description="The exceptions below anchor the admin story with concrete school-wide issues needing leadership attention."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exception</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminDemoData.overview.exceptions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-normal">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-[12px] text-muted-foreground">{item.nextStep}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.module}</TableCell>
                  <TableCell>{item.owner}</TableCell>
                  <TableCell>
                    <AdminToneBadge tone={item.tone}>{item.status}</AdminToneBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminRowLink label="Review" onClick={() => setDetailState({ kind: "exception", id: item.id })} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminPanel>

        <div className="space-y-4">
          <AdminPanel title="Leadership alerts" description="High-signal prompts seeded to show the week’s priorities.">
            <div className="space-y-3">
              {adminDemoData.overview.alerts.map((alert) => (
                <AdminListItem
                  key={alert.id}
                  title={alert.title}
                  body={alert.body}
                  meta={`${alert.category} · ${alert.dueLabel}`}
                  tone={alert.tone}
                  onClick={() => setDetailState({ kind: "alert", id: alert.id })}
                />
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="Recent admin activity" description="Illustrative audit activity to make the leadership layer feel active and current.">
            <div className="space-y-3">
              {adminDemoData.overview.activity.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-border/80 bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-medium text-foreground">{activity.title}</p>
                    <AdminToneBadge tone="neutral">{activity.time}</AdminToneBadge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{activity.actor} · {activity.module}</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{activity.detail}</p>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      </div>

      <AdminDetailDrawer
        open={Boolean(detailState)}
        onOpenChange={(open) => {
          if (!open) setDetailState(null);
        }}
        title={selectedAlert?.title ?? selectedException?.title ?? "Detail"}
        description={
          selectedAlert
            ? `${selectedAlert.category} · ${selectedAlert.owner}`
            : selectedException
              ? `${selectedException.module} · ${selectedException.owner}`
              : undefined
        }
        primaryLabel="Acknowledge in demo"
        onPrimary={() => toast.success("Leadership acknowledgement saved locally for the demo")}
      >
        {selectedAlert ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Why this matters</p>
              <p className="mt-2 text-[14px] leading-7 text-foreground">{selectedAlert.body}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Owner</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedAlert.owner}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Target window</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedAlert.dueLabel}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Recommended leadership move</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Use this alert to guide a quick check-in rather than starting a new workflow. The portal is intentionally showing a governance surface, not a full operational system.
              </p>
            </div>
          </div>
        ) : selectedException ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Next step</p>
              <p className="mt-2 text-[14px] leading-7 text-foreground">{selectedException.nextStep}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Leadership note</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                This item exists to show how school leaders can keep an eye on academic, communication, and operational exceptions without dropping into teacher workflows.
              </p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
