"use client";

import { useState } from "react";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { getFamilyPolicies, getParentChildren, getParentProfile } from "@/lib/family-selectors";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { FilterBar } from "@/components/shared/filter-bar";
import { TranslatedCopy } from "@/components/family/translated-copy";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  Bell,
  FileText,
  Globe,
  KeyRound,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import type {
  FamilyDeliveryCadence,
  FamilyNotificationCategory,
  FamilyNotificationPreference,
} from "@/types/family";

const NOTIFICATION_CATEGORIES: Array<{
  category: FamilyNotificationCategory;
  label: string;
  description: string;
}> = [
  { category: "announcements", label: "Announcements", description: "School-wide and class-level notices for families." },
  { category: "messages", label: "Messages", description: "New 1:1 messages and family-safe replies." },
  { category: "classroom_updates", label: "Classroom updates", description: "Shared classroom reflections and weekly updates." },
  { category: "portfolio", label: "Portfolio updates", description: "New evidence and learning artifacts shared with home." },
  { category: "assessment_results", label: "Assessment results", description: "Released scores, criteria, and teacher feedback." },
  { category: "attendance", label: "Attendance alerts", description: "Absence, lateness, and attendance-related reminders." },
  { category: "reports", label: "Reports", description: "Published progress reports and reporting cycle releases." },
  { category: "events", label: "Event reminders", description: "School events, meetings, and family-facing calendar notices." },
  { category: "deadlines", label: "Deadlines", description: "Upcoming work, due dates, and overdue reminders." },
];

function findPreference(
  preferences: FamilyNotificationPreference[],
  scope: string,
  category: FamilyNotificationCategory
) {
  return (
    preferences.find((preference) => preference.scope === scope && preference.category === category) ??
    preferences.find((preference) => preference.scope === "all" && preference.category === category)
  );
}

function fallbackPreference(
  scope: string,
  category: FamilyNotificationCategory
): FamilyNotificationPreference {
  return {
    scope,
    category,
    inApp: true,
    email: category !== "messages",
    push: category === "messages" || category === "attendance" || category === "deadlines",
    cadence: category === "announcements" || category === "events" ? "daily_digest" : "instant",
  };
}

function scopeLabel(scope: string, children: ReturnType<typeof getParentChildren>) {
  if (scope === "all") return "All children";
  const child = children.find((entry) => entry.id === scope);
  return child ? `${child.firstName} ${child.lastName}` : "Child";
}

function signInMethodLabel(value: string) {
  if (value === "google") return "Google";
  if (value === "microsoft") return "Microsoft";
  return "Email";
}

export default function FamilyMorePage() {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const updateParentProfile = useStore((store) => store.updateParentProfile);
  const loading = useMockLoading([parentId]);
  const [activeTab, setActiveTab] = useState("policies");
  const [policyCategory, setPolicyCategory] = useState("all");
  const [policySearch, setPolicySearch] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [preferenceScope, setPreferenceScope] = useState("all");

  if (loading) {
    return (
      <>
        <PageHeader title="More" description="Policies, family account details, sign-in codes, and notification settings" />
        <CardGridSkeleton count={6} />
      </>
    );
  }

  if (!parentId) {
    return (
      <EmptyState
        icon={UserCircle2}
        title="Not signed in"
        description="Choose a family persona from the entry page to view settings and policies."
      />
    );
  }

  const parent = getParentProfile(state, parentId);
  const children = getParentChildren(state, parentId);

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={UserCircle2}
        title="No linked children yet"
        description="Family settings and child-specific codes will appear here once your account is linked."
      />
    );
  }

  const policies = getFamilyPolicies(state).filter((policy) => {
    if (policyCategory !== "all" && policy.category !== policyCategory) return false;
    if (!policySearch) return true;
    const query = policySearch.toLowerCase();
    return (
      policy.title.toLowerCase().includes(query) ||
      policy.summary.toLowerCase().includes(query) ||
      policy.body.toLowerCase().includes(query)
    );
  });
  const selectedPolicy = policies.find((policy) => policy.id === selectedPolicyId) ?? policies[0] ?? null;
  const signInCodes = state.studentSignInCodes.filter((code) => parent.linkedStudentIds.includes(code.studentId));

  const updatePreference = (
    scope: string,
    category: FamilyNotificationCategory,
    updates: Partial<FamilyNotificationPreference>
  ) => {
    const existing = findPreference(parent.notificationPreferences, scope, category) ?? fallbackPreference(scope, category);
    const exactIndex = parent.notificationPreferences.findIndex(
      (preference) => preference.scope === scope && preference.category === category
    );
    const nextPreference = { ...existing, scope, category, ...updates };
    const nextPreferences = [...parent.notificationPreferences];

    if (exactIndex >= 0) {
      nextPreferences[exactIndex] = nextPreference;
    } else {
      nextPreferences.push(nextPreference);
    }

    updateParentProfile(parent.id, { notificationPreferences: nextPreferences });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="More"
        description="Published documents, family account details, student sign-in codes, and notification preferences."
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{parent.householdName}</Badge>
          <Badge variant="secondary">{children.length} linked child{children.length === 1 ? "" : "ren"}</Badge>
          <Badge variant="outline">{signInMethodLabel(parent.signInMethod)} sign-in</Badge>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Notifications</TabsTrigger>
          <TabsTrigger value="codes">Student sign-in codes</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <FilterBar
            filters={[
              {
                key: "category",
                label: "Category",
                options: [
                  { value: "all", label: "All documents" },
                  { value: "Handbook", label: "Handbook" },
                  { value: "Assessment", label: "Assessment" },
                  { value: "Attendance", label: "Attendance" },
                  { value: "Safeguarding", label: "Safeguarding" },
                  { value: "Technology", label: "Technology" },
                ],
                value: policyCategory,
                onChange: setPolicyCategory,
              },
            ]}
            onSearch={setPolicySearch}
            searchPlaceholder="Search policies..."
          />

          {policies.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No policies in this view"
              description="Try a different category or check back after the school publishes documents."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <Card className="gap-0 p-3">
                <div className="space-y-2">
                  {policies.map((policy) => (
                    <button
                      key={policy.id}
                      className={`w-full rounded-[16px] border px-4 py-4 text-left transition-colors ${
                        selectedPolicy?.id === policy.id
                          ? "border-[#c24e3f]/30 bg-[#fff2f0]"
                          : "border-border hover:bg-muted/40"
                      }`}
                      onClick={() => setSelectedPolicyId(policy.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium">{policy.title}</p>
                          <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{policy.summary}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {policy.category}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {selectedPolicy && (
                <Card className="gap-0 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[18px] font-semibold">{selectedPolicy.title}</h2>
                        <Badge variant="outline">{selectedPolicy.category}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] text-muted-foreground">{selectedPolicy.summary}</p>
                    </div>
                    <Badge variant="secondary">
                      Published {new Date(selectedPolicy.publishedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Badge>
                  </div>

                  <div className="mt-6">
                    <TranslatedCopy
                      body={selectedPolicy.body}
                      translatedBody={selectedPolicy.translatedBody}
                      translatedLanguage={selectedPolicy.translatedLanguage}
                      autoTranslate={parent.autoTranslateCommunications}
                    />
                  </div>

                  {selectedPolicy.attachment?.url && (
                    <div className="mt-6">
                      <a href={selectedPolicy.attachment.url} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="justify-between">
                          <span>{selectedPolicy.attachment.label}</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="gap-0 p-6">
              <div className="mb-5 flex items-center gap-2">
                <UserCircle2 className="h-5 w-5 text-[#c24e3f]" />
                <h2 className="text-[16px] font-semibold">Family profile</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">Household name</label>
                  <Input
                    value={parent.householdName}
                    onChange={(event) => updateParentProfile(parent.id, { householdName: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">Family member name</label>
                  <Input
                    value={parent.name}
                    onChange={(event) => updateParentProfile(parent.id, { name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">Email</label>
                  <Input
                    value={parent.email}
                    onChange={(event) => updateParentProfile(parent.id, { email: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">Relationship</label>
                  <Input
                    value={parent.relationshipLabel}
                    onChange={(event) => updateParentProfile(parent.id, { relationshipLabel: event.target.value })}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">Preferred language</label>
                  <Select
                    value={parent.preferredLanguage}
                    onValueChange={(value) => updateParentProfile(parent.id, { preferredLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">UI language</label>
                  <Select
                    value={parent.uiLanguage}
                    onValueChange={(value) => updateParentProfile(parent.id, { uiLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">Translation language</label>
                  <Select
                    value={parent.translationLanguage}
                    onValueChange={(value) => updateParentProfile(parent.id, { translationLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 rounded-[18px] border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium">Auto-translate communication surfaces</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Applies to announcements, messages, channels, classroom updates, and published policies when translations are available.
                    </p>
                  </div>
                  <Switch
                    checked={parent.autoTranslateCommunications}
                    onCheckedChange={(checked) => updateParentProfile(parent.id, { autoTranslateCommunications: checked })}
                  />
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="gap-0 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#c24e3f]" />
                  <h2 className="text-[16px] font-semibold">Account details</h2>
                </div>
                <div className="space-y-4 text-[13px]">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sign-in method</p>
                    <p className="mt-1">{signInMethodLabel(parent.signInMethod)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Direct messaging</p>
                    <p className="mt-1">{parent.directMessagingEnabled ? "Enabled by school" : "Disabled by school"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Channel participation</p>
                    <p className="mt-1">{parent.channelParticipationEnabled ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
              </Card>

              <Card className="gap-0 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#c24e3f]" />
                  <h2 className="text-[16px] font-semibold">Linked children</h2>
                </div>
                <div className="space-y-3">
                  {children.map((child) => (
                    <div key={child.id} className="rounded-[16px] border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium">{child.firstName} {child.lastName}</p>
                          <p className="mt-1 text-[12px] text-muted-foreground">{child.gradeLevel}</p>
                        </div>
                        <Badge variant="outline">{child.classIds.length} classes</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="gap-0 p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#c24e3f]" />
                  <h2 className="text-[16px] font-semibold">Notification preferences</h2>
                </div>
                <Select value={preferenceScope} onValueChange={setPreferenceScope}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All children</SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="mb-5 text-[13px] text-muted-foreground">
                These settings control how Peach sends family-facing reminders for {scopeLabel(preferenceScope, children).toLowerCase()}.
              </p>

              <div className="space-y-4">
                {NOTIFICATION_CATEGORIES.map((item) => {
                  const preference = findPreference(parent.notificationPreferences, preferenceScope, item.category) ??
                    fallbackPreference(preferenceScope, item.category);

                  return (
                    <div key={item.category} className="rounded-[18px] border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-[420px]">
                          <p className="text-[14px] font-medium">{item.label}</p>
                          <p className="mt-1 text-[12px] text-muted-foreground">{item.description}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {scopeLabel(preferenceScope, children)}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-[repeat(3,120px)_160px]">
                        {[
                          { key: "inApp", label: "In-app" },
                          { key: "email", label: "Email" },
                          { key: "push", label: "Push" },
                        ].map((channel) => (
                          <div key={channel.key} className="flex items-center justify-between rounded-[14px] bg-muted/40 px-3 py-2">
                            <span className="text-[12px] text-muted-foreground">{channel.label}</span>
                            <Switch
                              checked={preference[channel.key as keyof FamilyNotificationPreference] as boolean}
                              onCheckedChange={(checked) =>
                                updatePreference(preferenceScope, item.category, {
                                  [channel.key]: checked,
                                } as Partial<FamilyNotificationPreference>)
                              }
                            />
                          </div>
                        ))}

                        <Select
                          value={preference.cadence}
                          onValueChange={(value) =>
                            updatePreference(preferenceScope, item.category, {
                              cadence: value as FamilyDeliveryCadence,
                            })
                          }
                        >
                          <SelectTrigger className="h-[42px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">Instant</SelectItem>
                            <SelectItem value="daily_digest">Daily digest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="gap-0 p-6">
              <div className="mb-5 flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#c24e3f]" />
                <h2 className="text-[16px] font-semibold">Quiet hours</h2>
              </div>

              <p className="text-[13px] text-muted-foreground">
                Optional quiet hours help keep push reminders calm outside family time.
              </p>

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">Start</label>
                  <Input
                    type="time"
                    value={parent.quietHours?.start ?? "21:00"}
                    onChange={(event) =>
                      updateParentProfile(parent.id, {
                        quietHours: {
                          start: event.target.value,
                          end: parent.quietHours?.end ?? "06:30",
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-muted-foreground">End</label>
                  <Input
                    type="time"
                    value={parent.quietHours?.end ?? "06:30"}
                    onChange={(event) =>
                      updateParentProfile(parent.id, {
                        quietHours: {
                          start: parent.quietHours?.start ?? "21:00",
                          end: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="codes" className="space-y-4">
          {signInCodes.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="No sign-in codes available"
              description="Student device pairing codes will appear here only when the school has enabled them."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {signInCodes.map((code) => {
                const child = children.find((entry) => entry.id === code.studentId);
                return (
                  <Card key={code.id} className="gap-0 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-[#c24e3f]" />
                          <h2 className="text-[16px] font-semibold">{child?.firstName} {child?.lastName}</h2>
                        </div>
                        <p className="mt-1 text-[12px] text-muted-foreground">{child?.gradeLevel}</p>
                      </div>
                      <Badge variant={code.enabled ? "secondary" : "outline"}>
                        {code.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] gap-4">
                      <div className="grid h-[120px] place-items-center rounded-[18px] border border-border bg-[linear-gradient(135deg,#f9fafb,#f1f5f9)]">
                        <div className="space-y-1 text-center">
                          <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">QR DEMO</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{code.code}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pairing code</p>
                          <p className="mt-1 font-mono text-[22px] font-semibold tracking-[0.12em] text-[#c24e3f]">
                            {code.code}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</p>
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {code.enabled
                              ? code.expiresAt
                                ? `Expires ${new Date(code.expiresAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}`
                                : "Enabled"
                              : "The school has not enabled pairing right now."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 text-[13px] leading-6 text-muted-foreground">{code.instructions}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
