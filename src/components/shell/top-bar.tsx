"use client";

import { useStore } from "@/stores";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ACADEMIC_YEARS, TEACHER } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw, Search, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NotificationsDrawer, useNotificationCount } from "@/components/shell/notifications-drawer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/shell/global-search";

export function TopBar() {
  const classes = useStore((s) => s.classes);
  const currentUser = useStore((s) => s.currentUser);
  const activeClassId = useStore((s) => s.ui.activeClassId);
  const activeAcademicYear = useStore((s) => s.ui.activeAcademicYear);
  const setActiveClass = useStore((s) => s.setActiveClass);
  const setActiveAcademicYear = useStore((s) => s.setActiveAcademicYear);
  const simulateLatency = useStore((s) => s.ui.simulateLatency);
  const simulateErrors = useStore((s) => s.ui.simulateErrors);
  const setSimulateLatency = useStore((s) => s.setSimulateLatency);
  const setSimulateErrors = useStore((s) => s.setSimulateErrors);
  const [showReset, setShowReset] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationCount = useNotificationCount();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleReset = async () => {
    const { generateSeedData } = await import("@/data/seed");
    const seed = generateSeedData();
    useStore.getState().resetAllData(seed);
    toast.success("Demo data reset to defaults");
  };

  const displayName = currentUser?.name ?? TEACHER.name;
  const displayEmail =
    currentUser?.role === "admin"
      ? "leadership@peachschool.edu"
      : TEACHER.email;
  const displayInitials =
    currentUser?.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? TEACHER.avatarInitials;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-[56px] bg-background border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-bold text-[#c24e3f] tracking-tight">
            Peach
          </span>
          <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground hidden sm:flex">
            Demo data
          </Badge>

          <div className="hidden sm:block w-px h-6 bg-border mx-1" />

          <Select
            value={activeAcademicYear}
            onValueChange={(v) => {
              setActiveAcademicYear(v);
              // If the currently selected class isn't in the new year, reset
              if (activeClassId) {
                const cls = classes.find((c) => c.id === activeClassId);
                if (cls && cls.academicYear !== v) {
                  setActiveClass(null);
                }
              }
            }}
          >
            <SelectTrigger className="w-[110px] h-8 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_YEARS.map((y) => (
                <SelectItem key={y.value} value={y.value}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={activeClassId || "all"}
            onValueChange={(v) => setActiveClass(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[200px] h-8 text-[13px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes
                .filter((c) => c.academicYear === activeAcademicYear)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.name}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {c.programme}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-muted-foreground text-[13px] px-2.5 hidden sm:flex"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 sm:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#c24e3f] px-1 text-[10px] font-semibold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#c24e3f] text-white text-[12px] font-semibold">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-medium hidden md:block">
                  {displayName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[260px]">
              <DropdownMenuLabel className="text-[12px] text-muted-foreground font-normal">
                {displayEmail}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="latency" className="text-[13px]">Simulate latency</Label>
                  <Switch
                    id="latency"
                    checked={simulateLatency}
                    onCheckedChange={setSimulateLatency}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="errors" className="text-[13px]">Simulate errors</Label>
                  <Switch
                    id="errors"
                    checked={simulateErrors}
                    onCheckedChange={setSimulateErrors}
                  />
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowReset(true)} className="text-[#dc2626]">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset demo data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ConfirmDialog
        open={showReset}
        onOpenChange={setShowReset}
        title="Reset demo data"
        description="This will restore all data to its original state. Any changes you've made will be lost."
        confirmLabel="Reset"
        onConfirm={handleReset}
        destructive
      />

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
    </>
  );
}
