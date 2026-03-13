"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  FileText,
  Megaphone,
  FolderOpen,
  AlertCircle,
} from "lucide-react";
import { formatDistance } from "date-fns";
import type { NotificationType } from "@/types/notification";
import Link from "next/link";
import { getDemoNow } from "@/lib/demo-time";

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  grade_released: CheckCircle2,
  assessment_due: ClipboardCheck,
  submission_returned: RotateCcw,
  grade_amended: CheckCircle2,
  student_excused: AlertCircle,
  report_distributed: FileText,
  announcement: Megaphone,
  portfolio_approved: FolderOpen,
  portfolio_revision: AlertCircle,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  grade_released: "text-[#16a34a]",
  assessment_due: "text-[#b45309]",
  submission_returned: "text-[#2563eb]",
  grade_amended: "text-[#2563eb]",
  student_excused: "text-[#6b7280]",
  report_distributed: "text-[#c24e3f]",
  announcement: "text-[#7c3aed]",
  portfolio_approved: "text-[#16a34a]",
  portfolio_revision: "text-[#b45309]",
};

export function NotificationPanel() {
  const studentId = useStudentId();
  const getNotificationsByStudent = useStore((s) => s.getNotificationsByStudent);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);

  const notifications = useMemo(
    () => (studentId ? getNotificationsByStudent(studentId) : []),
    [studentId, getNotificationsByStudent]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Group by type for organized display
  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );

  if (!studentId) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-[#c24e3f] text-[10px] font-bold text-white flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0" sideOffset={8}>
        <div className="px-4 py-3 flex items-center justify-between border-b">
          <h3 className="text-[14px] font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[#c24e3f]"
              onClick={() => markAllNotificationsRead(studentId)}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {sortedNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          ) : (
            <div>
              {sortedNotifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell;
                const color = NOTIFICATION_COLORS[notification.type] ?? "text-muted-foreground";

                const content = (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-[#fff2f0]/30" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markNotificationRead(notification.id);
                      }
                    }}
                  >
                    <div className={`shrink-0 mt-0.5 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-[13px] font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-[#c24e3f] shrink-0" />
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.body}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistance(new Date(notification.createdAt), getDemoNow(), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );

                if (notification.linkTo) {
                  return (
                    <Link key={notification.id} href={notification.linkTo}>
                      {content}
                    </Link>
                  );
                }

                return content;
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
