"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Trash2,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/stores";
import type { LearningGoal } from "@/types/assessment";
import type {
  LessonPlan,
  LessonActivity,
  LessonSlotAssignment,
} from "@/types/unit-planning";
import { getDemoNow } from "@/lib/demo-time";

interface LessonPlanDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonPlan: LessonPlan | null;
  learningGoals: LearningGoal[];
  assignment?: LessonSlotAssignment;
}

const ACTIVITY_TYPES = [
  { value: "intro", label: "Introduction" },
  { value: "direct_instruction", label: "Direct Instruction" },
  { value: "group_work", label: "Group Work" },
  { value: "individual", label: "Individual Work" },
  { value: "discussion", label: "Discussion" },
  { value: "assessment", label: "Assessment" },
  { value: "reflection", label: "Reflection" },
  { value: "other", label: "Other" },
] as const;

export function LessonPlanDrawer({
  open,
  onOpenChange,
  lessonPlan,
  learningGoals,
  assignment,
}: LessonPlanDrawerProps) {
  const titleFieldId = "lesson-plan-title";
  const objectiveFieldId = "lesson-plan-objective";
  const teachingNotesFieldId = "lesson-plan-notes";
  const reflectionFieldId = "lesson-plan-reflection";
  const updateLessonPlan = useStore((s) => s.updateLessonPlan);
  const unassignLessonFromSlot = useStore((s) => s.unassignLessonFromSlot);

  const [title, setTitle] = useState(() => lessonPlan?.title ?? "");
  const [objectives, setObjectives] = useState<string[]>(() => [
    ...(lessonPlan?.objectives || []),
  ]);
  const [newObjective, setNewObjective] = useState("");
  const [activities, setActivities] = useState<LessonActivity[]>(() => [
    ...(lessonPlan?.activities ?? []),
  ]);
  const [teachingNotes, setTeachingNotes] = useState(
    () => lessonPlan?.teachingNotes || ""
  );
  const [linkedStandardIds, setLinkedStandardIds] = useState<string[]>(() => [
    ...(lessonPlan?.linkedStandardIds ?? []),
  ]);
  const [reflection, setReflection] = useState(
    () => lessonPlan?.teacherReflection || ""
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => lessonPlan?.updatedAt ?? null);

  if (!lessonPlan) return null;

  const canMarkReady =
    title.trim().length > 0 && (objectives.length > 0 || activities.length > 0);

  const handleSave = () => {
    const savedAt = getDemoNow().toISOString();
    updateLessonPlan(lessonPlan.id, {
      title,
      objectives,
      activities,
      teachingNotes: teachingNotes || undefined,
      linkedStandardIds,
      teacherReflection: reflection || undefined,
      updatedAt: savedAt,
    });
    setLastSavedAt(savedAt);
    toast.success("Lesson plan updated");
  };

  const handleStatusChange = (newStatus: LessonPlan["status"]) => {
    if (newStatus === "ready" && lessonPlan.status === "assigned") {
      unassignLessonFromSlot(lessonPlan.id);
      toast.success("Lesson unassigned and set to Ready");
    } else {
      updateLessonPlan(lessonPlan.id, {
        status: newStatus,
        updatedAt: getDemoNow().toISOString(),
      });
      const labels: Record<string, string> = {
        ready: "Marked as Ready",
        taught: "Marked as Taught",
        skipped: "Marked as Skipped",
        cancelled: "Lesson Cancelled",
      };
      toast.success(labels[newStatus] || "Status updated");
    }
  };

  // Activity management
  const addActivity = () => {
    const newAct: LessonActivity = {
      id: `act_new_${Date.now()}`,
      title: "New Activity",
      type: "other",
      order: activities.length + 1,
    };
    setActivities((prev) => [...prev, newAct]);
  };

  const updateActivity = (
    index: number,
    updates: Partial<LessonActivity>
  ) => {
    setActivities((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...updates } : a))
    );
  };

  const removeActivity = (index: number) => {
    setActivities((prev) =>
      prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, order: i + 1 }))
    );
  };

  const moveActivity = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= activities.length) return;
    const newActivities = [...activities];
    [newActivities[index], newActivities[newIndex]] = [
      newActivities[newIndex],
      newActivities[index],
    ];
    setActivities(
      newActivities.map((a, i) => ({ ...a, order: i + 1 }))
    );
  };

  const toggleStandard = (id: string) => {
    setLinkedStandardIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const dayLabels: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1">Lesson Plan</SheetTitle>
            <Badge variant="outline" className="text-[11px]">
              #{lessonPlan.sequence}
            </Badge>
            <StatusBadge status={lessonPlan.status} showIcon={false} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-5 pb-6">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor={titleFieldId} className="text-[13px]">
                Title
              </Label>
              <Input
                id={titleFieldId}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-[13px]"
              />
            </div>

            {/* Status actions */}
            <div className="flex flex-wrap gap-2">
              {lessonPlan.status === "draft" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("ready")}
                  disabled={!canMarkReady}
                >
                  Mark as Ready
                </Button>
              )}
              {lessonPlan.status === "assigned" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange("taught")}
                  >
                    Mark as Taught
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange("ready")}
                  >
                    Unassign
                  </Button>
                </>
              )}
              {lessonPlan.status !== "taught" &&
                lessonPlan.status !== "skipped" &&
                lessonPlan.status !== "cancelled" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => handleStatusChange("skipped")}
                  >
                    Skip Lesson
                  </Button>
                )}
            </div>
            {lessonPlan.status === "draft" && !canMarkReady ? (
              <p className="text-[12px] text-muted-foreground">
                Add at least one objective or activity before marking this lesson ready.
              </p>
            ) : null}
            {lastSavedAt ? (
              <p className="text-[12px] text-muted-foreground">
                Saved {new Date(lastSavedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}

            {/* Assignment info */}
            {assignment && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {dayLabels[assignment.slotDay]}, {assignment.date}
                  </span>
                  <Clock className="h-3.5 w-3.5 ml-2" />
                  <span>{assignment.slotStartTime}</span>
                </div>
              </div>
            )}
            {!assignment &&
              lessonPlan.status !== "assigned" &&
              lessonPlan.status !== "taught" && (
                <p className="text-[12px] text-muted-foreground italic">
                  This lesson is not scheduled yet. Keep refining it here, then place it into a
                  teaching slot once it is ready.
                </p>
              )}

            <Separator />

            {/* Objectives */}
            <div className="space-y-2">
              <Label htmlFor={objectiveFieldId} className="text-[13px]">
                Objectives
              </Label>
              <div className="space-y-1.5">
                {objectives.map((obj, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted text-[13px]"
                  >
                    <span className="flex-1">{obj}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() =>
                        setObjectives((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id={objectiveFieldId}
                  placeholder="Add an objective..."
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newObjective.trim()) {
                      setObjectives((prev) => [...prev, newObjective.trim()]);
                      setNewObjective("");
                    }
                  }}
                  className="text-[13px]"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (newObjective.trim()) {
                      setObjectives((prev) => [...prev, newObjective.trim()]);
                      setNewObjective("");
                    }
                  }}
                  disabled={!newObjective.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Activities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Activities</Label>
                <Button variant="ghost" size="sm" onClick={addActivity}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {activities.map((act, i) => (
                  <div
                    key={act.id}
                    className="border rounded-md p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 shrink-0"
                      >
                        {i + 1}
                      </Badge>
                      <Input
                        value={act.title}
                        onChange={(e) =>
                          updateActivity(i, { title: e.target.value })
                        }
                        className="text-[12px] h-7 flex-1"
                      />
                      <div className="flex gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveActivity(i, "up")}
                          disabled={i === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveActivity(i, "down")}
                          disabled={i === activities.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeActivity(i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={act.type}
                        onValueChange={(v) =>
                          updateActivity(i, {
                            type: v as LessonActivity["type"],
                          })
                        }
                      >
                        <SelectTrigger className="h-7 text-[11px] w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map((t) => (
                            <SelectItem
                              key={t.value}
                              value={t.value}
                              className="text-[12px]"
                            >
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={act.durationMinutes || ""}
                        onChange={(e) =>
                          updateActivity(i, {
                            durationMinutes: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="min"
                        className="h-7 text-[11px] w-[70px]"
                      />
                    </div>
                    <Textarea
                      value={act.description || ""}
                      onChange={(e) =>
                        updateActivity(i, {
                          description: e.target.value || undefined,
                        })
                      }
                      placeholder="Description (optional)"
                      className="text-[12px] min-h-[40px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Teaching Notes */}
            <div className="space-y-1.5">
              <Label htmlFor={teachingNotesFieldId} className="text-[13px]">
                Teaching Notes
              </Label>
              <Textarea
                id={teachingNotesFieldId}
                value={teachingNotes}
                onChange={(e) => setTeachingNotes(e.target.value)}
                placeholder="Private notes for this lesson..."
                className="text-[13px] min-h-[60px]"
              />
            </div>

            {/* Standards */}
            <div className="space-y-2">
              <Label className="text-[13px]">Standards Addressed</Label>
              <div className="flex flex-wrap gap-1.5">
                {learningGoals.map((lg) => (
                  <Badge
                    key={lg.id}
                    variant={
                      linkedStandardIds.includes(lg.id) ? "default" : "outline"
                    }
                    className="cursor-pointer text-[11px] px-2 py-0.5"
                    onClick={() => toggleStandard(lg.id)}
                  >
                    {lg.code}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Reflection (taught only) */}
            {(lessonPlan.status === "taught" ||
              lessonPlan.status === "assigned") && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <Label htmlFor={reflectionFieldId} className="text-[13px]">
                    Teacher Reflection
                  </Label>
                  <Textarea
                    id={reflectionFieldId}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="How did the lesson go? What would you change?"
                    className="text-[13px] min-h-[80px]"
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
