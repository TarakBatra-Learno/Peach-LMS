"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Coffee,
  UtensilsCrossed,
  AlertTriangle,
  Shield,
  Image,
  MessageSquare,
} from "lucide-react";
import type { Class } from "@/types/class";
import type { ReportCycle, Report } from "@/types/report";
import type { Incident } from "@/types/incident";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Announcement } from "@/types/communication";
import type { AttendanceSession } from "@/types/attendance";
import type { Student } from "@/types/student";
import type { GradeRecord } from "@/types/gradebook";
import type { Assessment, LearningGoal } from "@/types/assessment";
import { computeAttentionStudents } from "@/lib/selectors/grade-selectors";
import { deriveTimeRows, timeToMinutes, type TimeRow } from "@/lib/timetable-utils";
import { format } from "date-fns";
import Link from "next/link";

interface DashboardSidebarProps {
  classes: Class[];
  now: Date;
  todayStr: string;
  reportCycles: ReportCycle[];
  reports: Report[];
  incidents: Incident[];
  artifacts: PortfolioArtifact[];
  announcements: Announcement[];
  attendanceSessions: AttendanceSession[];
  students: Student[];
  grades: GradeRecord[];
  assessments: Assessment[];
  learningGoals: LearningGoal[];
  onSlotClick?: (cls: Class) => void;
}

export function DashboardSidebar({
  classes,
  now,
  todayStr,
  reportCycles,
  reports,
  incidents,
  artifacts,
  announcements,
  attendanceSessions,
  students,
  grades,
  assessments,
  learningGoals,
  onSlotClick,
}: DashboardSidebarProps) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const dayMap: Record<number, string> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  };
  const todayDay = dayMap[now.getDay()];

  // Derive time rows from all classes
  const timeRows = useMemo(() => deriveTimeRows(classes), [classes]);

  // Build slot lookup: startTime → class with that slot today
  const slotLookup = useMemo(() => {
    const map = new Map<string, Class>();
    for (const cls of classes) {
      for (const slot of cls.schedule) {
        if (slot.day === todayDay) {
          map.set(slot.startTime, cls);
        }
      }
    }
    return map;
  }, [classes, todayDay]);

  // Room lookup
  const roomLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const cls of classes) {
      for (const slot of cls.schedule) {
        if (slot.day === todayDay && slot.room) {
          map.set(slot.startTime, slot.room);
        }
      }
    }
    return map;
  }, [classes, todayDay]);

  // Report cycle mini-panel data
  const activeCycle = reportCycles.find(
    (c) => c.status === "open" || c.status === "closing"
  );
  const cycleReports = activeCycle
    ? reports.filter((r) => r.cycleId === activeCycle.id)
    : [];
  const publishedCount = cycleReports.filter(
    (r) => r.publishState === "published" || r.publishState === "distributed"
  ).length;

  // Attention mini-panel data
  const openIncidents = incidents.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );

  const attentionCount = useMemo(() => {
    const seen = new Set<string>();
    for (const cls of classes) {
      const classStudents = students.filter((s) => cls.studentIds.includes(s.id));
      const classAssessments = assessments.filter(
        (a) => a.classId === cls.id && a.status === "live"
      );
      const classGrades = grades.filter((g) => g.classId === cls.id);
      const flagged = computeAttentionStudents(
        classStudents,
        classGrades,
        classAssessments,
        learningGoals,
        cls.id
      );
      for (const s of flagged) seen.add(s.student.id);
    }
    return seen.size;
  }, [classes, students, grades, assessments, learningGoals]);

  // Recent activity
  const recentItems = useMemo(() => {
    type ActivityItem = { icon: typeof Image; text: string; time: string; href: string };
    const items: (ActivityItem & { ts: number })[] = [];

    // Recent artifacts
    for (const art of artifacts.slice(0, 5)) {
      items.push({
        icon: Image,
        text: `New artifact: ${art.title}`,
        time: art.createdAt,
        ts: new Date(art.createdAt).getTime(),
        href: "/portfolio",
      });
    }

    // Recent announcement replies
    for (const ann of announcements) {
      for (const reply of ann.threadReplies ?? []) {
        items.push({
          icon: MessageSquare,
          text: `Reply on "${ann.title}"`,
          time: reply.createdAt,
          ts: new Date(reply.createdAt).getTime(),
          href: "/communication",
        });
      }
    }

    // Recent incidents
    for (const inc of incidents.slice(0, 5)) {
      items.push({
        icon: Shield,
        text: `Incident: ${inc.title}`,
        time: inc.reportedAt,
        ts: new Date(inc.reportedAt).getTime(),
        href: "/student-support",
      });
    }

    return items
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 3)
      .map(({ ts, ...rest }) => rest);
  }, [artifacts, announcements, incidents]);

  function getPeriodStatus(row: TimeRow): "past" | "current" | "future" {
    const start = timeToMinutes(row.startTime);
    const end = timeToMinutes(row.endTime);
    if (nowMinutes > end) return "past";
    if (nowMinutes >= start - 15 && nowMinutes <= end) return "current";
    return "future";
  }

  function formatRelativeTime(timeStr: string): string {
    const diff = now.getTime() - new Date(timeStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-4">
      {/* Timetable Rail */}
      <Card className="p-3 gap-0">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Today's Schedule
        </h3>
        {timeRows.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-2">No classes today</p>
        ) : (
          <div className="space-y-1">
            {timeRows.map((row) => {
              if (row.type !== "class") {
                return (
                  <div
                    key={`${row.startTime}-${row.endTime}`}
                    className="flex items-center gap-2 py-1.5 px-2 text-muted-foreground/60"
                  >
                    {row.type === "lunch" ? (
                      <UtensilsCrossed className="h-2.5 w-2.5" />
                    ) : (
                      <Coffee className="h-2.5 w-2.5" />
                    )}
                    <span className="text-[10px]">{row.label}</span>
                    <span className="text-[9px] ml-auto">{row.startTime}</span>
                  </div>
                );
              }

              const cls = slotLookup.get(row.startTime);
              const room = roomLookup.get(row.startTime);
              const status = getPeriodStatus(row);

              return (
                <button
                  key={`${row.startTime}-${row.endTime}`}
                  type="button"
                  onClick={() => cls && onSlotClick?.(cls)}
                  className={`w-full text-left rounded-md p-2 transition-colors ${
                    status === "current"
                      ? "bg-[#fff2f0] border-l-[3px] border-[#c24e3f]"
                      : status === "past"
                        ? "opacity-50"
                        : "hover:bg-muted/50"
                  } ${cls ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium ${
                        status === "current" ? "text-[#c24e3f]" : ""
                      }`}
                    >
                      {row.startTime} – {row.endTime}
                    </span>
                    {status === "current" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c24e3f] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c24e3f]" />
                      </span>
                    )}
                  </div>
                  {cls ? (
                    <>
                      <p className={`text-[12px] font-semibold mt-0.5 ${status === "current" ? "text-[#c24e3f]" : ""}`}>
                        {cls.name}
                      </p>
                      {room && (
                        <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                          <MapPin className="h-2 w-2" />
                          {room}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      Free
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Report Cycle Mini-Panel */}
      {activeCycle && (
        <Card className="p-3 gap-0">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {activeCycle.name}
          </h3>
          <div className="bg-muted rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div
              className="bg-[#c24e3f] h-full rounded-full transition-all"
              style={{
                width: `${cycleReports.length > 0 ? (publishedCount / cycleReports.length) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {publishedCount}/{cycleReports.length} published · Closes{" "}
            {format(new Date(activeCycle.endDate), "MMM d")}
          </p>
        </Card>
      )}

      {/* Attention Mini-Panel */}
      <Card className="p-3 gap-0">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Attention
        </h3>
        {attentionCount > 0 && (
          <Link href="/classes" className="flex items-center gap-1.5 text-[11px] text-foreground hover:text-[#c24e3f] transition-colors py-0.5">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            {attentionCount} student{attentionCount !== 1 ? "s" : ""} below 50%
          </Link>
        )}
        {openIncidents.length > 0 && (
          <Link href="/student-support" className="flex items-center gap-1.5 text-[11px] text-foreground hover:text-[#c24e3f] transition-colors py-0.5">
            <Shield className="h-3 w-3 text-amber-500" />
            {openIncidents.length} open incident{openIncidents.length !== 1 ? "s" : ""}
          </Link>
        )}
        {attentionCount === 0 && openIncidents.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60">No flags</p>
        )}
      </Card>

      {/* Recent Activity Mini-Panel */}
      {recentItems.length > 0 && (
        <Card className="p-3 gap-0">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Recent Activity
          </h3>
          <div className="space-y-1.5">
            {recentItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-start gap-2 text-[10px] hover:text-[#c24e3f] transition-colors"
                >
                  <Icon className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="truncate flex-1">{item.text}</span>
                  <span className="text-muted-foreground/60 shrink-0">
                    {formatRelativeTime(item.time)}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
