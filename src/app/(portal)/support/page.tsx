"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Shield,
  Plus,
  AlertTriangle,
  MessageSquare,
  Users,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Settings2,
  ExternalLink,
} from "lucide-react";
import { format, parseISO, subDays, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { generateId } from "@/services/mock-service";
import type { Incident, SupportPlan } from "@/types/incident";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function SupportPage() {
  const loading = useMockLoading();

  const incidents = useStore((s) => s.incidents);
  const supportPlans = useStore((s) => s.supportPlans);
  const taxonomy = useStore((s) => s.taxonomy);
  const students = useStore((s) => s.students);
  const classes = useStore((s) => s.classes);
  const addIncident = useStore((s) => s.addIncident);
  const updateIncident = useStore((s) => s.updateIncident);
  const addSupportPlan = useStore((s) => s.addSupportPlan);
  const updateSupportPlan = useStore((s) => s.updateSupportPlan);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const updateTaxonomy = useStore((s) => s.updateTaxonomy);
  const getStudentById = useStore((s) => s.getStudentById);

  // Dialog / Sheet state
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [incidentSheetOpen, setIncidentSheetOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SupportPlan | null>(null);

  // Incident filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Log incident form
  const [newIncident, setNewIncident] = useState({
    studentId: "",
    classId: "",
    title: "",
    description: "",
    category: "",
    severity: "medium" as "low" | "medium" | "high",
    tags: [] as string[],
  });

  // Follow-up form
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpCalendar, setFollowUpCalendar] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("09:00");

  // Share with counselor — now persisted on Incident via store

  // Escalation confirm
  const [escalateConfirmOpen, setEscalateConfirmOpen] = useState(false);

  // Taxonomy editor
  const [taxonomyDialogOpen, setTaxonomyDialogOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Support plan edit form
  const [editPlanNote, setEditPlanNote] = useState("");

  // Build student→class mapping for class filter
  const studentClassMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    classes.forEach((cls) => {
      cls.studentIds.forEach((sid) => {
        if (!map[sid]) map[sid] = [];
        map[sid].push(cls.id);
      });
    });
    return map;
  }, [classes]);

  // Early warning: students with >= 3 incidents in last 30 days
  const earlyWarningStudents = useMemo(() => {
    const cutoff = subDays(new Date(), 30).getTime();
    const countMap: Record<string, number> = {};
    incidents.forEach((i) => {
      if (new Date(i.reportedAt).getTime() >= cutoff) {
        countMap[i.studentId] = (countMap[i.studentId] || 0) + 1;
      }
    });
    const set = new Set<string>();
    Object.entries(countMap).forEach(([sid, count]) => {
      if (count >= 3) set.add(sid);
    });
    return set;
  }, [incidents]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    let result = [...incidents];
    if (categoryFilter !== "all") {
      result = result.filter((i) => i.category === categoryFilter);
    }
    if (severityFilter !== "all") {
      result = result.filter((i) => i.severity === severityFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (classFilter !== "all") {
      result = result.filter((i) => {
        const studentClasses = studentClassMap[i.studentId] || [];
        return studentClasses.includes(classFilter);
      });
    }
    if (followUpFilter !== "all") {
      if (followUpFilter === "has_followup") {
        result = result.filter((i) =>
          i.followUps.some((fu) => fu.linkedCalendarEventId)
        );
      } else if (followUpFilter === "no_followup") {
        result = result.filter(
          (i) => !i.followUps.some((fu) => fu.linkedCalendarEventId)
        );
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => {
        const student = getStudentById(i.studentId);
        const studentName = student
          ? `${student.firstName} ${student.lastName}`.toLowerCase()
          : "";
        return (
          i.title.toLowerCase().includes(q) ||
          studentName.includes(q) ||
          i.category.toLowerCase().includes(q)
        );
      });
    }
    return result.sort(
      (a, b) =>
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }, [incidents, categoryFilter, severityFilter, statusFilter, classFilter, followUpFilter, searchQuery, getStudentById, studentClassMap]);

  // Analytics
  const analytics = useMemo(() => {
    const total = incidents.length;
    const bySeverity = {
      low: incidents.filter((i) => i.severity === "low").length,
      medium: incidents.filter((i) => i.severity === "medium").length,
      high: incidents.filter((i) => i.severity === "high").length,
    };
    const byCategory: Record<string, number> = {};
    incidents.forEach((i) => {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    });
    const openCount = incidents.filter(
      (i) => i.status === "open" || i.status === "in_progress"
    ).length;
    const resolvedCount = incidents.filter(
      (i) => i.status === "resolved"
    ).length;
    // Build weekly trend data
    const weekMap: Record<string, number> = {};
    incidents.forEach((i) => {
      const weekStart = startOfWeek(parseISO(i.reportedAt), {
        weekStartsOn: 1,
      });
      const key = format(weekStart, "MMM d");
      weekMap[key] = (weekMap[key] || 0) + 1;
    });
    const trendData = Object.entries(weekMap)
      .map(([week, count]) => ({ week, incidents: count }))
      .slice(-12);

    return { total, bySeverity, byCategory, openCount, resolvedCount, trendData };
  }, [incidents]);

  // Handlers
  const handleLogIncident = () => {
    if (!newIncident.studentId || !newIncident.title || !newIncident.category) {
      toast.error("Please fill in required fields");
      return;
    }
    const incident: Incident = {
      id: generateId("inc"),
      studentId: newIncident.studentId,
      classId: newIncident.classId || undefined,
      title: newIncident.title,
      description: newIncident.description,
      category: newIncident.category,
      tags: newIncident.tags,
      severity: newIncident.severity,
      reportedBy: "Current Teacher",
      reportedAt: new Date().toISOString(),
      collaboratorNames: [],
      followUps: [],
      status: "open",
    };
    addIncident(incident);
    toast.success("Incident logged successfully");
    setLogDialogOpen(false);
    setNewIncident({
      studentId: "",
      classId: "",
      title: "",
      description: "",
      category: "",
      severity: "medium",
      tags: [],
    });
  };

  const handleAddFollowUp = () => {
    if (!selectedIncident || !followUpNote.trim()) return;

    const followUp = {
      id: generateId("fu"),
      note: followUpNote,
      createdAt: new Date().toISOString(),
      createdBy: "Current Teacher",
      linkedCalendarEventId: undefined as string | undefined,
      scheduledDate: undefined as string | undefined,
    };

    if (followUpCalendar) {
      // Use custom date/time if provided, otherwise default to 7 days from now
      let meetingStart: Date;
      if (followUpDate) {
        const [hours, minutes] = followUpTime.split(":").map(Number);
        meetingStart = new Date(followUpDate);
        meetingStart.setHours(hours, minutes, 0, 0);
      } else {
        meetingStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      const meetingEnd = new Date(meetingStart.getTime() + 30 * 60 * 1000);

      const calEventId = generateId("cal");
      addCalendarEvent({
        id: calEventId,
        title: `Follow-up: ${selectedIncident.title}`,
        description: followUpNote,
        type: "meeting",
        startTime: meetingStart.toISOString(),
        endTime: meetingEnd.toISOString(),
        isAllDay: false,
        linkedIncidentId: selectedIncident.id,
      });
      followUp.linkedCalendarEventId = calEventId;
      followUp.scheduledDate = meetingStart.toISOString();
    }

    updateIncident(selectedIncident.id, {
      followUps: [...selectedIncident.followUps, followUp],
    });

    // Refresh selected incident
    setSelectedIncident({
      ...selectedIncident,
      followUps: [...selectedIncident.followUps, followUp],
    });

    setFollowUpNote("");
    setFollowUpCalendar(false);
    setFollowUpDate("");
    setFollowUpTime("09:00");
    toast.success("Follow-up added");
  };

  const handleResolveIncident = () => {
    if (!selectedIncident) return;
    updateIncident(selectedIncident.id, { status: "resolved" });
    setSelectedIncident({ ...selectedIncident, status: "resolved" });
    toast.success("Incident resolved");
  };

  const handleEscalateIncident = () => {
    setEscalateConfirmOpen(true);
  };

  const confirmEscalateIncident = () => {
    if (!selectedIncident) return;
    updateIncident(selectedIncident.id, {
      severity: "high",
      status: "in_progress",
    });
    setSelectedIncident({
      ...selectedIncident,
      severity: "high",
      status: "in_progress",
    });
    toast.success("Incident escalated to high severity");
  };

  const handleAddPlanNote = () => {
    if (!selectedPlan || !editPlanNote.trim()) return;
    updateSupportPlan(selectedPlan.id, {
      notes: [...selectedPlan.notes, editPlanNote],
    });
    setSelectedPlan({
      ...selectedPlan,
      notes: [...selectedPlan.notes, editPlanNote],
    });
    setEditPlanNote("");
    toast.success("Note added to support plan");
  };

  const handleSearchIncidents = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  if (loading)
    return (
      <>
        <PageHeader title="Student Support" />
        <CardGridSkeleton count={6} />
      </>
    );

  return (
    <div>
      <PageHeader
        title="Student Support"
        description="Manage incidents, support plans, and student wellbeing"
        primaryAction={{
          label: "Log incident",
          onClick: () => setLogDialogOpen(true),
          icon: Plus,
        }}
      />

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="plans">Support Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ── Incidents Tab ── */}
        <TabsContent value="incidents">
          <FilterBar
            filters={[
              {
                key: "category",
                label: "Category",
                options: [
                  { value: "all", label: "All categories" },
                  ...taxonomy.categories.map((c) => ({
                    value: c,
                    label: c,
                  })),
                ],
                value: categoryFilter,
                onChange: setCategoryFilter,
              },
              {
                key: "severity",
                label: "Severity",
                options: [
                  { value: "all", label: "All severities" },
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ],
                value: severityFilter,
                onChange: setSeverityFilter,
              },
              {
                key: "status",
                label: "Status",
                options: [
                  { value: "all", label: "All statuses" },
                  { value: "open", label: "Open" },
                  { value: "in_progress", label: "In progress" },
                  { value: "resolved", label: "Resolved" },
                ],
                value: statusFilter,
                onChange: setStatusFilter,
              },
              {
                key: "class",
                label: "Class",
                options: [
                  { value: "all", label: "All classes" },
                  ...classes.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ],
                value: classFilter,
                onChange: setClassFilter,
              },
              {
                key: "followup",
                label: "Follow-up",
                options: [
                  { value: "all", label: "All" },
                  { value: "has_followup", label: "Meeting scheduled" },
                  { value: "no_followup", label: "No meeting" },
                ],
                value: followUpFilter,
                onChange: setFollowUpFilter,
              },
            ]}
            onSearch={handleSearchIncidents}
            searchPlaceholder="Search incidents..."
          >
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-[13px]"
              onClick={() => {
                setLocalCategories([...taxonomy.categories]);
                setNewCategoryName("");
                setTaxonomyDialogOpen(true);
              }}
            >
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              Manage Categories
            </Button>
          </FilterBar>

          {filteredIncidents.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No incidents"
              description="No incidents match your current filters."
              action={{
                label: "Log incident",
                onClick: () => setLogDialogOpen(true),
              }}
            />
          ) : (
            <div className="space-y-2">
              {filteredIncidents.map((incident) => {
                const student = getStudentById(incident.studentId);
                return (
                  <Card
                    key={incident.id}
                    className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:border-border/80 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedIncident(incident);
                      setIncidentSheetOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium">
                          {incident.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {student
                            ? `${student.firstName} ${student.lastName}`
                            : "Unknown"}
                          {earlyWarningStudents.has(incident.studentId) && (
                            <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                              ⚠ Early warning
                            </Badge>
                          )}
                          {" "}&middot; {incident.category}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <StatusBadge status={incident.severity} />
                        <StatusBadge status={incident.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                      <span>
                        Reported{" "}
                        {format(
                          parseISO(incident.reportedAt),
                          "MMM d, yyyy"
                        )}
                      </span>
                      {incident.followUps.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {incident.followUps.length} follow-up
                          {incident.followUps.length !== 1 && "s"}
                        </span>
                      )}
                      {(() => {
                        const scheduledFu = incident.followUps.find(
                          (fu) => fu.linkedCalendarEventId
                        );
                        return scheduledFu?.linkedCalendarEventId ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Follow-up scheduled
                          </span>
                        ) : null;
                      })()}
                      {incident.collaboratorNames.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {incident.collaboratorNames.length} collaborator
                          {incident.collaboratorNames.length !== 1 && "s"}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Support Plans Tab ── */}
        <TabsContent value="plans">
          {supportPlans.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No support plans"
              description="Support plans will appear here when created."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportPlans.map((plan) => {
                const student = getStudentById(plan.studentId);
                return (
                  <Card key={plan.id} className="p-5 gap-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold">
                          {plan.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {student
                            ? `${student.firstName} ${student.lastName}`
                            : "Unknown"}
                        </p>
                      </div>
                      <StatusBadge status={plan.status} />
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-3 line-clamp-2">
                      {plan.description}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Next check-in:{" "}
                        {format(parseISO(plan.nextCheckIn), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {plan.notes.length} note
                        {plan.notes.length !== 1 && "s"}
                      </span>
                    </div>
                    {plan.incidentIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {plan.incidentIds.map((iid) => (
                          <Badge
                            key={iid}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {iid}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setPlanSheetOpen(true);
                      }}
                    >
                      Edit Plan
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total incidents"
              value={analytics.total}
              icon={Shield}
            />
            <StatCard
              label="Open"
              value={analytics.openCount}
              icon={Clock}
            />
            <StatCard
              label="Resolved"
              value={analytics.resolvedCount}
              icon={CheckCircle2}
            />
            <StatCard
              label="High severity"
              value={analytics.bySeverity.high}
              icon={AlertTriangle}
            />
          </div>

          {/* Incidents over time trend chart */}
          {analytics.trendData.length > 0 && (
            <Card className="p-5 gap-0 mb-6">
              <h3 className="text-[16px] font-semibold mb-4">Incidents over time</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="incidents"
                      stroke="#c24e3f"
                      strokeWidth={2}
                      dot={{ fill: "#c24e3f", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Severity breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 gap-0">
              <h3 className="text-[16px] font-semibold mb-4">By severity</h3>
              <div className="space-y-3">
                {(["low", "medium", "high"] as const).map((sev) => {
                  const count = analytics.bySeverity[sev];
                  const pct =
                    analytics.total > 0
                      ? Math.round((count / analytics.total) * 100)
                      : 0;
                  return (
                    <div key={sev} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sev} showIcon={false} />
                          <span className="text-[13px] text-muted-foreground">
                            {count} incident{count !== 1 && "s"}
                          </span>
                        </div>
                        <span className="text-[12px] font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            sev === "high"
                              ? "bg-[#dc2626]"
                              : sev === "medium"
                              ? "bg-[#f59e0b]"
                              : "bg-[#2563eb]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5 gap-0">
              <h3 className="text-[16px] font-semibold mb-4">By category</h3>
              {Object.keys(analytics.byCategory).length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No category data available.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(analytics.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                      >
                        <span className="text-[13px] font-medium">{cat}</span>
                        <Badge variant="secondary" className="text-[11px]">
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Log incident Dialog ── */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Log incident</DialogTitle>
            <DialogDescription>
              Record a new student incident
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Student *</Label>
                <Select
                  value={newIncident.studentId}
                  onValueChange={(v) =>
                    setNewIncident((prev) => ({ ...prev, studentId: v }))
                  }
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Class</Label>
                <Select
                  value={newIncident.classId}
                  onValueChange={(v) =>
                    setNewIncident((prev) => ({ ...prev, classId: v }))
                  }
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">Title *</Label>
              <Input
                value={newIncident.title}
                onChange={(e) =>
                  setNewIncident((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Incident title"
                className="text-[13px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">Description</Label>
              <Textarea
                value={newIncident.description}
                onChange={(e) =>
                  setNewIncident((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the incident..."
                className="min-h-[80px] text-[13px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Category *</Label>
                <Select
                  value={newIncident.category}
                  onValueChange={(v) =>
                    setNewIncident((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxonomy.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Severity</Label>
                <Select
                  value={newIncident.severity}
                  onValueChange={(v) =>
                    setNewIncident((prev) => ({
                      ...prev,
                      severity: v as "low" | "medium" | "high",
                    }))
                  }
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {taxonomy.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={
                      newIncident.tags.includes(tag) ? "default" : "outline"
                    }
                    className={`text-[11px] cursor-pointer transition-colors ${
                      newIncident.tags.includes(tag)
                        ? "bg-[#c24e3f] hover:bg-[#a8412f] text-white"
                        : "hover:bg-muted"
                    }`}
                    onClick={() =>
                      setNewIncident((prev) => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter((t) => t !== tag)
                          : [...prev.tags, tag],
                      }))
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogIncident}>Log incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Incident Detail Sheet ── */}
      <Sheet open={incidentSheetOpen} onOpenChange={setIncidentSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedIncident?.title || "Incident"}</SheetTitle>
            <SheetDescription>
              {selectedIncident
                ? `Reported ${format(parseISO(selectedIncident.reportedAt), "MMM d, yyyy 'at' h:mm a")}`
                : ""}
            </SheetDescription>
          </SheetHeader>

          {selectedIncident && (
            <div className="space-y-6 mt-6">
              {/* Status & severity */}
              <div className="flex gap-2">
                <StatusBadge status={selectedIncident.severity} />
                <StatusBadge status={selectedIncident.status} />
                <Badge variant="outline" className="text-[11px]">
                  {selectedIncident.category}
                </Badge>
              </div>

              {/* Description */}
              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-[13px]">
                  {selectedIncident.description || "No description provided."}
                </p>
              </div>

              {/* Student & reporter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground mb-1">
                    Student
                  </p>
                  <p className="text-[13px] font-medium">
                    {(() => {
                      const s = getStudentById(selectedIncident.studentId);
                      return s
                        ? `${s.firstName} ${s.lastName}`
                        : "Unknown";
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground mb-1">
                    Reported by
                  </p>
                  <p className="text-[13px] font-medium">
                    {selectedIncident.reportedBy}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {selectedIncident.tags.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground mb-1.5">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedIncident.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Collaborators */}
              {selectedIncident.collaboratorNames.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground mb-1.5">
                    Collaborators
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIncident.collaboratorNames.map((name) => (
                      <Badge
                        key={name}
                        variant="outline"
                        className="text-[11px]"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Share with counselor */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">Share with counselor</p>
                  <p className="text-[11px] text-muted-foreground">
                    Make this incident visible to the school counselor
                  </p>
                </div>
                <Switch
                  checked={selectedIncident.sharedWithCounselor ?? false}
                  onCheckedChange={(checked) => {
                    updateIncident(selectedIncident.id, { sharedWithCounselor: checked });
                    setSelectedIncident({ ...selectedIncident, sharedWithCounselor: checked });
                  }}
                />
              </div>

              <Separator />

              {/* Follow-up Timeline */}
              <div>
                <p className="text-[13px] font-semibold mb-3">Follow-ups</p>
                {selectedIncident.followUps.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">
                    No follow-ups recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedIncident.followUps.map((fu) => (
                      <div
                        key={fu.id}
                        className="relative pl-4 border-l-2 border-border"
                      >
                        <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-[#c24e3f]" />
                        <p className="text-[13px]">{fu.note}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {fu.createdBy} &middot;{" "}
                          {format(
                            parseISO(fu.createdAt),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                          {fu.linkedCalendarEventId && (
                            <Link
                              href="/operations/calendar"
                              className="ml-2 inline-flex items-center gap-0.5 text-[#2563eb] hover:underline"
                            >
                              <Calendar className="h-3 w-3" />
                              {(fu as { scheduledDate?: string }).scheduledDate
                                ? `Meeting: ${format(parseISO((fu as { scheduledDate?: string }).scheduledDate!), "MMM d, yyyy 'at' h:mm a")}`
                                : "Calendar event linked"}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add follow-up form */}
                <div className="mt-4 space-y-3">
                  <Textarea
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    placeholder="Add a follow-up note..."
                    className="min-h-[60px] text-[13px]"
                  />
                  <label className="flex items-center gap-2 text-[12px] text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={followUpCalendar}
                      onCheckedChange={(checked) => setFollowUpCalendar(checked === true)}
                    />
                    <Calendar className="h-3.5 w-3.5" />
                    Schedule follow-up meeting
                  </label>
                  {followUpCalendar && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[12px]">Date</Label>
                        <Input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="text-[13px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[12px]">Time</Label>
                        <Input
                          type="time"
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
                          className="text-[13px]"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddFollowUp}
                      disabled={!followUpNote.trim()}
                    >
                      Add Follow-up
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                {selectedIncident.status !== "resolved" && (
                  <Button
                    size="sm"
                    onClick={handleResolveIncident}
                    className="bg-[#16a34a] hover:bg-[#15803d]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Resolve
                  </Button>
                )}
                {selectedIncident.severity !== "high" &&
                  selectedIncident.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleEscalateIncident}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      Escalate
                    </Button>
                  )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Taxonomy Manager Dialog ── */}
      <Dialog open={taxonomyDialogOpen} onOpenChange={setTaxonomyDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Add or remove incident categories
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="text-[13px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategoryName.trim()) {
                    if (!localCategories.includes(newCategoryName.trim())) {
                      setLocalCategories((prev) => [...prev, newCategoryName.trim()]);
                    }
                    setNewCategoryName("");
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (newCategoryName.trim() && !localCategories.includes(newCategoryName.trim())) {
                    setLocalCategories((prev) => [...prev, newCategoryName.trim()]);
                    setNewCategoryName("");
                  }
                }}
                disabled={!newCategoryName.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {localCategories.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No categories defined.</p>
            ) : (
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {localCategories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50"
                  >
                    <span className="text-[13px]">{cat}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setLocalCategories((prev) => prev.filter((c) => c !== cat))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaxonomyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateTaxonomy({ ...taxonomy, categories: localCategories });
                setTaxonomyDialogOpen(false);
                toast.success("Categories updated");
              }}
            >
              Save Categories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Support Plan Edit Sheet ── */}
      <Sheet open={planSheetOpen} onOpenChange={setPlanSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedPlan?.title || "Support Plan"}</SheetTitle>
            <SheetDescription>
              {selectedPlan
                ? `Created ${format(parseISO(selectedPlan.createdAt), "MMM d, yyyy")}`
                : ""}
            </SheetDescription>
          </SheetHeader>

          {selectedPlan && (
            <div className="space-y-6 mt-6">
              <div className="flex gap-2">
                <StatusBadge status={selectedPlan.status} />
              </div>

              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-1">
                  Student
                </p>
                <p className="text-[13px] font-medium">
                  {(() => {
                    const s = getStudentById(selectedPlan.studentId);
                    return s
                      ? `${s.firstName} ${s.lastName}`
                      : "Unknown";
                  })()}
                </p>
              </div>

              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-[13px]">{selectedPlan.description}</p>
              </div>

              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-1">
                  Next Check-in
                </p>
                <p className="text-[13px] font-medium">
                  {format(
                    parseISO(selectedPlan.nextCheckIn),
                    "EEEE, MMM d, yyyy"
                  )}
                </p>
              </div>

              <Separator />

              {/* Notes */}
              <div>
                <p className="text-[13px] font-semibold mb-3">Notes</p>
                {selectedPlan.notes.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">
                    No notes recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedPlan.notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-muted/50 text-[13px]"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add note */}
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={editPlanNote}
                    onChange={(e) => setEditPlanNote(e.target.value)}
                    placeholder="Add a note..."
                    className="min-h-[60px] text-[13px]"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddPlanNote}
                    disabled={!editPlanNote.trim()}
                  >
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Linked Incidents */}
              {selectedPlan.incidentIds.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[13px] font-semibold mb-2">
                      Linked Incidents
                    </p>
                    <div className="space-y-1">
                      {selectedPlan.incidentIds.map((iid) => {
                        const inc = incidents.find((i) => i.id === iid);
                        return (
                          <div
                            key={iid}
                            className="flex items-center justify-between py-1.5 text-[13px]"
                          >
                            <span>{inc?.title || iid}</span>
                            {inc && <StatusBadge status={inc.status} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Status toggles */}
              <div className="flex gap-2">
                {selectedPlan.status !== "completed" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      updateSupportPlan(selectedPlan.id, {
                        status: "completed",
                      });
                      setSelectedPlan({
                        ...selectedPlan,
                        status: "completed",
                      });
                      toast.success("Support plan completed");
                    }}
                    className="bg-[#16a34a] hover:bg-[#15803d]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Complete
                  </Button>
                )}
                {selectedPlan.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateSupportPlan(selectedPlan.id, {
                        status: "paused",
                      });
                      setSelectedPlan({
                        ...selectedPlan,
                        status: "paused",
                      });
                      toast.success("Support plan paused");
                    }}
                  >
                    Pause Plan
                  </Button>
                )}
                {selectedPlan.status === "paused" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateSupportPlan(selectedPlan.id, {
                        status: "active",
                      });
                      setSelectedPlan({
                        ...selectedPlan,
                        status: "active",
                      });
                      toast.success("Support plan resumed");
                    }}
                  >
                    Resume Plan
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm escalation */}
      <ConfirmDialog
        open={escalateConfirmOpen}
        onOpenChange={setEscalateConfirmOpen}
        title="Escalate incident?"
        description="This will raise the severity to high and notify relevant staff. This action is difficult to reverse."
        confirmLabel="Escalate"
        onConfirm={confirmEscalateIncident}
        destructive
      />
    </div>
  );
}
