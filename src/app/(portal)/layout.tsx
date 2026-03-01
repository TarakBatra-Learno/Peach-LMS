"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { StoreInitializer } from "@/components/shell/store-initializer";
import { BreadcrumbNav } from "@/components/shell/breadcrumb-nav";
import { ErrorBanner } from "@/components/shared/error-banner";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useStore((s) => s.ui.sidebarCollapsed);

  return (
    <StoreInitializer>
      <TopBar />
      <Sidebar />
      <main
        className={cn(
          "pt-[56px] transition-all duration-200 transition-shell min-h-screen",
          collapsed ? "pl-[72px]" : "pl-[280px]"
        )}
      >
        <div className="max-w-[1320px] mx-auto px-6 py-6">
          <BreadcrumbNav />
          <ErrorBanner />
          {children}
        </div>
      </main>
    </StoreInitializer>
  );
}
