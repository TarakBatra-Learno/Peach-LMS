"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { getFamilyNotifications, getParentChildren } from "@/lib/family-selectors";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BookOpen,
  CalendarClock,
  CheckSquare,
  FileText,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";

const TYPE_LABELS = {
  all: "All types",
  announcement: "Announcements",
  message: "Messages",
  channel_activity: "Channels",
  portfolio: "Portfolio",
  report: "Reports",
  assessment_result: "Results",
  attendance: "Attendance",
  deadline: "Deadlines",
  event: "Events",
} as const;

const TYPE_ICONS = {
  announcement: Bell,
  message: MessageSquare,
  channel_activity: MessageSquare,
  portfolio: Sparkles,
  report: FileText,
  assessment_result: BookOpen,
  attendance: CheckSquare,
  deadline: CalendarClock,
  event: CalendarClock,
} as const;

function formatRelative(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function useFamilyNotificationCount() {
  const state = useStore((store) => store);
  const parentId = useParentId();
  return useMemo(() => {
    if (!parentId) return 0;
    return getFamilyNotifications(state, parentId).filter((notification) => !notification.read).length;
  }, [state, parentId]);
}

interface FamilyNotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FamilyNotificationsSheet({
  open,
  onOpenChange,
}: FamilyNotificationsSheetProps) {
  const router = useRouter();
  const state = useStore((store) => store);
  const parentId = useParentId();
  const markFamilyNotificationRead = useStore((store) => store.markFamilyNotificationRead);
  const markAllFamilyNotificationsRead = useStore((store) => store.markAllFamilyNotificationsRead);
  const [typeFilter, setTypeFilter] = useState<keyof typeof TYPE_LABELS>("all");
  const [childFilter, setChildFilter] = useState<string>("all");

  const children = parentId ? getParentChildren(state, parentId) : [];
  const notifications = parentId ? getFamilyNotifications(state, parentId, childFilter === "all" ? null : childFilter) : [];

  const filtered = notifications.filter((notification) =>
    typeFilter === "all" ? true : notification.type === typeFilter
  );

  if (!parentId) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[420px] max-w-[420px] flex-col p-0" showCloseButton={false}>
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-base">Notifications</SheetTitle>
              <Badge variant="outline" className="text-[11px]">
                {filtered.filter((notification) => !notification.read).length} unread
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[12px]"
                onClick={() => markAllFamilyNotificationsRead(parentId)}
              >
                Mark all as read
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close notifications">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
          <SheetDescription className="sr-only">
            Notification center for family updates
          </SheetDescription>
          <div className="mt-3 flex gap-2">
            <Select value={childFilter} onValueChange={setChildFilter}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as keyof typeof TYPE_LABELS)}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-[14px] font-medium">Nothing new right now</p>
              <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">
                New announcements, deadlines, attendance alerts, and released results will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((notification) => {
                const Icon = TYPE_ICONS[notification.type];
                return (
                  <button
                    key={notification.id}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    onClick={() => {
                      markFamilyNotificationRead(notification.id);
                      if (notification.linkTo) {
                        router.push(notification.linkTo);
                        onOpenChange(false);
                      }
                    }}
                  >
                    <div className="mt-0.5 rounded-full bg-[#fff2f0] p-2 text-[#c24e3f]">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium">{notification.title}</p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {notification.body}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {notification.childLabel && (
                          <span>{notification.childLabel}</span>
                        )}
                        <span>{formatRelative(notification.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
