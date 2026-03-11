"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { NotificationPanel } from "./notification-panel";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function StudentTopBar() {
  const currentUser = useCurrentUser();
  const displayName = currentUser?.name ?? "Student";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[56px] bg-background border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-[18px] font-bold text-[#c24e3f] tracking-tight">
          Peach
        </span>
        <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground hidden sm:flex">
          Student
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <NotificationPanel />

        <Link href="/enter">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[13px] text-muted-foreground">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Switch persona</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2 rounded-full px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#c24e3f] text-white text-[12px] font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[13px] font-medium hidden md:block">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
