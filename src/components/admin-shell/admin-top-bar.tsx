"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, RefreshCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/stores";
import { adminDemoData } from "@/features/admin/data/admin-demo-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminListItem } from "@/features/admin/components/admin-ui";

export function AdminTopBar() {
  const router = useRouter();
  const currentUser = useStore((store) => store.currentUser);
  const activeAcademicYear = useStore((store) => store.ui.activeAcademicYear);
  const setActiveAcademicYear = useStore((store) => store.setActiveAcademicYear);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const initials = useMemo(() => {
    const name = currentUser?.name ?? "Dr. Elena Alvarez";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [currentUser?.name]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-[56px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-bold tracking-tight text-[#c24e3f]">Peach</span>
          <Badge variant="outline" className="hidden text-[11px] text-muted-foreground sm:inline-flex">
            Admin demo
          </Badge>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="hidden sm:block">
            <p className="text-[13px] font-medium text-foreground">{adminDemoData.school.name}</p>
            <p className="text-[11px] text-muted-foreground">{adminDemoData.school.campus}</p>
          </div>
          <Select value={activeAcademicYear} onValueChange={setActiveAcademicYear}>
            <SelectTrigger className="ml-1 h-8 w-[96px] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025/26">2025/26</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {adminDemoData.school.termLabel}
          </Badge>
          <Badge variant="outline" className="hidden bg-[#fff8e8] text-[#9d6a06] sm:inline-flex">
            PYP · MYP · DP
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden max-w-[220px] truncate text-[11px] text-muted-foreground md:inline-flex">
            {adminDemoData.school.dataFreshness}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-2 sm:inline-flex"
            onClick={() => toast.success("Leadership preview refreshed")}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh preview
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            onClick={() => setAlertsOpen(true)}
            aria-label="Leadership alerts"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#c24e3f] px-1 text-[10px] font-semibold text-white">
              {adminDemoData.overview.alerts.length}
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-muted">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#c24e3f] text-[12px] font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-[13px] font-medium text-foreground">{currentUser?.name ?? "Dr. Elena Alvarez"}</p>
                  <p className="text-[11px] text-muted-foreground">{adminDemoData.school.leadershipPersona}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[260px]">
              <DropdownMenuItem onClick={() => toast.success("Leadership briefing pack queued")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate leadership brief
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Brand preview copied to the review queue")}>
                Review brand rollout
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/enter")}>
                Exit admin demo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Sheet open={alertsOpen} onOpenChange={setAlertsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[460px]">
          <SheetHeader>
            <SheetTitle className="text-[20px] tracking-tight">Leadership alerts</SheetTitle>
            <SheetDescription>
              High-signal admin alerts seeded for demo review. These are read-only governance prompts.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3">
            {adminDemoData.overview.alerts.map((alert) => (
              <AdminListItem
                key={alert.id}
                title={alert.title}
                body={alert.body}
                meta={`${alert.category} · ${alert.dueLabel}`}
                tone={alert.tone}
                onClick={() => toast.message(`${alert.owner} now owns this review in the demo`)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
