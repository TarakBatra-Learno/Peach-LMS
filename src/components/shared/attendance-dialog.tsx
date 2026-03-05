"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { generateId } from "@/services/mock-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import type { AttendanceRecord } from "@/types/attendance";
import type { AttendanceStatus } from "@/types/common";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the class is pre-selected and locked (not changeable). */
  prefilledClassId?: string;
  /** When provided, the date is pre-filled but the teacher can change it. */
  prefilledDate?: string;
  /** Called after a session is successfully created. */
  onSessionCreated?: () => void;
}

export function AttendanceDialog({
  open,
  onOpenChange,
  prefilledClassId,
  prefilledDate,
  onSessionCreated,
}: AttendanceDialogProps) {
  const classes = useStore((s) => s.classes);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const addAttendanceSession = useStore((s) => s.addAttendanceSession);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const classId = prefilledClassId || "";
      setSelectedClassId(classId);
      setSelectedDate(prefilledDate || format(new Date(), "yyyy-MM-dd"));
      if (classId) {
        const studs = getStudentsByClassId(classId);
        const defaultRecords: Record<string, AttendanceStatus> = {};
        studs.forEach((s) => { defaultRecords[s.id] = "present"; });
        setRecords(defaultRecords);
      } else {
        setRecords({});
      }
      setNotes({});
    }
  }, [open, prefilledClassId, prefilledDate, getStudentsByClassId]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return getStudentsByClassId(selectedClassId);
  }, [selectedClassId, getStudentsByClassId]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const studs = getStudentsByClassId(classId);
    const defaultRecords: Record<string, AttendanceStatus> = {};
    studs.forEach((s) => { defaultRecords[s.id] = "present"; });
    setRecords(defaultRecords);
    setNotes({});
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleCompleteSession = () => {
    if (!selectedClassId) {
      toast.error("Please select a class");
      return;
    }
    if (classStudents.length === 0) {
      toast.error("No students in this class");
      return;
    }

    const attendanceRecords: AttendanceRecord[] = classStudents.map((s) => ({
      studentId: s.id,
      status: records[s.id] || "present",
      arrivedAt: records[s.id] === "late" ? format(new Date(), "HH:mm") : undefined,
      note: notes[s.id]?.trim() || undefined,
    }));

    addAttendanceSession({
      id: generateId("att"),
      classId: selectedClassId,
      date: selectedDate,
      records: attendanceRecords,
      completedAt: new Date().toISOString(),
    });

    toast.success("Attendance session recorded");
    onOpenChange(false);
    onSessionCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Take attendance</DialogTitle>
          <DialogDescription>
            Select a class and mark attendance for each student.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px]">Class</Label>
              {prefilledClassId ? (
                <div className="mt-1.5 h-9 flex items-center px-3 rounded-md border border-input bg-muted/50 text-[13px] text-muted-foreground">
                  {classes.find((c) => c.id === prefilledClassId)?.name || prefilledClassId}
                </div>
              ) : (
                <Select value={selectedClassId} onValueChange={handleClassChange}>
                  <SelectTrigger className="mt-1.5 h-9 text-[13px]">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-[13px]">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1.5 h-9 text-[13px]"
              />
            </div>
          </div>

          {selectedClassId && classStudents.length > 0 && (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {classStudents.map((student) => {
                const dlgStatus = records[student.id] || "present";
                const dlgShowNote = dlgStatus !== "present";
                return (
                  <div
                    key={student.id}
                    className="py-2 px-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium">
                        {student.firstName} {student.lastName}
                      </span>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((opt) => {
                          const isActive = dlgStatus === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(student.id, opt.value)}
                              className={cn(
                                "px-2 py-1 rounded text-[11px] font-medium transition-all border",
                                isActive && opt.value === "present" && "bg-[#dcfce7] text-[#16a34a] border-[#16a34a]/30",
                                isActive && opt.value === "absent" && "bg-[#fee2e2] text-[#dc2626] border-[#dc2626]/30",
                                isActive && opt.value === "late" && "bg-[#fef3c7] text-[#b45309] border-[#b45309]/30",
                                isActive && opt.value === "excused" && "bg-[#dbeafe] text-[#2563eb] border-[#2563eb]/30",
                                !isActive && "bg-background text-muted-foreground border-border hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {dlgShowNote && (
                      <div className="mt-1.5 ml-0">
                        <Input
                          value={notes[student.id] || ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [student.id]: e.target.value }))}
                          placeholder={`Reason for ${dlgStatus}...`}
                          className="h-7 text-[11px]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCompleteSession} disabled={!selectedClassId}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Complete session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
