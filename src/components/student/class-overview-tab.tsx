"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  getStudentAssessments,
  getStudentUnitPlans,
  getStudentTimetable,
} from "@/lib/student-selectors";
import { BookOpen, Calendar, ClipboardCheck, Clock, GraduationCap, MapPin, Users } from "lucide-react";
import { format, addDays } from "date-fns";
import type { Class } from "@/types/class";
import { getDemoNow } from "@/lib/demo-time";

interface ClassOverviewTabProps {
  cls: Class;
  studentId: string;
}

export function ClassOverviewTab({ cls, studentId }: ClassOverviewTabProps) {
  const state = useStore((s) => s);

  const assessments = useMemo(
    () => getStudentAssessments(state, studentId, cls.id),
    [state, studentId, cls.id]
  );

  const unitPlans = useMemo(
    () => getStudentUnitPlans(state, cls.id),
    [state, cls.id]
  );

  const demoNow = useMemo(() => getDemoNow(), []);
  const today = format(demoNow, "yyyy-MM-dd");
  const weekEnd = format(addDays(demoNow, 6), "yyyy-MM-dd");

  const thisWeekSchedule = useMemo(
    () => getStudentTimetable(state, studentId, today, weekEnd).filter(
      (s) => s.classId === cls.id
    ),
    [state, studentId, today, weekEnd, cls.id]
  );

  const upcomingAssessments = useMemo(
    () =>
      assessments
        .filter((a) => {
          const due = new Date(a.dueDate);
          due.setHours(23, 59, 59, 999);
          return due >= demoNow;
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 3),
    [assessments, demoNow]
  );

  const activeUnit = useMemo(
    () => unitPlans.find((u) => u.status === "active"),
    [unitPlans]
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assessments"
          value={assessments.length}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Units"
          value={unitPlans.length}
          icon={BookOpen}
        />
        <StatCard
          label="Sessions this week"
          value={thisWeekSchedule.length}
          icon={Calendar}
        />
        <StatCard
          label="Upcoming due"
          value={upcomingAssessments.length}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Info */}
        <Card className="p-5 gap-0">
          <h3 className="text-[16px] font-semibold mb-4">Class information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[13px]">
              <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground">Subject</p>
                <p className="font-medium">{cls.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[13px]">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground">Grade level</p>
                <p className="font-medium">{cls.gradeLevel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[13px]">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground">Programme</p>
                <p className="font-medium">{cls.programme}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[13px]">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground">Academic year</p>
                <p className="font-medium">{cls.academicYear} · {cls.term}</p>
              </div>
            </div>
          </div>

          {/* Schedule slots */}
          {cls.schedule.length > 0 && (
            <div className="mt-5 pt-4 border-t">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Weekly schedule
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cls.schedule.map((slot, i) => (
                  <Badge key={i} variant="outline" className="text-[11px] font-medium">
                    {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} {slot.startTime}–{slot.endTime}
                    {slot.room && (
                      <span className="ml-1 text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />{slot.room}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Current Unit */}
          {activeUnit && (
            <Card className="p-5 gap-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[16px] font-semibold">Current unit</h3>
                <StatusBadge status={activeUnit.status} />
              </div>
              <p className="text-[14px] font-medium">{activeUnit.title}</p>
              {activeUnit.code && (
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Code: {activeUnit.code}
                </p>
              )}
              <p className="text-[12px] text-muted-foreground mt-1">
                {format(new Date(activeUnit.startDate), "MMM d")} – {format(new Date(activeUnit.endDate), "MMM d, yyyy")}
              </p>
            </Card>
          )}

          {/* Upcoming Assessments */}
          <Card className="p-5 gap-0">
            <h3 className="text-[16px] font-semibold mb-3">Upcoming assessments</h3>
            {upcomingAssessments.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No upcoming assessments for this class.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAssessments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">{a.title}</p>
                      <p className="text-[12px] text-muted-foreground">
                        Due {format(new Date(a.dueDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {a.gradingMode.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* This Week's Schedule */}
          <Card className="p-5 gap-0">
            <h3 className="text-[16px] font-semibold mb-3">This week&apos;s sessions</h3>
            {thisWeekSchedule.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No sessions scheduled this week.
              </p>
            ) : (
              <div className="space-y-2">
                {thisWeekSchedule.slice(0, 5).map((slot, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-muted-foreground w-16">
                        {format(new Date(slot.date), "EEE")}
                      </span>
                      <span className="text-[13px]">
                        {slot.slotStartTime}–{slot.slotEndTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.lesson && (
                        <span className="text-[12px] text-muted-foreground truncate max-w-[150px]">
                          {slot.lesson.title}
                        </span>
                      )}
                      {slot.room && (
                        <Badge variant="secondary" className="text-[10px]">
                          {slot.room}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
