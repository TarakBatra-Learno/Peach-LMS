"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/stores";
import { useCurrentUser, useParentId } from "@/lib/hooks/use-current-user";
import { getParentProfile } from "@/lib/family-selectors";
import { FamilyChildSwitcher } from "@/components/family/family-child-switcher";
import { FamilyNotificationsSheet, useFamilyNotificationCount } from "./family-notifications-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Globe, ArrowLeftRight } from "lucide-react";

export function FamilyTopBar() {
  const currentUser = useCurrentUser();
  const parentId = useParentId();
  const state = useStore((store) => store);
  const updateParentProfile = useStore((store) => store.updateParentProfile);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationCount = useFamilyNotificationCount();
  const parent = parentId ? getParentProfile(state, parentId) : undefined;

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-[56px] items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-bold tracking-tight text-[#c24e3f]">
            Peach
          </span>
          <Badge variant="outline" className="hidden text-[11px] font-medium text-muted-foreground sm:flex">
            Demo data
          </Badge>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <FamilyChildSwitcher className="w-[240px] h-8 text-[13px]" />
        </div>

        <div className="flex items-center gap-2">
          {parent && (
            <Select
              value={parent.uiLanguage}
              onValueChange={(value) => updateParentProfile(parent.id, { uiLanguage: value })}
            >
              <SelectTrigger className="hidden h-8 w-[126px] text-[12px] sm:flex">
                <Globe className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="Arabic">Arabic</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#c24e3f] px-1 text-[10px] font-semibold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Button>

          <Link href="/enter">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[13px] text-muted-foreground">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Switch persona</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2 rounded-full px-2 py-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#c24e3f] text-[12px] font-semibold text-white">
                {parent?.avatarInitials ?? currentUser?.name?.slice(0, 2).toUpperCase() ?? "FA"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-[13px] font-medium md:block">
              {parent?.name ?? currentUser?.name ?? "Family"}
            </span>
          </div>
        </div>
      </header>

      <FamilyNotificationsSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </>
  );
}
