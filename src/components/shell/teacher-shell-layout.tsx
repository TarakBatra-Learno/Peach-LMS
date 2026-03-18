"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { StoreInitializer } from "@/components/shell/store-initializer";
import { BreadcrumbNav } from "@/components/shell/breadcrumb-nav";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PersonaShellGuard } from "@/components/shell/persona-shell-guard";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export function TeacherShellLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useStore((store) => store.ui.sidebarCollapsed);
  const searchParams = useSearchParams();
  const embedded = searchParams.get("embed") === "1";

  return (
    <StoreInitializer>
      <PersonaShellGuard role={["teacher", "admin"]}>
        {embedded ? (
          <main className="min-h-screen bg-[#f7f8fa]">
            <div className="mx-auto max-w-[1320px] px-6 py-6">
              <ErrorBanner />
              {children}
            </div>
          </main>
        ) : (
          <>
            <TopBar />
            <Sidebar />
            <main
              className={cn(
                "min-h-screen bg-[#f7f8fa] pt-[56px] transition-all duration-200 transition-shell",
                collapsed ? "pl-[72px]" : "pl-[280px]"
              )}
            >
              <div className="max-w-[1320px] mx-auto px-6 py-6">
                <BreadcrumbNav />
                <ErrorBanner />
                {children}
              </div>
            </main>
          </>
        )}
      </PersonaShellGuard>
    </StoreInitializer>
  );
}
