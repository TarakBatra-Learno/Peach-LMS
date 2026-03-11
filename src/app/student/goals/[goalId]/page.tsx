"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  getGoalEvidenceLinks,
  getStudentClasses,
  resolveEvidenceSource,
} from "@/lib/student-selectors";
import { GoalEvidencePicker } from "@/components/student/goal-evidence-picker";
import { toast } from "sonner";
import {
  Target,
  Plus,
  AlertCircle,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  Archive,
  FolderOpen,
  FileText,
  BookOpen,
  PenLine,
  ExternalLink,
  MoreHorizontal,
  X,
  Save,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import Link from "next/link";
import type { GoalEvidenceSourceType } from "@/types/goal-evidence";

const SOURCE_ICONS: Record<GoalEvidenceSourceType, typeof FolderOpen> = {
  portfolio_artifact: FolderOpen,
  submission: FileText,
  report: BookOpen,
  manual: PenLine,
};

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;
  const studentId = useStudentId();
  const loading = useMockLoading([goalId]);
  const state = useStore((s) => s);
  const updateStudentGoal = useStore((s) => s.updateStudentGoal);
  const deleteStudentGoal = useStore((s) => s.deleteStudentGoal);
  const deleteGoalEvidenceLink = useStore((s) => s.deleteGoalEvidenceLink);
  const updateGoalEvidenceLink = useStore((s) => s.updateGoalEvidenceLink);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [editReflection, setEditReflection] = useState("");

  const goal = useMemo(
    () => state.studentGoals.find((g) => g.id === goalId && g.studentId === studentId),
    [state.studentGoals, goalId, studentId]
  );

  const evidenceLinks = useMemo(
    () => getGoalEvidenceLinks(state, goalId),
    [state, goalId]
  );

  const enrolledClasses = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );

  if (loading) return <DetailSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Not signed in"
        description="Please sign in as a student."
      />
    );
  }

  if (!goal) {
    return (
      <EmptyState
        icon={Target}
        title="Goal not found"
        description="This goal may have been deleted."
      />
    );
  }

  const linkedClasses = goal.linkedClassIds
    .map((id) => enrolledClasses.find((c) => c.id === id))
    .filter(Boolean);

  const linkedLearningGoals = state.learningGoals.filter((lg) =>
    goal.linkedLearningGoalIds.includes(lg.id)
  );

  const startEdit = () => {
    setEditTitle(goal.title);
    setEditDescription(goal.description);
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!editTitle.trim()) return;
    updateStudentGoal(goalId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
    setEditMode(false);
    toast.success("Goal updated");
  };

  const handleStatusChange = (status: "completed" | "archived") => {
    updateStudentGoal(goalId, { status });
    toast.success(status === "completed" ? "Goal marked as completed" : "Goal archived");
  };

  const handleReactivate = () => {
    updateStudentGoal(goalId, { status: "active" });
    toast.success("Goal reactivated");
  };

  const handleDelete = () => {
    deleteStudentGoal(goalId);
    toast.success("Goal deleted");
    router.push("/student/goals");
  };

  const handleDeleteEvidence = (evidenceId: string) => {
    deleteGoalEvidenceLink(evidenceId);
    toast.success("Evidence removed");
  };

  const startEditEvidence = (evidenceId: string, currentReflection: string) => {
    setEditingEvidenceId(evidenceId);
    setEditReflection(currentReflection);
  };

  const saveEditEvidence = () => {
    if (!editingEvidenceId || !editReflection.trim()) return;
    updateGoalEvidenceLink(editingEvidenceId, { reflection: editReflection.trim() });
    setEditingEvidenceId(null);
    setEditReflection("");
    toast.success("Reflection updated");
  };

  return (
    <div>
      {/* Back link */}
      <Link
        href="/student/goals"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to goals
      </Link>

      {/* Header */}
      {editMode ? (
        <Card className="p-4 gap-0 mb-6">
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Title
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-[14px] mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="text-[13px] mt-1 min-h-[60px]"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-[12px]" onClick={saveEdit} disabled={!editTitle.trim()}>
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" className="text-[12px]" onClick={() => setEditMode(false)}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-semibold">{goal.title}</h1>
              <StatusBadge status={goal.status} />
            </div>
            {goal.description && (
              <p className="text-[14px] text-muted-foreground mt-1">{goal.description}</p>
            )}
            <p className="text-[12px] text-muted-foreground mt-1.5">
              Created {format(new Date(goal.createdAt), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="text-[12px]" onClick={() => setPickerOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add evidence
            </Button>
            <Button size="sm" variant="outline" className="text-[12px]" onClick={startEdit}>
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-[12px] px-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {goal.status === "active" ? (
                  <>
                    <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                      Mark completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                      <Archive className="h-3.5 w-3.5 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleReactivate}>
                    <Target className="h-3.5 w-3.5 mr-2" />
                    Reactivate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Context section */}
      {(linkedClasses.length > 0 || linkedLearningGoals.length > 0) && (
        <Card className="p-4 gap-0 mb-6">
          <h3 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Context
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {linkedClasses.map((cls) => (
              <Badge key={cls!.id} variant="outline" className="text-[11px]">
                {cls!.name}
              </Badge>
            ))}
            {linkedLearningGoals.map((lg) => (
              <Badge key={lg.id} variant="secondary" className="text-[11px]">
                {lg.code}: {lg.title}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Evidence timeline */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold">
          Evidence ({evidenceLinks.length})
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="text-[12px]"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add evidence
        </Button>
      </div>

      {evidenceLinks.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No evidence yet"
          description="Add your first piece of evidence — a portfolio item, submission, or report — to start building a record of your growth."
        />
      ) : (
        <div className="space-y-3">
          {evidenceLinks.map((link) => {
            const resolved = resolveEvidenceSource(state, link);
            const Icon = SOURCE_ICONS[link.sourceType] ?? FileText;
            const isEditing = editingEvidenceId === link.id;

            return (
              <Card key={link.id} className="p-4 gap-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">{resolved.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        {resolved.subtitle && <span>{resolved.subtitle}</span>}
                        <span>{format(new Date(link.addedAt), "MMM d, yyyy")}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {link.sourceType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        isEditing
                          ? saveEditEvidence()
                          : startEditEvidence(link.id, link.reflection)
                      }
                    >
                      {isEditing ? (
                        <Save className="h-3.5 w-3.5" />
                      ) : (
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDeleteEvidence(link.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Reflection */}
                {isEditing ? (
                  <div className="mt-3 ml-11">
                    <Textarea
                      value={editReflection}
                      onChange={(e) => setEditReflection(e.target.value)}
                      className="text-[13px] min-h-[60px]"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="text-[11px] h-7" onClick={saveEditEvidence}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7"
                        onClick={() => setEditingEvidenceId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 ml-11 bg-muted/40 rounded-lg px-3 py-2">
                    <p className="text-[13px] text-foreground/80 leading-relaxed">
                      {link.reflection}
                    </p>
                  </div>
                )}

                {/* Media link for manual evidence */}
                {link.sourceType === "manual" && link.manualMediaUrl && (
                  <div className="mt-2 ml-11">
                    <a
                      href={link.manualMediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] text-[#c24e3f] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Attached media
                    </a>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <GoalEvidencePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        goalId={goalId}
        studentId={studentId}
      />
    </div>
  );
}
