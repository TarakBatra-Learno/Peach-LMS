"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import type { LessonPlan, MaterializedOccurrence } from "@/types/unit-planning";

interface AssignLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrence: MaterializedOccurrence | null;
  readyLessonPlans: LessonPlan[];
  onAssign: (lessonPlanId: string) => void;
}

export function AssignLessonDialog({
  open,
  onOpenChange,
  occurrence,
  readyLessonPlans,
  onAssign,
}: AssignLessonDialogProps) {
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const handleConfirm = () => {
    if (selectedLessonId) {
      onAssign(selectedLessonId);
      setSelectedLessonId("");
      onOpenChange(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setSelectedLessonId("");
    onOpenChange(v);
  };

  if (!occurrence) return null;

  const dayLabels: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Assign Lesson Plan</DialogTitle>
          <DialogDescription>
            Choose a ready lesson plan to assign to this timetable slot.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
          <p className="text-[13px] font-medium">
            {dayLabels[occurrence.slotDay]}, {occurrence.date}
          </p>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {occurrence.slotStartTime} – {occurrence.slotEndTime}
            </span>
            {occurrence.room && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {occurrence.room}
              </span>
            )}
          </div>
        </div>

        {readyLessonPlans.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-4">
            No ready lesson plans available. Mark lesson plans as &quot;Ready&quot;
            before assigning them.
          </p>
        ) : (
          <div className="space-y-2">
            <label className="text-[13px] font-medium">Lesson Plan</label>
            <Select
              value={selectedLessonId}
              onValueChange={setSelectedLessonId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lesson plan..." />
              </SelectTrigger>
              <SelectContent>
                {readyLessonPlans.map((lp) => (
                  <SelectItem key={lp.id} value={lp.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1">
                        #{lp.sequence}
                      </Badge>
                      {lp.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedLessonId || readyLessonPlans.length === 0}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
