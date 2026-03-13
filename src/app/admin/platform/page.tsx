"use client";

import { useState } from "react";
import Link from "next/link";
import { PlugZap, ShieldCheck, UsersRound } from "lucide-react";
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
import { useStore } from "@/stores";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import { filterPlatformUsers, getSelectedPlatformUser } from "@/features/admin/lib/admin-selectors";
import { AdminDetailDrawer, AdminKpiCard, AdminPanel, AdminRowLink, AdminToneBadge } from "@/features/admin/components/admin-ui";

type PlatformDetailState =
  | { kind: "user"; id: string }
  | { kind: "integration"; id: string }
  | { kind: "sync"; id: string }
  | { kind: "job"; id: string }
  | null;

export default function AdminPlatformPage() {
  const liveClasses = useStore((store) => store.classes);
  const [roleFilter, setRoleFilter] = useState("all");
  const [userQuery, setUserQuery] = useState("");
  const [detailState, setDetailState] = useState<PlatformDetailState>(null);

  const userRows = filterPlatformUsers(roleFilter, userQuery);
  const selectedUser = detailState?.kind === "user" ? getSelectedPlatformUser(detailState.id) : null;
  const selectedUserClasses = selectedUser?.linkedClassIds?.map((classId) => liveClasses.find((cls) => cls.id === classId)).filter(Boolean) ?? [];
  const selectedIntegration =
    detailState?.kind === "integration"
      ? adminDemoData.platform.integrations.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedSync =
    detailState?.kind === "sync"
      ? adminDemoData.platform.rosteringSyncs.find((item) => item.id === detailState.id) ?? null
      : null;
  const selectedJob =
    detailState?.kind === "job"
      ? adminDemoData.platform.migrationJobs.find((item) => item.id === detailState.id) ??
        adminDemoData.platform.exports.find((item) => item.id === detailState.id) ??
        null
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform administration"
        description="User and identity surfaces, rostering and integrations, plus data/export and plan governance for demo purposes."
        primaryAction={{
          label: "Create platform brief",
          onClick: () => toast.success("Platform briefing pack queued for the demo"),
        }}
      />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="identity">Identity &amp; rostering</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">Data &amp; plans</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <AdminKpiCard label="Active users" value="812" detail="Staff, students, and family accounts" delta="96% healthy sign-ins" tone="success" icon={UsersRound} />
            <AdminKpiCard label="Leadership seats" value="6 / 10" detail="Admin analytics access in pilot" delta="4 seats available" tone="peach" icon={ShieldCheck} />
            <AdminKpiCard label="Pending invites" value="11" detail="Mostly seasonal staff and new families" delta="3 need follow-up" tone="warning" icon={PlugZap} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-[180px] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="platform">Platform</SelectItem>
                <SelectItem value="family">Family</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Search names, roles, groups, or emails"
              className="h-9 max-w-[320px] bg-white text-[13px]"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
            <AdminPanel title="User directory" description="A leadership-friendly directory, not a real permissions engine.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRows.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-normal">
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-[12px] text-muted-foreground">{user.email} · {user.lastActive}</p>
                        </div>
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.programmeAccess}</TableCell>
                      <TableCell><AdminToneBadge tone={user.tone}>{user.status}</AdminToneBadge></TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Open" onClick={() => setDetailState({ kind: "user", id: user.id })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>

            <AdminPanel title="Permission group previews" description="Presentational access surfaces for demo realism.">
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

        <TabsContent value="identity" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
            <AdminPanel title="SSO providers" description="Login policy and domain verification at a glance.">
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
                    <p className="mt-2 text-[12px] text-muted-foreground">Last sync: {provider.lastSync}</p>
                  </div>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel title="Rostering sync center" description="Admin-scale sync breadth without real backend complexity.">
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
                      <TableCell><AdminToneBadge tone={sync.tone}>{sync.status}</AdminToneBadge></TableCell>
                      <TableCell>{sync.exceptions}</TableCell>
                      <TableCell className="text-right">
                        <AdminRowLink label="Open" onClick={() => setDetailState({ kind: "sync", id: sync.id })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminPanel>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <AdminPanel title="Integration gallery" description="A broad, sophisticated-looking surface without real integration plumbing.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {adminDemoData.platform.integrations.map((integration) => (
                <button
                  key={integration.id}
                  type="button"
                  onClick={() => setDetailState({ kind: "integration", id: integration.id })}
                  className="rounded-2xl border border-border/80 bg-white p-4 text-left shadow-1 transition hover:border-[#ffc1b7] hover:bg-[#fffaf9]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{integration.name}</p>
                      <p className="text-[12px] text-muted-foreground">{integration.category}</p>
                    </div>
                    <AdminToneBadge tone={integration.tone}>{integration.status}</AdminToneBadge>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{integration.note}</p>
                  <p className="mt-3 text-[12px] text-muted-foreground">{integration.dataFlow}</p>
                </button>
              ))}
            </div>
          </AdminPanel>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
            <AdminPanel title="Migration and export center" description="Migration history, export jobs, and masked API surfaces.">
              <div className="space-y-4">
                <div>
                  <p className="mb-3 text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Migration jobs</p>
                  <div className="space-y-3">
                    {adminDemoData.platform.migrationJobs.map((job) => (
                      <div key={job.id} className="rounded-2xl border border-border/80 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-medium text-foreground">{job.name}</p>
                            <p className="text-[12px] text-muted-foreground">{job.source} · {job.records}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <AdminToneBadge tone={job.tone}>{job.status}</AdminToneBadge>
                            <AdminRowLink label="Open" onClick={() => setDetailState({ kind: "job", id: job.id })} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Recent export jobs</p>
                  <div className="space-y-3">
                    {adminDemoData.platform.exports.map((job) => (
                      <div key={job.id} className="rounded-2xl border border-border/80 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-medium text-foreground">{job.name}</p>
                            <p className="text-[12px] text-muted-foreground">{job.format} · {job.requestedBy}</p>
                          </div>
                          <AdminToneBadge tone={job.tone}>{job.status}</AdminToneBadge>
                        </div>
                        <p className="mt-2 text-[12px] text-muted-foreground">{job.generatedAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AdminPanel>

            <AdminPanel title="API, webhooks, and plan entitlements" description="Broad platform credibility without pretending to execute live jobs.">
              <div className="space-y-4">
                <div>
                  <p className="mb-3 text-[12px] uppercase tracking-[0.12em] text-muted-foreground">API keys</p>
                  <div className="space-y-3">
                    {adminDemoData.platform.apiKeys.map((key) => (
                      <div key={key.id} className="rounded-2xl border border-border/80 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-medium text-foreground">{key.label}</p>
                            <p className="text-[12px] text-muted-foreground">{key.maskedKey} · Last used {key.lastUsed}</p>
                          </div>
                          <AdminToneBadge tone={key.tone}>{key.status}</AdminToneBadge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {key.scopes.map((scope) => (
                            <AdminToneBadge key={scope} tone="neutral">{scope}</AdminToneBadge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Plan entitlements</p>
                  <div className="space-y-3">
                    {adminDemoData.platform.entitlements.map((entitlement) => (
                      <div key={entitlement.id} className="rounded-2xl border border-border/80 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[14px] font-medium text-foreground">{entitlement.module}</p>
                          <AdminToneBadge tone={entitlement.tone}>{entitlement.status}</AdminToneBadge>
                        </div>
                        <p className="mt-2 text-[12px] text-muted-foreground">
                          {entitlement.seatsTotal ? `${entitlement.seatsUsed}/${entitlement.seatsTotal} seats used` : `${entitlement.seatsUsed} active allocations`}
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{entitlement.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
        title={selectedUser?.name ?? selectedIntegration?.name ?? selectedSync?.source ?? selectedJob?.name ?? "Platform detail"}
        description={
          selectedUser
            ? `${selectedUser.role} · ${selectedUser.group}`
            : selectedIntegration
              ? `${selectedIntegration.category} · ${selectedIntegration.owner}`
              : selectedSync
                ? `${selectedSync.scope} · ${selectedSync.lastRun}`
                : selectedJob
                  ? `${selectedJob.status}`
                  : undefined
        }
        primaryLabel="Copy detail"
        secondaryLabel="Mark reviewed"
        onPrimary={() => toast.success("Platform detail copied for the demo")}
        onSecondary={() => toast.message("Marked reviewed in the demo")}
      >
        {selectedUser ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Access summary</p>
              <p className="mt-2 text-[14px] font-medium text-foreground">{selectedUser.programmeAccess}</p>
              <p className="text-[12px] text-muted-foreground">{selectedUser.email}</p>
            </div>
            {selectedUser.role.toLowerCase().includes("teacher") ? (
              <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Linked live classes</p>
                {selectedUserClasses.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {selectedUserClasses.map((cls) => (
                      <div key={cls!.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white px-4 py-3">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">{cls!.name}</p>
                          <p className="text-[12px] text-muted-foreground">{cls!.subject} · {cls!.gradeLevel}</p>
                        </div>
                        <Button asChild size="sm">
                          <Link href={`/admin/classes/${cls!.id}`}>
                            Open class workspace
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    This teacher does not have a linked live class hub in the current seeded prototype, so the admin profile stays read-only here.
                  </p>
                )}
              </div>
            ) : null}
            <div className="rounded-2xl border border-border/80 bg-[#fffaf9] p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">
                This user drawer is intentionally presentational. It demonstrates role and access readability without implementing a real permissions editor.
              </p>
            </div>
          </div>
        ) : selectedIntegration ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Data flow</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedIntegration.dataFlow}</p>
            </div>
            <div className="rounded-2xl border border-[#ffe1dc] bg-[#fff7f5] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Demo note</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{selectedIntegration.note}</p>
            </div>
          </div>
        ) : selectedSync ? (
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
            <div className="rounded-2xl border border-border/80 bg-[#fcfcfd] p-4">
              <p className="text-[13px] leading-6 text-muted-foreground">
                Rostering appears broad and credible here because the admin read model carries exception counts and sync windows without needing a real sync engine underneath.
              </p>
            </div>
          </div>
        ) : selectedJob ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Current state</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                {"nextStep" in selectedJob ? selectedJob.nextStep : selectedJob.generatedAt}
              </p>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
