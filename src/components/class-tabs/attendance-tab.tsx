"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AttendanceDialog } from "@/components/shared/attendance-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { format, parseISO, addDays, getDay } from "date-fns";
import { Clock, ClipboardCheck, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { Student } from "@/types/student";
import type { Class, TimetableSlot } from "@/types/class";
import type { AttendanceSession } from "@/types/attendance";

interface AttendanceTabProps {
  classId: string;
  cls: Class;
  students: Student[];
  sessions: AttendanceSession[];
  onSessionCreated?: () => void;
}

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

const DAY_LABELS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday",
};

/**
 * Get the next calendar date for a given weekday, looking forward up to 21 days.
 */
function getNextDateForDay(day: string): string {
  const targetDay = DAY_MAP[day];
  if (targetDay === undefined) return format(new Date(), "yyyy-MM-dd");
  const today = new Date();
  const currentDay = getDay(today);
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  return format(addDays(today, daysUntil), "yyyy-MM-dd");
}

/**
 * Compute upcoming lessons from the class schedule, looking ahead 21 days.
 * Returns at most 7 lessons.
 */
function getUpcomingLessons(schedule: TimetableSlot[]): { slot: TimetableSlot; date: string }[] {
  if (schedule.length === 0) return [];

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const lessons: { slot: TimetableSlot; date: string }[] = [];

  for (let d = 0; d <= 21; d++) {
    const date = addDays(today, d);
    const dayOfWeek = getDay(date);
    const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayOfWeek];
    const daySlots = schedule.filter((s) => s.day === dayKey);
    for (const slot of daySlots) {
      const dateStr = format(date, "yyyy-MM-dd");
      // Skip today's lessons that are already past (just include all for simplicity)
      lessons.push({ slot, date: dateStr });
    }
    if (lessons.length >= 7) break;
  }

  // Skip lessons from today or before
  return lessons.filter((l) => l.date >= todayStr).slice(0, 7);
}

export function AttendanceTab({
  classId,
  cls,
  students,
  sessions,
  onSessionCreated,
}: AttendanceTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [detailSession, setDetailSession] = useState<AttendanceSession | null>(null);

  // Session dates set for quick lookup
  const sessionDates = useMemo(
    () => new Set(sessions.map((s) => s.date)),
    [sessions]
  );

  // Upcoming lessons
  const upcomingLessons = useMemo(
    () => getUpcomingLessons(cls.schedule),
    [cls.schedule]
  );

  // Past sessions sorted desc
  const pastSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions]
  );

  const openAttendanceForDate = (date?: string) => {
    setDialogDate(date);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Top action */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
          </p>
          <Button size="sm" onClick={() => openAttendanceForDate()}>
            <ClipboardCheck className="h-4 w-4 mr-1.5" />
            Take attendance
          </Button>
        </div>

        {/* Upcoming lessons */}
        {upcomingLessons.length > 0 && (
          <Card className="p-5 gap-0">
            <h3 className="text-[14px] font-semibold mb-3">Upcoming lessons</h3>
            <div className="space-y-2">
              {upcomingLessons.map((lesson, i) => {
                const hasSession = sessionDates.has(lesson.date);
                return (
                  <div
                    key={`${lesson.date}-${lesson.slot.startTime}-${i}`}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[48px]">
                        <p className="text-[11px] text-muted-foreground uppercase">
                          {DAY_LABELS[lesson.slot.day]?.slice(0, 3)}
                        </p>
                        <p className="text-[14px] font-semibold">
                          {format(parseISO(lesson.date), "d")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">
                          {lesson.slot.startTime} – {lesson.slot.endTime}
                        </p>
                        {lesson.slot.room && (
                          <p className="text-[11px] text-muted-foreground">{lesson.slot.room}</p>
                        )}
                      </div>
                    </div>
                    {hasSession ? (
                      <Badge className="bg-[#dcfce7] text-[#16a34a] border-[#16a34a]/20 text-[11px] hover:bg-[#dcfce7]">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Taken
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px]"
                        onClick={() => openAttendanceForDate(lesson.date)}
                      >
                        Take attendance
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Past sessions */}
        {pastSessions.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No attendance records"
            description="Start taking attendance for this class."
          />
        ) : (
          <Card className="p-5 gap-0">
            <h3 className="text-[14px] font-semibold mb-3">Past sessions</h3>
            <div className="space-y-2">
              {pastSessions.map((session) => {
                const present = session.records.filter((r) => r.status === "present").length;
                const absent = session.records.filter((r) => r.status === "absent").length;
                const late = session.records.filter((r) => r.status === "late").length;
                const excused = session.records.filter((r) => r.status === "excused").length;
                return (
                  <button
                    key={session.id}
                    className="w-full flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors text-left"
                    onClick={() => setDetailSession(session)}
                  >
                    <span className="text-[13px] font-medium">
                      {format(parseISO(session.date), "EEE, MMM d, yyyy")}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-[11px] bg-[#dcfce7] text-[#16a34a]">
                        {present} present
                      </Badge>
                      {absent > 0 && (
                        <Badge variant="secondary" className="text-[11px] bg-[#fee2e2] text-[#dc2626]">
                          {absent} absent
                        </Badge>
                      )}
                      {late > 0 && (
                        <Badge variant="secondary" className="text-[11px] bg-[#fef3c7] text-[#b45309]">
                          {late} late
                        </Badge>
                      )}
                      {excused > 0 && (
                        <Badge variant="secondary" className="text-[11px] bg-[#dbeafe] text-[#2563eb]">
                          {excused} excused
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Session detail sheet */}
      <Sheet open={!!detailSession} onOpenChange={(open) => { if (!open) setDetailSession(null); }}>
        <SheetContent className="w-full sm:max-w-[480px]">
          {detailSession && (() => {
            const present = detailSession.records.filter((r) => r.status === "present");
            const absent = detailSession.records.filter((r) => r.status === "absent");
            const late = detailSession.records.filter((r) => r.status === "late");
            const excused = detailSession.records.filter((r) => r.status === "excused");

            const renderStudentList = (
              records: typeof detailSession.records,
              emptyText: string
            ) => {
              if (records.length === 0) {
                return <p className="text-[12px] text-muted-foreground italic">{emptyText}</p>;
              }
              return (
                <div className="space-y-1">
                  {records.map((rec) => {
                    const student = students.find((s) => s.id === rec.studentId);
                    return (
                      <div key={rec.studentId} className="flex items-center justify-between">
                        <Link
                          href={`/students/${rec.studentId}?classId=${classId}`}
                          className="text-[12px] text-foreground hover:text-[#c24e3f] transition-colors"
                        >
                          {student ? `${student.firstName} ${student.lastName}` : rec.studentId}
                        </Link>
                        {rec.note && (
                          <span className="text-[11px] text-muted-foreground italic truncate max-w-[160px]">
                            {rec.note}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            };

            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-[16px]">
                    Attendance — {format(parseISO(detailSession.date), "EEEE, MMM d, yyyy")}
                  </SheetTitle>
                  <SheetDescription className="text-[13px]">
                    {cls.name} · {detailSession.records.length} students
                    {detailSession.completedAt && (
                      <> · Completed {format(parseISO(detailSession.completedAt), "h:mm a")}</>
                    )}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 mt-6">
                  {/* Summary badges */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-[#dcfce7]/50 p-2.5 text-center">
                      <p className="text-[18px] font-semibold text-[#16a34a]">{present.length}</p>
                      <p className="text-[10px] text-muted-foreground">Present</p>
                    </div>
                    <div className="rounded-lg bg-[#fee2e2]/50 p-2.5 text-center">
                      <p className="text-[18px] font-semibold text-[#dc2626]">{absent.length}</p>
                      <p className="text-[10px] text-muted-foreground">Absent</p>
                    </div>
                    <div className="rounded-lg bg-[#fef3c7]/50 p-2.5 text-center">
                      <p className="text-[18px] font-semibold text-[#b45309]">{late.length}</p>
                      <p className="text-[10px] text-muted-foreground">Late</p>
                    </div>
                    <div className="rounded-lg bg-[#dbeafe]/50 p-2.5 text-center">
                      <p className="text-[18px] font-semibold text-[#2563eb]">{excused.length}</p>
                      <p className="text-[10px] text-muted-foreground">Excused</p>
                    </div>
                  </div>

                  {/* Sections by status */}
                  {absent.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <XCircle className="h-3.5 w-3.5 text-[#dc2626]" />
                        <h4 className="text-[12px] font-semibold text-[#dc2626]">Absent ({absent.length})</h4>
                      </div>
                      {renderStudentList(absent, "None")}
                    </div>
                  )}

                  {late.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-[#b45309]" />
                        <h4 className="text-[12px] font-semibold text-[#b45309]">Late ({late.length})</h4>
                      </div>
                      {renderStudentList(late, "None")}
                    </div>
                  )}

                  {excused.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="h-3.5 w-3.5 text-[#2563eb]" />
                        <h4 className="text-[12px] font-semibold text-[#2563eb]">Excused ({excused.length})</h4>
                      </div>
                      {renderStudentList(excused, "None")}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16a34a]" />
                      <h4 className="text-[12px] font-semibold text-[#16a34a]">Present ({present.length})</h4>
                    </div>
                    {renderStudentList(present, "None")}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Attendance dialog */}
      <AttendanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        prefilledClassId={classId}
        prefilledDate={dialogDate}
        onSessionCreated={onSessionCreated}
      />
    </>
  );
}
