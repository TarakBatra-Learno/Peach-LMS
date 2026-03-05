"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { FilterBar } from "@/components/shared/filter-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { generateId } from "@/services/mock-service";
import {
  Plus,
  FolderOpen,
  Image,
  Video,
  FileText,
  Music,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Eye,
  Share2,
  History,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import NextLink from "next/link";
import type { PortfolioArtifact } from "@/types/portfolio";

const MEDIA_TYPE_OPTIONS = [
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Document", icon: FileText },
  { value: "audio", label: "Audio", icon: Music },
  { value: "link", label: "Link", icon: LinkIcon },
] as const;

const GOAL_CATEGORY_LABELS: Record<string, string> = {
  standard: "Standards",
  atl_skill: "ATL Skills",
  learner_profile: "Learner Profile",
};

function getMediaIcon(type: string) {
  switch (type) {
    case "image": return Image;
    case "video": return Video;
    case "document": return FileText;
    case "audio": return Music;
    case "link": return LinkIcon;
    default: return FileText;
  }
}

export default function PortfolioPage() {
  const loading = useMockLoading();
  const artifacts = useStore((s) => s.artifacts);
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const learningGoals = useStore((s) => s.learningGoals);
  const addArtifact = useStore((s) => s.addArtifact);
  const updateArtifact = useStore((s) => s.updateArtifact);
  const updateStudent = useStore((s) => s.updateStudent);
  const getPendingArtifacts = useStore((s) => s.getPendingArtifacts);

  // Dialog & sheet state
  const [createOpen, setCreateOpen] = useState(false);
  const [detailArtifact, setDetailArtifact] = useState<PortfolioArtifact | null>(null);

  const activeClassId = useStore((s) => s.ui.activeClassId);

  // Filter state — sync with global class switcher
  const [classFilter, setClassFilter] = useState(activeClassId || "all");
  useEffect(() => {
    setClassFilter(activeClassId || "all");
  }, [activeClassId]);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [byClassSelection, setByClassSelection] = useState("all");

  // Create dialog form state
  const [formTitle, setFormTitle] = useState("");
  const [formStudent, setFormStudent] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMediaType, setFormMediaType] = useState<PortfolioArtifact["mediaType"]>("image");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formGoalIds, setFormGoalIds] = useState<string[]>([]);

  // Detail sheet state
  const [teacherComment, setTeacherComment] = useState("");
  const [familyPreviewOpen, setFamilyPreviewOpen] = useState(false);
  const [studentReflectionText, setStudentReflectionText] = useState("");

  // Group learning goals by category
  const goalsByCategory = useMemo(() => {
    const grouped: Record<string, typeof learningGoals> = {};
    for (const goal of learningGoals) {
      const cat = goal.category || "standard";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(goal);
    }
    return grouped;
  }, [learningGoals]);

  const toggleGoalId = (goalId: string) => {
    setFormGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  // Class-filtered artifacts for stats
  const classFilteredArtifacts = useMemo(() => {
    if (classFilter === "all") return artifacts;
    return artifacts.filter((a) => a.classId === classFilter);
  }, [artifacts, classFilter]);

  // Stats (respect class filter)
  const pendingArtifacts = useMemo(() => classFilteredArtifacts.filter((a) => a.approvalStatus === "pending"), [classFilteredArtifacts]);
  const approvedCount = useMemo(() => classFilteredArtifacts.filter((a) => a.approvalStatus === "approved").length, [classFilteredArtifacts]);
  const sharedCount = useMemo(() => classFilteredArtifacts.filter((a) => a.familyShareStatus === "shared" || a.familyShareStatus === "viewed").length, [classFilteredArtifacts]);

  // Filtered artifacts for "All" tab
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((a) => {
      if (classFilter !== "all" && a.classId !== classFilter) return false;
      if (mediaFilter !== "all" && a.mediaType !== mediaFilter) return false;
      if (statusFilter !== "all" && a.approvalStatus !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const student = students.find((s) => s.id === a.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : "";
        if (!a.title.toLowerCase().includes(q) && !studentName.includes(q)) return false;
      }
      return true;
    });
  }, [artifacts, classFilter, mediaFilter, statusFilter, searchQuery, students]);

  // Artifacts for "By Class" tab
  const byClassArtifacts = useMemo(() => {
    if (byClassSelection === "all") return artifacts;
    return artifacts.filter((a) => a.classId === byClassSelection);
  }, [artifacts, byClassSelection]);

  // Helpers
  const getStudentName = useCallback(
    (id: string) => {
      const s = students.find((st) => st.id === id);
      return s ? `${s.firstName} ${s.lastName}` : "Unknown";
    },
    [students]
  );

  const getClassName = useCallback(
    (id: string) => {
      const c = classes.find((cls) => cls.id === id);
      return c ? c.name : "Unknown";
    },
    [classes]
  );

  const getStudentsForClass = useCallback(
    (classId: string) => {
      const cls = classes.find((c) => c.id === classId);
      if (!cls) return [];
      return students.filter((s) => cls.studentIds.includes(s.id));
    },
    [classes, students]
  );

  // Create handler
  const handleCreate = () => {
    if (!formTitle.trim() || !formStudent || !formClass) {
      toast.error("Please fill in all required fields");
      return;
    }
    const now = new Date().toISOString();
    const artifact: PortfolioArtifact = {
      id: generateId("art"),
      studentId: formStudent,
      classId: formClass,
      title: formTitle.trim(),
      description: formDescription.trim(),
      mediaType: formMediaType,
      mediaUrl: formMediaUrl.trim() || `https://storage.example.com/${formMediaType}s/sample.${formMediaType === "image" ? "jpg" : formMediaType === "video" ? "mp4" : formMediaType === "audio" ? "mp3" : formMediaType === "document" ? "pdf" : "html"}`,
      learningGoalIds: formGoalIds,
      approvalStatus: "pending",
      familyShareStatus: "not_shared",
      createdBy: "teacher",
      createdAt: now,
      updatedAt: now,
      isReportEligible: false,
    };
    addArtifact(artifact);
    toast.success("Artifact added successfully");
    resetForm();
    setCreateOpen(false);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormStudent("");
    setFormClass("");
    setFormDescription("");
    setFormMediaType("image");
    setFormMediaUrl("");
    setFormGoalIds([]);
  };

  // Review actions
  const handleApprove = (id: string) => {
    updateArtifact(id, { approvalStatus: "approved", updatedAt: new Date().toISOString() });
    toast.success("Artifact approved");
    if (detailArtifact?.id === id) {
      setDetailArtifact({ ...detailArtifact, approvalStatus: "approved" });
    }
  };

  const handleRequestRevision = (id: string) => {
    updateArtifact(id, { approvalStatus: "needs_revision", familyShareStatus: "not_shared", updatedAt: new Date().toISOString() });
    toast.info("Revision requested — family share revoked");
    if (detailArtifact?.id === id) {
      setDetailArtifact({ ...detailArtifact, approvalStatus: "needs_revision", familyShareStatus: "not_shared" });
    }
  };

  const handleSaveTeacherComment = () => {
    if (!detailArtifact || !teacherComment.trim()) return;
    const now = new Date().toISOString();
    updateArtifact(detailArtifact.id, {
      reflection: {
        ...(detailArtifact.reflection || { text: "", submittedAt: now }),
        teacherComment: teacherComment.trim(),
        teacherCommentAt: now,
      },
      updatedAt: now,
    });
    toast.success("Comment saved");
  };

  const handleSaveStudentReflection = () => {
    if (!detailArtifact) return;
    const now = new Date().toISOString();
    updateArtifact(detailArtifact.id, {
      reflection: {
        text: studentReflectionText.trim(),
        submittedAt: detailArtifact.reflection?.submittedAt || now,
        teacherComment: detailArtifact.reflection?.teacherComment,
        teacherCommentAt: detailArtifact.reflection?.teacherCommentAt,
      },
      updatedAt: now,
    });
    setDetailArtifact({
      ...detailArtifact,
      reflection: {
        text: studentReflectionText.trim(),
        submittedAt: detailArtifact.reflection?.submittedAt || now,
        teacherComment: detailArtifact.reflection?.teacherComment,
        teacherCommentAt: detailArtifact.reflection?.teacherCommentAt,
      },
    });
    toast.success("Student reflection saved");
  };

  const handleToggleFamilyShare = (checked: boolean) => {
    if (!detailArtifact) return;
    const now = new Date().toISOString();
    const status = checked ? "shared" : "not_shared";
    updateArtifact(detailArtifact.id, { familyShareStatus: status, updatedAt: now });
    setDetailArtifact({ ...detailArtifact, familyShareStatus: status });

    // Create a FamilyShareRecord on the student when sharing
    if (checked) {
      const student = students.find((s) => s.id === detailArtifact.studentId);
      if (student) {
        const record = {
          id: generateId("fsr"),
          type: "portfolio" as const,
          referenceId: detailArtifact.id,
          sharedAt: now,
          status: "shared" as const,
        };
        updateStudent(student.id, {
          familyShareHistory: [...(student.familyShareHistory || []), record],
        });
      }
    }

    toast.success(checked ? "Shared with family" : "Family sharing removed");
  };

  const handleToggleReportEligible = (checked: boolean) => {
    if (!detailArtifact) return;
    updateArtifact(detailArtifact.id, { isReportEligible: checked, updatedAt: new Date().toISOString() });
    setDetailArtifact({ ...detailArtifact, isReportEligible: checked });
    toast.success(checked ? "Added to report" : "Removed from report");
  };

  const openDetail = (artifact: PortfolioArtifact) => {
    setDetailArtifact(artifact);
    setTeacherComment(artifact.reflection?.teacherComment || "");
    setStudentReflectionText(artifact.reflection?.text || "");
  };

  // Auto-filter and auto-open when arriving from a student profile or class detail
  const searchParams = useSearchParams();
  const urlStudentId = searchParams.get("studentId");
  const urlArtifactId = searchParams.get("artifactId");
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (autoOpenedRef.current) return;
    // Filter to the student
    if (urlStudentId && students.length > 0) {
      const student = students.find((s) => s.id === urlStudentId);
      if (student) {
        setSearchQuery(`${student.firstName} ${student.lastName}`);
      }
    }
    // Auto-open the artifact detail Sheet
    if (urlArtifactId && artifacts.length > 0) {
      const artifact = artifacts.find((a) => a.id === urlArtifactId);
      if (artifact) {
        autoOpenedRef.current = true;
        openDetail(artifact);
      }
    }
  }, [urlStudentId, urlArtifactId, students.length, artifacts.length]);

  // Filter configs
  const classFilterOptions = [
    { value: "all", label: "All classes" },
    ...classes.map((c) => ({ value: c.id, label: c.name })),
  ];
  const mediaFilterOptions = [
    { value: "all", label: "All types" },
    ...MEDIA_TYPE_OPTIONS.map((m) => ({ value: m.value, label: m.label })),
  ];
  const statusFilterOptions = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "needs_revision", label: "Needs revision" },
  ];

  // Artifact card component
  const ArtifactCard = ({ artifact, showActions = false }: { artifact: PortfolioArtifact; showActions?: boolean }) => {
    const MediaIcon = getMediaIcon(artifact.mediaType);
    return (
      <Card
        className="p-4 gap-0 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:border-border/80 transition-all cursor-pointer"
        onClick={() => openDetail(artifact)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="rounded-lg bg-muted p-1.5 shrink-0">
              <MediaIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-semibold truncate">{artifact.title}</h3>
              <NextLink href={`/students/${artifact.studentId}`} className="text-[12px] text-[#c24e3f] hover:underline truncate block" onClick={(e) => e.stopPropagation()}>
                {getStudentName(artifact.studentId)}
              </NextLink>
            </div>
          </div>
          <StatusBadge status={artifact.approvalStatus} showIcon={false} />
        </div>
        {artifact.description && (
          <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2">{artifact.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[11px]">{artifact.mediaType}</Badge>
          <span className="text-[11px] text-muted-foreground">
            {format(parseISO(artifact.createdAt), "MMM d, yyyy")}
          </span>
          {artifact.familyShareStatus !== "not_shared" && (
            <Badge variant="outline" className="text-[11px] gap-1">
              <Share2 className="h-2.5 w-2.5" />
              {artifact.familyShareStatus === "viewed" ? "Viewed" : "Shared"}
            </Badge>
          )}
        </div>
        {showActions && artifact.approvalStatus === "pending" && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <Button
              size="sm"
              className="h-7 text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(artifact.id);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                handleRequestRevision(artifact.id);
              }}
            >
              Request revision
            </Button>
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Portfolio" />
        <CardGridSkeleton count={6} />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title="Portfolio"
        description="Student work artifacts and evidence of learning"
        primaryAction={{
          label: "Add artifact",
          onClick: () => setCreateOpen(true),
          icon: Plus,
        }}
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total artifacts" value={classFilteredArtifacts.length} icon={FolderOpen} />
        <StatCard
          label="Pending review"
          value={pendingArtifacts.length}
          icon={Clock}
          trend={pendingArtifacts.length > 5 ? { direction: "up", label: "Needs attention" } : undefined}
        />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle2} />
        <StatCard label="Shared with families" value={sharedCount} icon={Share2} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="text-[13px]">All artifacts</TabsTrigger>
          <TabsTrigger value="review" className="text-[13px]">
            Review queue
            {pendingArtifacts.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[11px] h-5 px-1.5">{pendingArtifacts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="by-class" className="text-[13px]">By class</TabsTrigger>
        </TabsList>

        {/* All artifacts tab */}
        <TabsContent value="all">
          <FilterBar
            filters={[
              { key: "class", label: "Class", options: classFilterOptions, value: classFilter, onChange: setClassFilter },
              { key: "media", label: "Media type", options: mediaFilterOptions, value: mediaFilter, onChange: setMediaFilter },
              { key: "status", label: "Status", options: statusFilterOptions, value: statusFilter, onChange: setStatusFilter },
            ]}
            onSearch={setSearchQuery}
            searchPlaceholder="Search artifacts..."
          />
          {filteredArtifacts.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No artifacts found"
              description="No artifacts match your current filters. Try adjusting your search or add a new artifact."
              action={{ label: "Add artifact", onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Review queue tab */}
        <TabsContent value="review">
          {pendingArtifacts.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up!"
              description="No artifacts are waiting for review. Great job staying on top of things."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        {/* By class tab */}
        <TabsContent value="by-class">
          <div className="mb-4">
            <Select value={byClassSelection} onValueChange={setByClassSelection}>
              <SelectTrigger className="w-[240px] h-9 text-[13px]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {byClassArtifacts.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No artifacts"
              description={byClassSelection === "all" ? "No artifacts have been added yet." : "No artifacts for this class yet."}
              action={{ label: "Add artifact", onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {byClassArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create artifact dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add artifact</DialogTitle>
            <DialogDescription>Add a new student work artifact to the portfolio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Title *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Watercolor landscape painting"
                className="text-[13px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Class *</Label>
                <Select value={formClass} onValueChange={(v) => { setFormClass(v); setFormStudent(""); }}>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Student *</Label>
                <Select value={formStudent} onValueChange={setFormStudent} disabled={!formClass}>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder={formClass ? "Select student" : "Select class first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formClass && getStudentsForClass(formClass).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the student's work..."
                className="text-[13px] min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Media type</Label>
                <Select value={formMediaType} onValueChange={(v) => setFormMediaType(v as PortfolioArtifact["mediaType"])}>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Media URL</Label>
                <Input
                  value={formMediaUrl}
                  onChange={(e) => setFormMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-[13px]"
                />
              </div>
            </div>

            {/* Learning goals picker */}
            <div className="space-y-2">
              <Label className="text-[13px]">Learning goals</Label>
              {(["standard", "atl_skill", "learner_profile"] as const).map(
                (category) =>
                  goalsByCategory[category] &&
                  goalsByCategory[category].length > 0 && (
                    <div key={category}>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {GOAL_CATEGORY_LABELS[category]}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {goalsByCategory[category].map((goal) => (
                          <Badge
                            key={goal.id}
                            variant={
                              formGoalIds.includes(goal.id)
                                ? "default"
                                : "outline"
                            }
                            className={`text-[11px] cursor-pointer transition-colors ${
                              formGoalIds.includes(goal.id)
                                ? "bg-[#c24e3f] text-white hover:bg-[#c24e3f]/90"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => toggleGoalId(goal.id)}
                          >
                            {goal.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Add artifact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Family preview dialog */}
      <Dialog open={familyPreviewOpen} onOpenChange={setFamilyPreviewOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Family Portal Preview</DialogTitle>
            <DialogDescription className="text-[12px]">
              This is how the artifact appears to parents/guardians.
            </DialogDescription>
          </DialogHeader>
          {detailArtifact && (() => {
            const stu = students.find((s) => s.id === detailArtifact.studentId);
            const MediaIcon = getMediaIcon(detailArtifact.mediaType);
            return (
              <div className="space-y-4 py-2">
                {/* Family-friendly header */}
                <div className="rounded-lg bg-[#c24e3f]/5 border border-[#c24e3f]/10 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-lg bg-[#c24e3f]/10 p-2">
                      <MediaIcon className="h-5 w-5 text-[#c24e3f]" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold">{detailArtifact.title}</h3>
                      <p className="text-[12px] text-muted-foreground">
                        {stu ? `${stu.firstName} ${stu.lastName}` : "Student"} &middot; {getClassName(detailArtifact.classId)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    {format(parseISO(detailArtifact.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>

                {/* Description (visible to family) */}
                {detailArtifact.description && (
                  <div>
                    <p className="text-[13px]">{detailArtifact.description}</p>
                  </div>
                )}

                {/* Student reflection (visible to family) */}
                {detailArtifact.reflection?.text && (
                  <div>
                    <h4 className="text-[12px] font-medium text-muted-foreground mb-1">Student Reflection</h4>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-[13px]">{detailArtifact.reflection.text}</p>
                    </div>
                  </div>
                )}

                {/* Teacher comment (visible if saved) */}
                {detailArtifact.reflection?.teacherComment && (
                  <div>
                    <h4 className="text-[12px] font-medium text-muted-foreground mb-1">Teacher Feedback</h4>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-[13px]">{detailArtifact.reflection.teacherComment}</p>
                    </div>
                  </div>
                )}

                {/* Note: internal-only fields are stripped */}
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground italic">
                    Internal fields (approval status, teacher-only notes, report eligibility) are hidden from family view.
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFamilyPreviewOpen(false)}>
              Close preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Artifact detail sheet */}
      <Sheet open={!!detailArtifact} onOpenChange={(open) => { if (!open) setDetailArtifact(null); }}>
        <SheetContent className="w-full sm:max-w-[480px]">
          {detailArtifact && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[16px]">{detailArtifact.title}</SheetTitle>
                <SheetDescription className="text-[13px]">
                  <NextLink href={`/students/${detailArtifact.studentId}`} className="text-[#c24e3f] hover:underline">
                    {getStudentName(detailArtifact.studentId)}
                  </NextLink>
                  {" "}&middot; {getClassName(detailArtifact.classId)}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 mt-6">
                {/* Status & meta */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={detailArtifact.approvalStatus} />
                  <Badge variant="outline" className="text-[11px] gap-1">
                    {(() => { const Icon = getMediaIcon(detailArtifact.mediaType); return <Icon className="h-3 w-3" />; })()}
                    {detailArtifact.mediaType}
                  </Badge>
                  <StatusBadge status={detailArtifact.familyShareStatus} />
                </div>

                {/* Description */}
                {detailArtifact.description && (
                  <div>
                    <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</h4>
                    <p className="text-[13px] text-foreground">{detailArtifact.description}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Created</h4>
                    <p className="text-[13px]">{format(parseISO(detailArtifact.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                  <div>
                    <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Created by</h4>
                    <p className="text-[13px] capitalize">{detailArtifact.createdBy}</p>
                  </div>
                </div>

                {/* Learning goals */}
                {detailArtifact.learningGoalIds.length > 0 && (
                  <div>
                    <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Learning goals</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {detailArtifact.learningGoalIds.map((goalId) => {
                        const goal = learningGoals.find((g) => g.id === goalId);
                        return (
                          <Badge key={goalId} variant="outline" className="text-[11px]">
                            {goal?.title || goalId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <NextLink
                  href={`/students/${detailArtifact.studentId}?tab=portfolio`}
                  className="flex items-center gap-2 text-[13px] font-medium text-[#c24e3f] hover:underline"
                >
                  View student portfolio
                  <ArrowRight className="h-3.5 w-3.5" />
                </NextLink>

                <Separator />

                {/* Student Comments / Reflection */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Student reflection</h4>
                  </div>
                  {detailArtifact.reflection?.text && detailArtifact.reflection.submittedAt && (
                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      Submitted {format(parseISO(detailArtifact.reflection.submittedAt), "MMM d, yyyy")}
                    </p>
                  )}
                  <Textarea
                    value={studentReflectionText}
                    onChange={(e) => setStudentReflectionText(e.target.value)}
                    placeholder="Add or edit student reflection..."
                    className="text-[13px] min-h-[70px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-[12px]"
                    onClick={handleSaveStudentReflection}
                    disabled={!studentReflectionText.trim()}
                  >
                    Save reflection
                  </Button>
                </div>

                {/* Teacher comment */}
                <div>
                  <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Teacher comment</h4>
                  <Textarea
                    value={teacherComment}
                    onChange={(e) => setTeacherComment(e.target.value)}
                    placeholder="Add your feedback for this artifact..."
                    className="text-[13px] min-h-[80px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-[12px]"
                    onClick={handleSaveTeacherComment}
                    disabled={!teacherComment.trim()}
                  >
                    Save comment
                  </Button>
                </div>

                <Separator />

                {/* Share History */}
                {(() => {
                  const stu = students.find((s) => s.id === detailArtifact.studentId);
                  const shareRecords = stu?.familyShareHistory.filter(
                    (sh) => sh.type === "portfolio" && sh.referenceId === detailArtifact.id
                  ) || [];
                  return (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Share history</h4>
                      </div>
                      {shareRecords.length === 0 && detailArtifact.familyShareStatus === "not_shared" ? (
                        <p className="text-[12px] text-muted-foreground">Not yet shared with family.</p>
                      ) : (
                        <div className="space-y-2">
                          {/* Current share status */}
                          <div className="flex items-center gap-2">
                            <StatusBadge status={detailArtifact.familyShareStatus} />
                            {stu && (
                              <span className="text-[12px] text-muted-foreground">
                                {stu.parentName} ({stu.parentEmail})
                              </span>
                            )}
                          </div>
                          {/* Share records from student history */}
                          {shareRecords.map((record) => (
                            <div key={record.id} className="rounded-lg bg-muted/50 p-2.5 text-[12px]">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Shared {format(parseISO(record.sharedAt), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                                <StatusBadge status={record.status} showIcon={false} />
                              </div>
                              {record.viewedAt && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Viewed {format(parseISO(record.viewedAt), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <Separator />

                {/* Family Share Info */}
                {(() => {
                  const stu = students.find((s) => s.id === detailArtifact.studentId);
                  return stu ? (
                    <div className="rounded-lg border border-border p-3 bg-muted/30">
                      <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Recipient</h4>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[12px] font-medium text-muted-foreground">
                          {stu.parentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium">{stu.parentName}</p>
                          <p className="text-[12px] text-muted-foreground">{stu.parentEmail}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-[12px] w-full"
                        onClick={() => setFamilyPreviewOpen(true)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Preview as family
                      </Button>
                    </div>
                  ) : null;
                })()}

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">Share with family</p>
                      <p className="text-[12px] text-muted-foreground">Make this artifact visible to parents</p>
                    </div>
                    <Switch
                      checked={detailArtifact.familyShareStatus !== "not_shared"}
                      onCheckedChange={handleToggleFamilyShare}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">Add to report</p>
                      <p className="text-[12px] text-muted-foreground">Include as evidence in student report</p>
                    </div>
                    <Switch
                      checked={detailArtifact.isReportEligible}
                      onCheckedChange={handleToggleReportEligible}
                    />
                  </div>
                </div>

                <Separator />

                {/* Approval actions */}
                {detailArtifact.approvalStatus === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleApprove(detailArtifact.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRequestRevision(detailArtifact.id)}>
                      Request revision
                    </Button>
                  </div>
                )}
                {detailArtifact.approvalStatus !== "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updateArtifact(detailArtifact.id, { approvalStatus: "pending", familyShareStatus: "not_shared", updatedAt: new Date().toISOString() });
                        setDetailArtifact({ ...detailArtifact, approvalStatus: "pending", familyShareStatus: "not_shared" });
                        toast.info("Status reset to pending — family share revoked");
                      }}
                    >
                      Reset to pending
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
