"use client";

import { PersonaShellGuard } from "@/components/shell/persona-shell-guard";
import { StoreInitializer } from "@/components/shell/store-initializer";
import { FamilyTopBar } from "@/components/family-shell/family-top-bar";
import { FamilySidebar } from "@/components/family-shell/family-sidebar";
import { FamilyBreadcrumbNav } from "@/components/family-shell/family-breadcrumb-nav";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";

export function FamilyShellLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useStore((store) => store.ui.sidebarCollapsed);

  return (
    <StoreInitializer>
      <PersonaShellGuard role="parent">
        <FamilyTopBar />
        <FamilySidebar />
        <main
          className={cn(
            "min-h-screen pt-[56px] transition-all duration-200 transition-shell",
            collapsed ? "pl-[72px]" : "pl-[280px]"
          )}
        >
          <div className="mx-auto max-w-[1320px] px-6 py-6">
            <FamilyBreadcrumbNav />
            {children}
          </div>
        </main>
      </PersonaShellGuard>
    </StoreInitializer>
  );
}
