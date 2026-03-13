"use client";

import { StoreInitializer } from "@/components/shell/store-initializer";
import { PersonaShellGuard } from "@/components/shell/persona-shell-guard";
import { AdminTopBar } from "@/components/admin-shell/admin-top-bar";
import { AdminSidebar } from "@/components/admin-shell/admin-sidebar";
import { AdminBreadcrumbNav } from "@/components/admin-shell/admin-breadcrumb-nav";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";

export function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useStore((store) => store.ui.sidebarCollapsed);

  return (
    <StoreInitializer>
      <PersonaShellGuard role="admin">
        <AdminTopBar />
        <AdminSidebar />
        <main
          className={cn(
            "min-h-screen bg-[#f7f8fa] pt-[56px] transition-all duration-200 transition-shell",
            collapsed ? "pl-[72px]" : "pl-[280px]"
          )}
        >
          <div className="mx-auto max-w-[1460px] px-6 py-6">
            <AdminBreadcrumbNav />
            {children}
          </div>
        </main>
      </PersonaShellGuard>
    </StoreInitializer>
  );
}
