"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  House,
  Sparkles,
  ClipboardCheck,
  FileText,
  CalendarDays,
  MessageSquare,
  CheckSquare,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const FAMILY_NAV_ITEMS = [
  { label: "Home", href: "/family/home", icon: House },
  { label: "Learning", href: "/family/learning", icon: Sparkles },
  { label: "Assessments", href: "/family/assessments", icon: ClipboardCheck },
  { label: "Reports", href: "/family/reports", icon: FileText },
  { label: "Attendance", href: "/family/attendance", icon: CheckSquare },
  { label: "Messages", href: "/family/messages", icon: MessageSquare },
  { label: "Calendar", href: "/family/calendar", icon: CalendarDays },
  { label: "More", href: "/family/more", icon: MoreHorizontal },
] as const;

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/family/home") return false;
  return pathname.startsWith(href);
}

export function FamilySidebar() {
  const collapsed = useStore((store) => store.ui.sidebarCollapsed);
  const toggleSidebar = useStore((store) => store.toggleSidebar);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-[56px] bottom-0 z-40 flex flex-col border-r border-border bg-background transition-all duration-200 transition-shell",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {FAMILY_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;

          const content = (
            <Link
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-colors",
                active
                  ? "bg-[#fff2f0] text-[#c24e3f]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 h-[20px] w-[4px] -translate-y-1/2 rounded-r-full bg-[#c24e3f]" />
              )}
              <Icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{content}</div>;
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span className="text-[13px]">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
