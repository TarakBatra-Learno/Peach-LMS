"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import {
  getStudentChannels,
  getStudentAnnouncements,
  getStudentClasses,
} from "@/lib/student-selectors";
import { Card } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { AppState } from "@/stores/types";
import type { Announcement } from "@/types/communication";

interface DashboardAnnouncementsPanelProps {
  studentId: string;
}

interface AggregatedAnnouncement {
  announcement: Announcement;
  channelId: string;
  className: string;
}

export function DashboardAnnouncementsPanel({ studentId }: DashboardAnnouncementsPanelProps) {
  const state = useStore() as AppState;

  const announcements = useMemo<AggregatedAnnouncement[]>(() => {
    const channels = getStudentChannels(state, studentId);
    const classes = getStudentClasses(state, studentId);

    // Only class channels (not DM or project)
    const classChannels = channels.filter(
      (ch) => ch.type !== "dm" && ch.type !== "project"
    );

    const all: AggregatedAnnouncement[] = [];

    for (const ch of classChannels) {
      const chAnnouncements = getStudentAnnouncements(state, ch.id);
      const cls = classes.find((c) => c.id === ch.classId);
      const className = cls?.name ?? ch.name;

      for (const a of chAnnouncements) {
        all.push({
          announcement: a,
          channelId: ch.id,
          className,
        });
      }
    }

    // Sort by sentAt descending, take top 5
    return all
      .sort((a, b) => {
        const aTime = a.announcement.sentAt ?? a.announcement.createdAt;
        const bTime = b.announcement.sentAt ?? b.announcement.createdAt;
        return bTime.localeCompare(aTime);
      })
      .slice(0, 5);
  }, [state, studentId]);

  return (
    <Card className="p-5 gap-0">
      <h2 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-muted-foreground" />
        Recent Announcements
      </h2>
      {announcements.length === 0 ? (
        <p className="text-[13px] text-muted-foreground py-4 text-center">
          No recent announcements
        </p>
      ) : (
        <div className="space-y-2">
          {announcements.map((item) => (
            <Link
              key={item.announcement.id}
              href={`/student/messages?channel=${item.channelId}`}
              className="flex items-start gap-3 py-2 px-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium truncate">
                  {item.announcement.title || item.announcement.body?.substring(0, 60)}
                </p>
                <p className="text-[12px] text-muted-foreground line-clamp-1">
                  {item.announcement.body}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span>{item.className}</span>
                  <span>&middot;</span>
                  <span>
                    {format(
                      new Date(item.announcement.sentAt ?? item.announcement.createdAt),
                      "MMM d"
                    )}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
