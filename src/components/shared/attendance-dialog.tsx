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
import { format, addDays, getDay, subDays } from "date-fns";
import { CheckCircle2, CalendarDays, AlertTriangle } from "lucide-react";
import type { AttendanceRecord } from "@/types/attendance";
import type { AttendanceStatus } from "@/types/common";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

const DAY_MAP: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5,
};
const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri",
};

interface ScheduledSession {
  date: string; // yyyy-MM-dd
  dayLabel: string;
  startTime: string;
  endTime: string;
  room?: string;
  taken: boolean;
}

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
  const attendanceSessions = useStore((s) => s.attendanceSessions);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [useCustomDate, setUseCustomDate] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const classId = prefilledClassId || "";
      setSelectedClassId(classId);
      setSelectedDate(prefilledDate || format(new Date(), "yyyy-MM-dd"));
      setUseCustomDate(false);
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

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Generate scheduled sessions for the selected class
  const scheduledSessions = useMemo((): ScheduledSession[] => {
    if (!selectedClass) return [];
    const today = new Date();
    const sessions: ScheduledSession[] = [];

    // Look back 7 days and forward 21 days
    for (let d = -7; d <= 21; d++) {
      const date = d < 0 ? subDays(today, Math.abs(d)) : addDays(today, d);
      const jsDay = getDay(date); // 0=Sun, 1=Mon...
      const dateStr = format(date, "yyyy-MM-dd");

      for (const slot of selectedClass.schedule) {
        const slotDay = DAY_MAP[slot.day];
        if (slotDay === jsDay) {
          const taken = attendanceSessions.some(
            (s) => s.classId === selectedClassId && s.date === dateStr
          );
          sessions.push({
            date: dateStr,
            dayLabel: DAY_LABELS[slot.day] || slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room,
            taken,
          });
        }
      }
    }

    return sessions;
  }, [selectedClass, selectedClassId, attendanceSessions]);

  // Auto-select: prefilledDate first, then today, then next upcoming
  useEffect(() => {
    if (!open || !selectedClassId || scheduledSessions.length === 0) return;
    if (useCustomDate) return;

    // If prefilledDate matches a session, use it
    if (prefilledDate) {
      const match = scheduledSessions.find((s) => s.date === prefilledDate);
      if (match) {
        setSelectedDate(prefilledDate);
        return;
      }
    }

    // Try today
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayMatch = scheduledSessions.find((s) => s.date === todayStr);
    if (todayMatch) {
      setSelectedDate(todayStr);
      return;
    }

    // Next upcoming
    const upcoming = scheduledSessions.find((s) => s.date >= todayStr && !s.taken);
    if (upcoming) {
      setSelectedDate(upcoming.date);
      return;
    }
  }, [open, selectedClassId, scheduledSessions, prefilledDate, useCustomDate]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return getStudentsByClassId(selectedClassId);
  }, [selectedClassId, getStudentsByClassId]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setUseCustomDate(false);
    const studs = getStudentsByClassId(classId);
    const defaultRecords: Record<string, AttendanceStatus> = {};
    studs.forEach((s) => { defaultRecords[s.id] = "present"; });
    setRecords(defaultRecords);
    setNotes({});
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  // Check if selectedDate matches a schedule day
  const isCustomDateWarning = useMemo(() => {
    if (!useCustomDate || !selectedClass) return false;
    const date = new Date(selectedDate + "T12:00:00");
    const jsDay = getDay(date);
    return !selectedClass.schedule.some((slot) => DAY_MAP[slot.day] === jsDay);
  }, [useCustomDate, selectedClass, selectedDate]);

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
            Select a class and session to mark attendance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto min-h-0">
          {/* Class selector */}
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

          {/* Session picker */}
          {selectedClassId && !useCustomDate && (
            <div>
              <Label className="text-[13px]">Session</Label>
              <div className="mt-1.5 space-y-1 max-h-[180px] overflow-y-auto rounded-md border border-input p-1">
                {scheduledSessions.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground px-2 py-3 text-center">
                    No scheduled sessions found.
                  </p>
                ) : (
                  scheduledSessions.map((session) => {
                    const isSelected = selectedDate === session.date;
                    const isToday = session.date === format(new Date(), "yyyy-MM-dd");
                    return (
                      <button
                        key={session.date}
                        type="button"
                        onClick={() => setSelectedDate(session.date)}
                        disabled={session.taken}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors text-left",
                          isSelected && !session.taken && "bg-[#fff2f0] border border-[#c24e3f]/30",
                          !isSelected && !session.taken && "hover:bg-muted/50",
                          session.taken && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">
                            {session.dayLabel} {format(new Date(session.date + "T12:00:00"), "d MMM")}
                          </span>
                          <span className="text-muted-foreground">
                            {session.startTime}–{session.endTime}
                          </span>
                          {session.room && (
                            <span className="text-muted-foreground">({session.room})</span>
                          )}
                          {isToday && (
                            <span className="text-[10px] font-semibold text-[#c24e3f] uppercase">Today</span>
                          )}
                        </div>
                        {session.taken && (
                          <span className="flex items-center gap-1 text-[11px] text-[#16a34a] font-medium shrink-0">
                            <CheckCircle2 className="h-3 w-3" />
                            Taken
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <button
                type="button"
                onClick={() => setUseCustomDate(true)}
                className="mt-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Custom date
              </button>
            </div>
          )}

          {/* Custom date input */}
          {selectedClassId && useCustomDate && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Date</Label>
                <button
                  type="button"
                  onClick={() => setUseCustomDate(false)}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Back to sessions
                </button>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1.5 h-9 text-[13px]"
              />
              {isCustomDateWarning && (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-[#fef3c7] border border-[#b45309]/20 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-[#b45309] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[#b45309]">
                    No lesson scheduled for this date. This class meets on{" "}
                    {selectedClass?.schedule.map((s) => DAY_LABELS[s.day]).join(", ")}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Student list */}
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
