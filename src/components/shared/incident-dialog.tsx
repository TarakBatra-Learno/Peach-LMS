"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string;
  classId?: string;
}

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

const DEFAULT_CATEGORY_OPTIONS = [
  { value: "academic", label: "Academic" },
  { value: "behavioral", label: "Behavioural" },
  { value: "attendance", label: "Attendance" },
  { value: "other", label: "Other" },
] as const;

export function IncidentDialog({
  open,
  onOpenChange,
  studentId: initialStudentId,
  classId: initialClassId,
}: IncidentDialogProps) {
  const addIncident = useStore((s) => s.addIncident);
  const students = useStore((s) => s.students);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const taxonomy = useStore((s) => s.taxonomy);

  // Use taxonomy categories from store, fallback to hardcoded defaults
  const categoryOptions = taxonomy.categories.length > 0
    ? taxonomy.categories.map((c) => ({ value: c.toLowerCase(), label: c }))
    : DEFAULT_CATEGORY_OPTIONS;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("medium");
  const [category, setCategory] = useState<string>("behavioral");
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId ?? "");
  const [selectedClassId] = useState(initialClassId ?? "");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setCategory("behavioral");
      setSelectedStudentId(initialStudentId ?? "");
    }
  }, [open, initialStudentId]);

  // Determine available students for the selector
  const availableStudents = initialClassId
    ? getStudentsByClassId(initialClassId)
    : students;

  const handleCreate = () => {
    if (!title.trim()) return;
    if (!selectedStudentId) return;

    addIncident({
      id: generateId("inc"),
      studentId: selectedStudentId,
      classId: selectedClassId || undefined,
      title: title.trim(),
      description: description.trim(),
      category,
      tags: [],
      severity: severity as "low" | "medium" | "high",
      reportedBy: "Current Teacher",
      reportedAt: new Date().toISOString(),
      collaboratorNames: [],
      followUps: [],
      status: "open",
    });

    toast.success("Incident logged", {
      description: `"${title.trim()}" has been recorded.`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#c24e3f]" />
            Log incident
          </DialogTitle>
          <DialogDescription>
            Record a new incident for tracking and follow-up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="incident-title" className="text-[13px]">
              Title <span className="text-[#dc2626]">*</span>
            </Label>
            <Input
              id="incident-title"
              placeholder="Brief incident title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-[13px]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="incident-description" className="text-[13px]">
              Description
            </Label>
            <Textarea
              id="incident-description"
              placeholder="Describe what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[13px] min-h-[80px] resize-none"
            />
          </div>

          {/* Severity & Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="h-9 w-full text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 w-full text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student selector (shown when no studentId is pre-filled) */}
          {!initialStudentId && (
            <div className="space-y-1.5">
              <Label className="text-[13px]">
                Student <span className="text-[#dc2626]">*</span>
              </Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="h-9 w-full text-[13px]">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-[13px]">
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-[13px]">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || !selectedStudentId}
            className="text-[13px]"
          >
            Log incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
