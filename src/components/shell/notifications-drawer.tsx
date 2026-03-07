"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  FolderOpen,
  AlertTriangle,
  FileText,
  X,
} from "lucide-react";
import { getPublishedDueAssessments } from "@/lib/grade-helpers";

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  type: "deadline" | "portfolio" | "incident" | "report";
  entityUrl: string;
}

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isWithinPastDays(dateStr: string, days: number): boolean {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = Math.abs(now.getTime() - date.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function formatDueTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}

const iconClasses: Record<string, string> = {
  deadline: "text-orange-500",
  portfolio: "text-blue-500",
  incident: "text-red-500",
  report: "text-amber-600",
};

export function NotificationsDrawer({ open, onOpenChange }: NotificationsDrawerProps) {
  const router = useRouter();
  const assessments = useStore((s) => s.assessments);
  const artifacts = useStore((s) => s.artifacts);
  const incidents = useStore((s) => s.incidents);
  const reports = useStore((s) => s.reports);
  const students = useStore((s) => s.students);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];

    // Upcoming assessment deadlines (next 7 days) — published only
    getPublishedDueAssessments(assessments, 7).forEach((asmt) => {
      items.push({
        id: `deadline-${asmt.id}`,
        icon: <ClipboardCheck className="h-4 w-4" />,
        title: `Assessment deadline: ${asmt.title}`,
        description: formatDueTime(asmt.dueDate),
        timestamp: asmt.dueDate,
        type: "deadline",
        entityUrl: `/assessments/${asmt.id}`,
      });
    });

    // Pending portfolio reviews
    artifacts.forEach((artifact) => {
      if (artifact.approvalStatus === "pending") {
        const student = students.find((s) => s.id === artifact.studentId);
        const studentName = student
          ? `${student.firstName} ${student.lastName}`
          : "Unknown student";
        items.push({
          id: `portfolio-${artifact.id}`,
          icon: <FolderOpen className="h-4 w-4" />,
          title: `Portfolio review pending`,
          description: `"${artifact.title}" by ${studentName} needs review`,
          timestamp: artifact.updatedAt || artifact.createdAt,
          type: "portfolio",
          entityUrl: "/portfolio",
        });
      }
    });

    // Recent incidents (last 7 days)
    incidents.forEach((incident) => {
      if (isWithinPastDays(incident.reportedAt, 7)) {
        const student = students.find((s) => s.id === incident.studentId);
        const studentName = student
          ? `${student.firstName} ${student.lastName}`
          : "Unknown student";
        items.push({
          id: `incident-${incident.id}`,
          icon: <AlertTriangle className="h-4 w-4" />,
          title: `Incident: ${incident.title}`,
          description: `${studentName} - ${incident.severity} severity`,
          timestamp: incident.reportedAt,
          type: "incident",
          entityUrl: "/support",
        });
      }
    });

    // Overdue reports (draft state)
    reports.forEach((report) => {
      if (report.publishState === "draft") {
        const student = students.find((s) => s.id === report.studentId);
        const studentName = student
          ? `${student.firstName} ${student.lastName}`
          : "Unknown student";
        items.push({
          id: `report-${report.id}`,
          icon: <FileText className="h-4 w-4" />,
          title: "Report draft needs attention",
          description: `Report for ${studentName} is still in draft`,
          timestamp: new Date().toISOString(),
          type: "report",
          entityUrl: `/reports/${report.id}`,
        });
      }
    });

    // Sort by timestamp descending (newest first)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items;
  }, [assessments, artifacts, incidents, reports, students]);

  const visibleNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = visibleNotifications.length;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleDismissAll = () => {
    setDismissedIds(new Set(notifications.map((n) => n.id)));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0 flex flex-col" showCloseButton={false}>
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-base">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="default" className="text-[11px] px-1.5 py-0 h-5">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleDismissAll}
                  className="text-muted-foreground text-[12px]"
                >
                  Dismiss all
                </Button>
              )}
              <SheetClose asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close notifications">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
          <SheetDescription className="sr-only">
            View and manage your notifications
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {visibleNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground mt-1">
                No new notifications to show
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => {
                    router.push(notification.entityUrl);
                    onOpenChange(false);
                  }}
                >
                  <div
                    className={`mt-0.5 shrink-0 ${iconClasses[notification.type] ?? "text-muted-foreground"}`}
                  >
                    {notification.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground leading-snug">
                      {notification.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                      {notification.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {notification.type === "deadline"
                        ? formatDueTime(notification.timestamp)
                        : formatRelativeTime(notification.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDismiss(notification.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/** Hook to get the current unread notification count */
export function useNotificationCount(): number {
  const assessments = useStore((s) => s.assessments);
  const artifacts = useStore((s) => s.artifacts);
  const incidents = useStore((s) => s.incidents);
  const reports = useStore((s) => s.reports);

  return useMemo(() => {
    let count = 0;

    // Upcoming assessment deadlines (next 7 days) — published only
    count += getPublishedDueAssessments(assessments, 7).length;

    // Pending portfolio reviews
    artifacts.forEach((artifact) => {
      if (artifact.approvalStatus === "pending") {
        count++;
      }
    });

    // Recent incidents (last 7 days)
    incidents.forEach((incident) => {
      if (isWithinPastDays(incident.reportedAt, 7)) {
        count++;
      }
    });

    // Overdue reports (draft state)
    reports.forEach((report) => {
      if (report.publishState === "draft") {
        count++;
      }
    });

    return count;
  }, [assessments, artifacts, incidents, reports]);
}
