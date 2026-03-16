"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, KeyRound, PlugZap, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/stores";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import {
  AdminDetailDrawer,
  AdminKpiCard,
  AdminMiniStat,
  AdminPanel,
  AdminRowLink,
  AdminToneBadge,
  AdminUtilityBar,
} from "@/features/admin/components/admin-ui";
import type { AdminTone } from "@/features/admin/data/admin-types";

const EXTERNAL_USER_ROWS = [
  { id: "external-1", name: "Consultant Counselling Services", email: "care@consultant-cs.com", role: "External support partner", context: "DP university guidance", status: "Active", tone: "info" as const, meta: "Provisioned for limited document access", detail: "External partnership", linkedClassIds: [] as string[] },
  { id: "external-2", name: "IT onboarding vendor", email: "support@launchstack.io", role: "Implementation partner", context: "Platform launch tasks", status: "Pending invite", tone: "warning" as const, meta: "Restricted to setup surfaces only", detail: "External support", linkedClassIds: [] as string[] },
] as const;

const ROLE_TIERS = {
  account: [
    { id: "role-account-1", name: "Head of school", summary: "Whole-school visibility across curriculum, performance, communications, operations, and platform.", members: 1, scope: "Whole school", tone: "peach" as const, surfaces: ["Overview", "Curriculum", "Performance", "Communications", "Operations", "Platform"] },
    { id: "role-account-2", name: "Platform administrator", summary: "Owns identity, integrations, exports, and setup assistants.", members: 2, scope: "Whole school", tone: "info" as const, surfaces: ["Platform", "Operations"] },
  ],
  programme: [
    { id: "role-programme-1", name: "MYP coordinator", summary: "Programme-level read/write oversight for planning, reports, and communication governance.", members: 1, scope: "MYP", tone: "warning" as const, surfaces: ["Curriculum", "Performance", "Communications"] },
    { id: "role-programme-2", name: "DP coordinator", summary: "Programme oversight with report-cycle and assessment milestone visibility.", members: 1, scope: "DP", tone: "info" as const, surfaces: ["Curriculum", "Performance"] },
  ],
  class: [
    { id: "role-class-1", name: "Homeroom adviser", summary: "Advisory and family communication rights for one homeroom context.", members: 8, scope: "Class / homeroom", tone: "success" as const, surfaces: ["Communication", "Reports"] },
    { id: "role-class-2", name: "Subject teacher", summary: "Class-specific teaching and assessment permissions only.", members: 34, scope: "Class / subject", tone: "neutral" as const, surfaces: ["Planning", "Assessments", "Gradebook"] },
  ],
} as const;

const PERMISSION_MATRIX = [
  { surface: "Curriculum oversight", account: "Full", programme: "Edit own programme", class: "Read unit context" },
  { surface: "Reports and gradebooks", account: "Full", programme: "Review and publish", class: "Contribute and mark" },
  { surface: "Communications moderation", account: "Full", programme: "Review flagged programme items", class: "Class-only" },
  { surface: "Platform settings", account: "Full", programme: "None", class: "None" },
] as const;

const AVAILABLE_INTEGRATIONS = [
  { id: "catalog-1", name: "Google Classroom bridge", category: "Classroom / Productivity", status: "Available", note: "Shown as part of the broader integration catalog.", tone: "neutral" as const },
  { id: "catalog-2", name: "Microsoft 365", category: "Classroom / Productivity", status: "Available", note: "Identity and file workflows can be surfaced here without live sync.", tone: "neutral" as const },
  { id: "catalog-3", name: "Veracross", category: "SIS / Rostering", status: "Available", note: "Representative SIS option for schools outside the current seed.", tone: "neutral" as const },
  { id: "catalog-4", name: "Blackbaud", category: "SIS / Rostering", status: "Available", note: "Visible so the catalog feels broader than the connected set.", tone: "neutral" as const },
  { id: "catalog-5", name: "iSAMS", category: "SIS / Rostering", status: "Available", note: "Read-only setup preview for IB schools using iSAMS.", tone: "neutral" as const },
  { id: "catalog-6", name: "LTI apps", category: "Assessment / Apps", status: "Pilot", note: "Generic app-launch surface shown at a catalog level.", tone: "warning" as const },
] as const;

const MIGRATION_CHECKLIST = [
  { id: "migration-step-1", label: "Source systems confirmed", note: "Legacy LMS archive and SIS exports are mapped for demo import jobs.", tone: "success" as const },
  { id: "migration-step-2", label: "Field mapping reviewed", note: "Family contacts still need a duplicate resolution rule.", tone: "warning" as const },
  { id: "migration-step-3", label: "Sample bundle approved", note: "Leadership has approved a report and attendance sample import only.", tone: "info" as const },
] as const;

const ROSTER_COUNTS = [
  { label: "Students synced", value: "724", helper: "Active student records with programme and class assignments", tone: "success" as const },
  { label: "Staff synced", value: "82", helper: "Faculty and support staff in the daily roster feed", tone: "info" as const },
  { label: "Classes synced", value: "49", helper: "Classes and homerooms available in admin, teacher, and family views", tone: "peach" as const },
  { label: "Exceptions", value: "4", helper: "Mappings still needing review before the next sync window", tone: "warning" as const },
] as const;

const ROSTER_MAPPINGS = [
  { id: "map-1", source: "PowerSchool homerooms", target: "Peach advisory classes", status: "3 mismatches", tone: "warning" as const },
  { id: "map-2", source: "SIS year levels", target: "Programme + grade scope", status: "Healthy", tone: "success" as const },
  { id: "map-3", source: "HR departments", target: "Teacher home departments", status: "Healthy", tone: "success" as const },
] as const;

const EXPORT_DOMAINS = [
  { id: "export-domain-1", name: "Reports", format: "PDF bundle", cadence: "On demand", note: "Report packs for families, leaders, or accreditation samples." },
  { id: "export-domain-2", name: "Attendance", format: "CSV", cadence: "Weekly", note: "Compliance and attendance oversight exports." },
  { id: "export-domain-3", name: "Curriculum", format: "ZIP package", cadence: "Manual", note: "Unit, template, and planning quality sample exports." },
  { id: "export-domain-4", name: "Communications", format: "CSV + PDF", cadence: "Manual", note: "Announcement reach and moderation evidence bundles." },
] as const;

const PLAN_TIERS = [
  { id: "tier-1", name: "Continuum Core", note: "Planning, assessment, reporting, family portal", emphasis: "Current plan", tone: "peach" as const },
  { id: "tier-2", name: "Leadership Analytics", note: "Advanced oversight, audit exports, admin analytics", emphasis: "Pilot add-on", tone: "info" as const },
  { id: "tier-3", name: "Platform Plus", note: "Expanded API, custom domain, larger seat envelope", emphasis: "Future option", tone: "neutral" as const },
] as const;

type DirectoryTab = "staff" | "students" | "families" | "external";
type RolesTab = keyof typeof ROLE_TIERS;

type DirectoryRow = {
  id: string;
  kind: DirectoryTab;
  name: string;
  email: string;
  role: string;
  context: string;
  status: string;
  tone: AdminTone;
  meta: string;
  linkedClassIds: string[];
  linkedStudentId?: string;
  linkedStudentIds?: string[];
};

type PlatformDetailState =
  | { kind: "directory"; entityType: DirectoryTab; id: string }
  | { kind: "role"; id: string; tier: RolesTab }
  | { kind: "integration"; id: string }
  | { kind: "sync"; id: string }
  | { kind: "migration"; id: string }
  | { kind: "export"; id: string }
  | { kind: "api"; id: string }
  | { kind: "webhook"; id: string }
  | null;

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ".");
}

export default function AdminPlatformPage() {
  const liveClasses = useStore((store) => store.classes);
  const liveStudents = useStore((store) => store.students);
  const liveFamilies = useStore((store) => store.parentProfiles);
  const [userTab, setUserTab] = useState<DirectoryTab>("staff");
  const [rolesTab, setRolesTab] = useState<RolesTab>("account");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directoryStatus, setDirectoryStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [integrationCategory, setIntegrationCategory] = useState("all");
  const [integrationQuery, setIntegrationQuery] = useState("");
  const [detailState, setDetailState] = useState<PlatformDetailState>(null);

  const classMap = useMemo(() => new Map(liveClasses.map((item) => [item.id, item])), [liveClasses]);
  const studentMap = useMemo(() => new Map(liveStudents.map((item) => [item.id, item])), [liveStudents]);

  const directoryRows = useMemo<Record<DirectoryTab, DirectoryRow[]>>(() => {
    const staffRows: DirectoryRow[] = adminDemoData.platform.users.map((user) => ({
      id: user.id,
      kind: "staff",
      name: user.name,
      email: user.email,
      role: user.role,
      context: user.programmeAccess,
      status: user.status,
      tone: user.tone,
      meta: `${user.group} · ${user.lastActive}`,
      linkedClassIds: user.linkedClassIds ?? [],
    }));

    const studentRows: DirectoryRow[] = liveStudents.map((student) => ({
      id: student.id,
      kind: "students",
      name: `${student.firstName} ${student.lastName}`,
      email: `${normalizeName(student.firstName)}.${normalizeName(student.lastName)}@students.peachschool.edu`,
      role: "Student account",
      context: student.classIds
        .map((classId) => classMap.get(classId)?.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(" · "),
      status: student.familyShareHistory.length > 0 ? "Active" : "Monitoring",
      tone: student.familyShareHistory.length > 0 ? "success" : "warning",
      meta: `${student.classIds.length} classes · ${student.preferredLanguage}`,
      linkedClassIds: student.classIds,
      linkedStudentId: student.id,
    }));

    const familyRows: DirectoryRow[] = liveFamilies.map((family) => ({
      id: family.id,
      kind: "families",
      name: family.householdName,
      email: family.email,
      role: family.relationshipLabel,
      context: `${family.linkedStudentIds.length} linked children`,
      status: family.directMessagingEnabled ? "Active" : "Limited",
      tone: family.directMessagingEnabled ? "success" : "warning",
      meta: `${family.preferredLanguage} · ${family.signInMethod}`,
      linkedClassIds: family.linkedStudentIds.flatMap((studentId) => studentMap.get(studentId)?.classIds ?? []),
      linkedStudentIds: family.linkedStudentIds,
    }));

    const externalRows: DirectoryRow[] = EXTERNAL_USER_ROWS.map((row) => ({
      ...row,
      kind: "external",
    }));

    return {
      staff: staffRows,
      students: studentRows,
      families: familyRows,
      external: externalRows,
    };
  }, [classMap, liveFamilies, liveStudents, studentMap]);

  const currentDirectoryRows = directoryRows[userTab];

  const filteredDirectoryRows = useMemo(() => {
    const normalized = directoryQuery.trim().toLowerCase();
    return currentDirectoryRows.filter((row) => {
      if (directoryStatus !== "all" && row.status.toLowerCase() !== directoryStatus.toLowerCase()) {
        return false;
      }
      if (!normalized) return true;
      return [row.name, row.email, row.role, row.context, row.meta].join(" ").toLowerCase().includes(normalized);
    });
  }, [currentDirectoryRows, directoryQuery, directoryStatus]);

  const allVisibleSelected =
    filteredDirectoryRows.length > 0 &&
    filteredDirectoryRows.every((row) => selectedIds.includes(row.id));

  const selectedDirectoryRow =
    detailState?.kind === "directory"
      ? directoryRows[detailState.entityType].find((row) => row.id === detailState.id) ?? null
      : null;
  const selectedIntegration =
    detailState?.kind === "integration"
      ? adminDemoData.platform.integrations.find((item) => item.id === detailState.id) ??
        adminDemoData.platform.ssoProviders.find((item) => item.id === detailState.id) ??
        AVAILABLE_INTEGRATIONS.find((item) => item.id === detailState.id) ??
        null
      : null;
  const selectedSync =
    detailState?.kind === "sync"
      ? adminDemoData.platform.rosteringSyncs.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedMigration =
    detailState?.kind === "migration"
      ? adminDemoData.platform.migrationJobs.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedExport =
    detailState?.kind === "export"
      ? adminDemoData.platform.exports.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedApiKey =
    detailState?.kind === "api"
      ? adminDemoData.platform.apiKeys.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedWebhook =
    detailState?.kind === "webhook"
      ? adminDemoData.platform.webhooks.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedRole =
    detailState?.kind === "role"
      ? ROLE_TIERS[detailState.tier].find((item) => item.id === detailState.id) ?? null
      : null;

  const selectedLinkedClasses =
    selectedDirectoryRow?.linkedClassIds
      ?.map((classId) => classMap.get(classId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? [];

  const selectedLinkedStudents =
    selectedDirectoryRow?.linkedStudentIds
      ?.map((studentId) => studentMap.get(studentId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? [];

  const integrationRows = useMemo(() => {
    const normalized = integrationQuery.trim().toLowerCase();
    const merged = [
      ...adminDemoData.platform.integrations.map((integration) => ({ ...integration, categoryLabel: integration.category })),
      ...adminDemoData.platform.ssoProviders.map((provider) => ({
        ...provider,
        name: provider.provider,
        category: "SSO",
        categoryLabel: "SSO",
        owner: "Identity",
        dataFlow: provider.loginPolicy,
        note: provider.domains,
      })),
      ...AVAILABLE_INTEGRATIONS.map((integration) => ({
        ...integration,
        owner: "Catalog",
        dataFlow: integration.category,
        categoryLabel: integration.category,
      })),
    ];

    return merged.filter((item) => {
      if (integrationCategory !== "all" && item.categoryLabel !== integrationCategory) return false;
      if (!normalized) return true;
      return [item.name, item.categoryLabel, item.owner, item.note, item.dataFlow]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [integrationCategory, integrationQuery]);

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? Array.from(new Set([...current, id])) : current.filter((value) => value !== id),
    );
  };

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...filteredDirectoryRows.map((row) => row.id)])));
      return;
    }
    setSelectedIds((current) => current.filter((id) => !filteredDirectoryRows.some((row) => row.id === id)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform administration"
        description="User directories, roles, integrations, data workflows, exports, and plan settings shaped as a serious admin module."
        primaryAction={{
          label: "Create platform brief",
          onClick: () => toast.success("Platform briefing pack queued for the demo"),
        }}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">Operational platform surfaces</AdminToneBadge>
          <AdminToneBadge tone="info">Read-only configuration depth</AdminToneBadge>
          <AdminToneBadge tone="warning">No real auth or sync engine</AdminToneBadge>
        </div>
      </PageHeader>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-[18px] border border-border/80 bg-[#fcfcfd] p-1">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; permissions</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">Data &amp; rostering</TabsTrigger>
          <TabsTrigger value="exports">Exports &amp; logs</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <AdminKpiCard label="Active users" value="812" detail="Staff, students, and family accounts" delta="96% healthy sign-ins" tone="success" icon={UsersRound} />
            <AdminKpiCard label="Role groups" value="3" detail="Account, programme, and class role tiers" delta="Read-only role governance" tone="peach" icon={ShieldCheck} />
            <AdminKpiCard label="Pending actions" value="11" detail="Invites, cleanup, and attention-needed accounts" delta="3 need follow-up" tone="warning" icon={PlugZap} />
          </div>

          <Tabs
            value={userTab}
            onValueChange={(value) => {
              setUserTab(value as DirectoryTab);
              setSelectedIds([]);
              setDirectoryStatus("all");
            }}
            className="space-y-4"
          >
            <TabsList className="bg-white">
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="families">Families</TabsTrigger>
              <TabsTrigger value="external">External</TabsTrigger>
            </TabsList>

            <AdminUtilityBar
              actions={
                <>
                  <Button variant="outline" size="sm" onClick={() => toast.success("Column settings opened in the demo")}>
                    Columns
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success("User export queued for the demo")}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Export
                  </Button>
                </>
              }
            >
              <Input
                value={directoryQuery}
                onChange={(event) => setDirectoryQuery(event.target.value)}
                placeholder="Search names, emails, roles, or context"
                className="h-9 max-w-[320px] bg-white text-[13px]"
              />
              <Select value={directoryStatus} onValueChange={setDirectoryStatus}>
                <SelectTrigger className="h-9 w-[170px] bg-white text-[13px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending invite">Pending invite</SelectItem>
                  <SelectItem value="attention needed">Attention needed</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                </SelectContent>
              </Select>
              <AdminToneBadge tone="info">{userTab}</AdminToneBadge>
            </AdminUtilityBar>

            {selectedIds.length > 0 ? (
              <div className="rounded-[18px] border border-[#ffe1dc] bg-[#fff7f5] px-4 py-3 text-[13px] text-[#9a4a3f]">
                {selectedIds.length} user records selected. Bulk actions remain demo-only.
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
              <AdminPanel title="User management" description="Roster-style admin directories with real-looking metadata and row actions.">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[44px]">
                        <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))} />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role / relationship</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDirectoryRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Checkbox checked={selectedIds.includes(row.id)} onCheckedChange={(checked) => toggleRow(row.id, Boolean(checked))} />
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-medium text-foreground">{row.name}</p>
                            <p className="text-[12px] text-muted-foreground">{row.email} · {row.meta}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.context || "Not linked yet"}</TableCell>
                        <TableCell>
                          <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <AdminRowLink label="Open" onClick={() => setDetailState({ kind: "directory", entityType: userTab, id: row.id })} />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <span className="sr-only">Open actions</span>
                                  <span className="text-lg leading-none">⋯</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetailState({ kind: "directory", entityType: userTab, id: row.id })}>
                                  Inspect record
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success("Access code prepared for the demo")}>
                                  Print sign-in code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.message("This remains a non-functional demo action")}>
                                  Archive / block
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminPanel>

              <AdminPanel title="Directory guidance" description="Keep the module broad without pretending to be a real permissions engine.">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border/80 bg-white p-4">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Staff</p>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Teachers include linked live classes so the admin drawer can connect to existing class workspaces.</p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-white p-4">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Students</p>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Student account rows are fed from the live seeded dataset to preserve coherence with admin student drill-ins.</p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-white p-4">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Families</p>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Relationship state, language, and sign-in method are visible so the roster feels school-operational, not purely academic.</p>
                  </div>
                </div>
              </AdminPanel>
            </div>
          </Tabs>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
            <AdminPanel title="Role governance" description="The platform should show role tiers and permission summaries, not a full editable ACL system.">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Account roles</p>
                  <p className="mt-2 text-[22px] font-semibold tracking-tight">2</p>
                  <p className="text-[12px] text-muted-foreground">Whole-school governance roles</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Programme roles</p>
                  <p className="mt-2 text-[22px] font-semibold tracking-tight">2</p>
                  <p className="text-[12px] text-muted-foreground">PYP, MYP, and DP coordinator scopes</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Class roles</p>
                  <p className="mt-2 text-[22px] font-semibold tracking-tight">2</p>
                  <p className="text-[12px] text-muted-foreground">Teacher and advisory-level permissions</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4 text-[13px] leading-6 text-muted-foreground">
                This module borrows Toddle&apos;s role-tier structure but keeps permissions read-only for prototype safety.
              </div>
            </AdminPanel>

            <AdminPanel title="Roles & permissions" description="Account, programme, and class tiers with a clear preview path into permission summaries.">
              <Tabs value={rolesTab} onValueChange={(value) => setRolesTab(value as RolesTab)} className="space-y-4">
                <TabsList className="bg-white">
                  <TabsTrigger value="account">Account roles</TabsTrigger>
                  <TabsTrigger value="programme">Programme roles</TabsTrigger>
                  <TabsTrigger value="class">Class roles</TabsTrigger>
                </TabsList>
                {Object.entries(ROLE_TIERS).map(([tier, rows]) => (
                  <TabsContent key={tier} value={tier} className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Scope</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Summary</TableHead>
                          <TableHead className="text-right">Open</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                            <TableCell>{row.scope}</TableCell>
                            <TableCell>{row.members}</TableCell>
                            <TableCell className="whitespace-normal">{row.summary}</TableCell>
                            <TableCell className="text-right">
                              <AdminRowLink label="Preview" onClick={() => setDetailState({ kind: "role", id: row.id, tier: tier as RolesTab })} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                ))}
              </Tabs>
            </AdminPanel>
          </div>

          <AdminPanel title="Permission summary matrix" description="A read-only matrix keeps role meaning legible without opening a full editor.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Surface</TableHead>
                  <TableHead>Account roles</TableHead>
                  <TableHead>Programme roles</TableHead>
                  <TableHead>Class roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_MATRIX.map((row) => (
                  <TableRow key={row.surface}>
                    <TableCell className="font-medium text-foreground">{row.surface}</TableCell>
                    <TableCell>{row.account}</TableCell>
                    <TableCell>{row.programme}</TableCell>
                    <TableCell>{row.class}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            <AdminMiniStat label="Connected" value="6" helper="Live-looking providers already seeded in the admin model" tone="success" />
            <AdminMiniStat label="SSO providers" value="2" helper="Identity providers shown with login policy and status" tone="info" />
            <AdminMiniStat label="Needs attention" value="1" helper="One SIS / roster feed still has unresolved exceptions" tone="warning" />
            <AdminMiniStat label="Catalog" value="58+" helper="Broad catalog implied without needing exhaustive fake setup" tone="peach" />
          </div>

          <AdminUtilityBar>
            <Select value={integrationCategory} onValueChange={setIntegrationCategory}>
              <SelectTrigger className="h-9 w-[210px] bg-white text-[13px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="SSO">SSO</SelectItem>
                <SelectItem value="Content">Content</SelectItem>
                <SelectItem value="Assessment">Assessment</SelectItem>
                <SelectItem value="Roster and reporting">Roster and reporting</SelectItem>
                <SelectItem value="Communications">Communications</SelectItem>
                <SelectItem value="SIS / Rostering">SIS / Rostering</SelectItem>
                <SelectItem value="Classroom / Productivity">Classroom / Productivity</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={integrationQuery}
              onChange={(event) => setIntegrationQuery(event.target.value)}
              placeholder="Search provider, owner, or data flow"
              className="h-9 max-w-[320px] bg-white text-[13px]"
            />
          </AdminUtilityBar>

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <AdminPanel title="Integration settings" description="Connected providers, SSO, and available catalog entries grouped in one serious-looking surface.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrationRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-normal">
                        <div>
                          <p className="font-medium text-foreground">{row.name}</p>
                          <p className="text-[12px] text-muted-foreground">{row.note}</p>
                        </div>
                      </TableCell>
                      <TableCell>{row.categoryLabel}</TableCell>
                      <TableCell>{row.owner}</TableCell>
                      <TableCell>
                        <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Preview" onClick={() => setDetailState({ kind: "integration", id: row.id })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <div className="space-y-4">
              <AdminPanel title="SSO providers" description="Identity providers stay visible inside the integrations story.">
                <div className="space-y-3">
                  {adminDemoData.platform.ssoProviders.map((provider) => (
                    <div key={provider.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{provider.provider}</p>
                          <p className="text-[12px] text-muted-foreground">{provider.domains}</p>
                        </div>
                        <AdminToneBadge tone={provider.tone}>{provider.status}</AdminToneBadge>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{provider.loginPolicy}</p>
                    </div>
                  ))}
                </div>
              </AdminPanel>

              <AdminPanel title="Catalog note" description="The catalog is intentionally broader than the connected set.">
                <div className="rounded-2xl border border-border/80 bg-white p-4 text-[13px] leading-6 text-muted-foreground">
                  The admin portal only needs one convincing grouped catalog. It does not need live configuration flows for every provider shown here.
                </div>
              </AdminPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            {ROSTER_COUNTS.map((item) => (
              <AdminMiniStat key={item.label} label={item.label} value={item.value} helper={item.helper} tone={item.tone} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
            <div className="space-y-4">
              <AdminPanel title="Data migration" description="Checklist + history patterns make this feel like a real setup workflow.">
                <div className="grid gap-3">
                  {MIGRATION_CHECKLIST.map((step) => (
                    <div key={step.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-medium text-foreground">{step.label}</p>
                        <AdminToneBadge tone={step.tone}>{step.tone === "success" ? "Complete" : step.tone === "warning" ? "Needs review" : "Pilot"}</AdminToneBadge>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{step.note}</p>
                    </div>
                  ))}
                </div>
              </AdminPanel>

              <AdminPanel title="Migration jobs" description="Status, source system, and next-step visibility are enough for this prototype.">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminDemoData.platform.migrationJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-medium text-foreground">{job.name}</p>
                            <p className="text-[12px] text-muted-foreground">{job.records} · {job.lastRun}</p>
                          </div>
                        </TableCell>
                        <TableCell>{job.source}</TableCell>
                        <TableCell>
                          <AdminToneBadge tone={job.tone}>{job.status}</AdminToneBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AdminRowLink label="Preview" onClick={() => setDetailState({ kind: "migration", id: job.id })} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminPanel>
            </div>

            <div className="space-y-4">
              <AdminPanel title="Rostering" description="Sync status, source systems, and mapping exceptions grouped in one operational module.">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Exceptions</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminDemoData.platform.rosteringSyncs.map((sync) => (
                      <TableRow key={sync.id}>
                        <TableCell className="whitespace-normal">
                          <div>
                            <p className="font-medium text-foreground">{sync.source}</p>
                            <p className="text-[12px] text-muted-foreground">{sync.lastRun} · Next {sync.nextRun}</p>
                          </div>
                        </TableCell>
                        <TableCell>{sync.scope}</TableCell>
                        <TableCell>
                          <AdminToneBadge tone={sync.tone}>{sync.status}</AdminToneBadge>
                        </TableCell>
                        <TableCell>{sync.exceptions}</TableCell>
                        <TableCell className="text-right">
                          <AdminRowLink label="Preview" onClick={() => setDetailState({ kind: "sync", id: sync.id })} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminPanel>

              <AdminPanel title="Mapping summary" description="A small exceptions panel makes the rostering module feel real.">
                <div className="space-y-3">
                  {ROSTER_MAPPINGS.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{row.source}</p>
                          <p className="text-[12px] text-muted-foreground">Target: {row.target}</p>
                        </div>
                        <AdminToneBadge tone={row.tone}>{row.status}</AdminToneBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {EXPORT_DOMAINS.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/80 bg-white p-4 shadow-1">
                <p className="text-[14px] font-medium text-foreground">{item.name}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{item.format} · {item.cadence}</p>
                <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
            <AdminPanel title="Export center" description="Multiple data domains plus recent export jobs make exports feel repeatable and real.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Export</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Requested by</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminDemoData.platform.exports.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium text-foreground">{job.name}</TableCell>
                      <TableCell>{job.format}</TableCell>
                      <TableCell>{job.requestedBy}</TableCell>
                      <TableCell>
                        <AdminToneBadge tone={job.tone}>{job.status}</AdminToneBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Preview" onClick={() => setDetailState({ kind: "export", id: job.id })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <div className="space-y-4">
              <AdminPanel title="Open APIs" description="Read-only technical settings, usage visibility, and webhook history.">
                <div className="space-y-3">
                  {adminDemoData.platform.apiKeys.map((key) => (
                    <button
                      key={key.id}
                      type="button"
                      onClick={() => setDetailState({ kind: "api", id: key.id })}
                      className="w-full rounded-2xl border border-border/80 bg-white px-4 py-3 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{key.label}</p>
                          <p className="text-[12px] text-muted-foreground">{key.maskedKey} · Last used {key.lastUsed}</p>
                        </div>
                        <AdminToneBadge tone={key.tone}>{key.status}</AdminToneBadge>
                      </div>
                    </button>
                  ))}
                </div>
              </AdminPanel>

              <AdminPanel title="Webhooks and delivery logs" description="Webhook rows and delivery states are enough to make APIs feel operational.">
                <div className="space-y-3">
                  {adminDemoData.platform.webhooks.map((hook) => (
                    <button
                      key={hook.id}
                      type="button"
                      onClick={() => setDetailState({ kind: "webhook", id: hook.id })}
                      className="w-full rounded-2xl border border-border/80 bg-white px-4 py-3 text-left transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{hook.label}</p>
                          <p className="text-[12px] text-muted-foreground">{hook.event}</p>
                        </div>
                        <AdminToneBadge tone={hook.tone}>{hook.status}</AdminToneBadge>
                      </div>
                    </button>
                  ))}
                </div>
              </AdminPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
            <div className="space-y-4">
              <AdminPanel title="Current plan" description="Enabled modules, renewal framing, and seat usage kept visible in one place.">
                <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Current package</p>
                      <p className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">Continuum Core + Leadership Analytics pilot</p>
                    </div>
                    <AdminToneBadge tone="peach">Renews 30 Jun 2026</AdminToneBadge>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                    Family portal, reporting, curriculum, and admin oversight are active. Leadership analytics stays capped to a small pilot audience.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <AdminMiniStat label="Seats used" value="704 / 860" helper="Across staff, student, and family accounts" tone="success" />
                  <AdminMiniStat label="Support SLA" value="Business day" helper="Implementation and platform review windows" tone="info" />
                </div>
              </AdminPanel>

              <AdminPanel title="Enabled modules" description="Plan entitlements read like a real subscription surface, not a pricing placeholder.">
                <div className="space-y-3">
                  {adminDemoData.platform.entitlements.map((entitlement) => (
                    <div key={entitlement.id} className="rounded-2xl border border-border/80 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-medium text-foreground">{entitlement.module}</p>
                        <AdminToneBadge tone={entitlement.tone}>{entitlement.status}</AdminToneBadge>
                      </div>
                      <p className="mt-2 text-[12px] text-muted-foreground">
                        {entitlement.seatsTotal
                          ? `${entitlement.seatsUsed}/${entitlement.seatsTotal} seats used`
                          : `${entitlement.seatsUsed} active allocations`}
                      </p>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{entitlement.note}</p>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>

            <AdminPanel title="Plan options" description="Alternative tiers are visible so the module feels like true plan management.">
              <div className="grid gap-4 md:grid-cols-3">
                {PLAN_TIERS.map((tier) => (
                  <div key={tier.id} className="rounded-2xl border border-border/80 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-medium text-foreground">{tier.name}</p>
                      <AdminToneBadge tone={tier.tone}>{tier.emphasis}</AdminToneBadge>
                    </div>
                    <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{tier.note}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => toast.success(`${tier.name} summary copied for the demo`)}>
                      Request summary
                    </Button>
                  </div>
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
        title={
          selectedDirectoryRow?.name ??
          selectedRole?.name ??
          (selectedIntegration && "provider" in selectedIntegration ? selectedIntegration.provider : selectedIntegration?.name) ??
          selectedSync?.source ??
          selectedMigration?.name ??
          selectedExport?.name ??
          selectedApiKey?.label ??
          selectedWebhook?.label ??
          "Platform detail"
        }
        description={
          selectedDirectoryRow
            ? `${selectedDirectoryRow.role} · ${selectedDirectoryRow.context}`
            : selectedRole
              ? `${selectedRole.scope} · ${selectedRole.members} members`
              : selectedSync
                ? `${selectedSync.scope} · ${selectedSync.lastRun}`
                : selectedMigration
                  ? `${selectedMigration.source} · ${selectedMigration.status}`
                  : selectedExport
                    ? `${selectedExport.format} · ${selectedExport.requestedBy}`
                    : selectedApiKey
                      ? `${selectedApiKey.maskedKey}`
                      : selectedWebhook
                        ? `${selectedWebhook.event}`
                        : undefined
        }
        primaryLabel="Copy detail"
        secondaryLabel="Mark reviewed"
        onPrimary={() => toast.success("Platform detail copied for the demo")}
        onSecondary={() => toast.message("Marked reviewed in the demo")}
      >
        {selectedDirectoryRow ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Account summary</p>
              <p className="mt-2 text-[14px] font-medium text-foreground">{selectedDirectoryRow.email}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{selectedDirectoryRow.meta}</p>
            </div>

            {selectedDirectoryRow.kind === "students" && selectedDirectoryRow.linkedStudentId ? (
              <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Live student drill-in</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  Student rows can still open the existing admin student workspace so the platform directory stays connected to live seeded context.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href={`/admin/students/${selectedDirectoryRow.linkedStudentId}`}>
                    Open student workspace
                  </Link>
                </Button>
              </div>
            ) : null}

            {selectedDirectoryRow.kind === "staff" && selectedLinkedClasses.length > 0 ? (
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Linked live classes</p>
                <div className="mt-3 space-y-3">
                  {selectedLinkedClasses.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-[#fcfcfd] px-4 py-3">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{classItem.name}</p>
                        <p className="text-[12px] text-muted-foreground">{classItem.subject} · {classItem.gradeLevel}</p>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/admin/classes/${classItem.id}`}>Open class workspace</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedDirectoryRow.kind === "families" && selectedLinkedStudents.length > 0 ? (
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Linked students</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedLinkedStudents.map((student) => (
                    <AdminToneBadge key={student.id} tone="info">
                      {student.firstName} {student.lastName}
                    </AdminToneBadge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4 text-[13px] leading-6 text-muted-foreground">
              This drawer is intentionally summary-only. It demonstrates clarity of account context and navigation without creating real identity administration.
            </div>
          </div>
        ) : null}

        {selectedRole ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Role summary</p>
              <p className="mt-2 text-[14px] leading-7 text-foreground">{selectedRole.summary}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Surfaces</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRole.surfaces.map((surface) => (
                  <AdminToneBadge key={surface} tone="neutral">{surface}</AdminToneBadge>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {selectedIntegration ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Data flow</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                {"dataFlow" in selectedIntegration
                  ? selectedIntegration.dataFlow
                  : "loginPolicy" in selectedIntegration
                    ? selectedIntegration.loginPolicy
                    : selectedIntegration.category}
              </p>
            </div>
            <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4 text-[13px] leading-6 text-muted-foreground">
              {"note" in selectedIntegration
                ? selectedIntegration.note
                : "domains" in selectedIntegration
                  ? selectedIntegration.domains
                  : ""}
            </div>
          </div>
        ) : null}

        {selectedSync ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Exceptions</p>
                <p className="mt-2 text-[24px] font-semibold tracking-tight">{selectedSync.exceptions}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-white p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Next run</p>
                <p className="mt-2 text-[15px] font-medium text-foreground">{selectedSync.nextRun}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4 text-[13px] leading-6 text-muted-foreground">
              Rostering remains a convincing read-only sync surface here. Counts, cadence, and exceptions are visible without building a real sync engine.
            </div>
          </div>
        ) : null}

        {selectedMigration ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Next step</p>
              <p className="mt-2 text-[14px] leading-7 text-foreground">{selectedMigration.nextStep}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4 text-[13px] leading-6 text-muted-foreground">
              {selectedMigration.records} from {selectedMigration.source}. The migration module uses checklist + history realism rather than actual import mechanics.
            </div>
          </div>
        ) : null}

        {selectedExport ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Requested at</p>
              <p className="mt-2 text-[14px] font-medium text-foreground">{selectedExport.generatedAt}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4 text-[13px] leading-6 text-muted-foreground">
              Export history is surfaced because repeated operational jobs are more believable than one-off download buttons.
            </div>
          </div>
        ) : null}

        {selectedApiKey ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#b9483a]" />
                <p className="text-[14px] font-medium text-foreground">{selectedApiKey.maskedKey}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedApiKey.scopes.map((scope) => (
                  <AdminToneBadge key={scope} tone="neutral">{scope}</AdminToneBadge>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {selectedWebhook ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Destination</p>
              <p className="mt-2 text-[13px] leading-6 text-foreground">{selectedWebhook.destination}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4 text-[13px] leading-6 text-muted-foreground">
              Last delivery: {selectedWebhook.lastDelivery}. Webhooks are intentionally presented as read-only technical settings.
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
