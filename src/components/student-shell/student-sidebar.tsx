"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores";
import { ChevronLeft, ChevronRight, Home, BookOpen, Calendar, MessageSquare, FolderOpen, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STUDENT_NAV_ITEMS = [
  { label: "Home", href: "/student/home", icon: Home },
  { label: "My Classes", href: "/student/classes", icon: BookOpen },
  { label: "Calendar", href: "/student/calendar", icon: Calendar },
  { label: "Messages", href: "/student/messages", icon: MessageSquare },
  { label: "Portfolio", href: "/student/portfolio", icon: FolderOpen },
  { label: "My Goals", href: "/student/goals", icon: Target },
  { label: "Progress", href: "/student/progress", icon: TrendingUp },
] as const;

function isNavActive(pathname: string, itemHref: string): boolean {
  if (pathname === itemHref) return true;
  if (itemHref === "/student/home") return false;
  return pathname.startsWith(itemHref);
}

export function StudentSidebar() {
  const collapsed = useStore((s) => s.ui.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-[56px] bottom-0 z-40 flex flex-col border-r border-border bg-background transition-all duration-200 transition-shell",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {STUDENT_NAV_ITEMS.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          const Icon = item.icon;

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-colors relative",
                isActive
                  ? "bg-[#fff2f0] text-[#c24e3f]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[20px] rounded-r-full bg-[#c24e3f]" />
              )}
              <Icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-[13px]">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
