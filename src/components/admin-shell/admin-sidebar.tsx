"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  School,
  UserRoundSearch,
  BookOpenText,
  LineChart,
  Megaphone,
  CalendarCog,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ADMIN_NAV_ITEMS = [
  { label: "Overview", href: "/admin/overview", icon: LayoutDashboard },
  { label: "Classes", href: "/admin/classes", icon: School },
  { label: "Students", href: "/admin/students", icon: UserRoundSearch },
  { label: "Curriculum", href: "/admin/curriculum", icon: BookOpenText },
  { label: "Performance", href: "/admin/performance", icon: LineChart },
  { label: "Communications", href: "/admin/communications", icon: Megaphone },
  { label: "Operations", href: "/admin/operations", icon: CalendarCog },
  { label: "Platform", href: "/admin/platform", icon: Settings2 },
] as const;

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/admin/overview") return false;
  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const collapsed = useStore((store) => store.ui.sidebarCollapsed);
  const toggleSidebar = useStore((store) => store.toggleSidebar);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 top-[56px] z-40 flex flex-col border-r border-border bg-background transition-all duration-200 transition-shell",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <div className="border-b border-border/80 px-3 py-3">
        <div className={cn("rounded-[18px] border border-[#ffe1dc] bg-[#fff7f5] px-3 py-3", collapsed && "px-0 py-3 text-center")}>
          <p className={cn("text-[11px] font-medium uppercase tracking-[0.16em] text-[#b9483a]", collapsed && "sr-only")}>
            School leadership
          </p>
          <p className={cn("mt-1 text-[13px] font-medium text-foreground", collapsed && "sr-only")}>
            Executive oversight layer
          </p>
          {collapsed ? <span className="text-[11px] font-semibold text-[#b9483a]">SL</span> : null}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {ADMIN_NAV_ITEMS.map((item) => {
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
              {active ? (
                <div className="absolute left-0 top-1/2 h-[20px] w-[4px] -translate-y-1/2 rounded-r-full bg-[#c24e3f]" />
              ) : null}
              <Icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed ? <span>{item.label}</span> : null}
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
