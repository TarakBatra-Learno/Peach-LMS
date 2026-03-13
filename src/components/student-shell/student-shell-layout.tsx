"use client";

import { StudentSidebar } from "@/components/student-shell/student-sidebar";
import { StudentTopBar } from "@/components/student-shell/student-top-bar";
import { StudentBreadcrumbNav } from "@/components/student-shell/student-breadcrumb-nav";
import { PersonaShellGuard } from "@/components/shell/persona-shell-guard";
import { StoreInitializer } from "@/components/shell/store-initializer";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";

export function StudentShellLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useStore((store) => store.ui.sidebarCollapsed);

  return (
    <StoreInitializer>
      <PersonaShellGuard role="student">
        <StudentTopBar />
        <StudentSidebar />
        <main
          className={cn(
            "pt-[56px] transition-all duration-200 transition-shell min-h-screen",
            collapsed ? "pl-[72px]" : "pl-[280px]"
          )}
        >
          <div className="max-w-[1320px] mx-auto px-6 py-6">
            <StudentBreadcrumbNav />
            {children}
          </div>
        </main>
      </PersonaShellGuard>
    </StoreInitializer>
  );
}
