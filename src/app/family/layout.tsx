"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { StoreInitializer } from "@/components/shell/store-initializer";
import { cn } from "@/lib/utils";
import { FamilyTopBar } from "@/components/family-shell/family-top-bar";
import { FamilySidebar } from "@/components/family-shell/family-sidebar";
import { FamilyBreadcrumbNav } from "@/components/family-shell/family-breadcrumb-nav";

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  const currentUser = useStore((store) => store.currentUser);
  const collapsed = useStore((store) => store.ui.sidebarCollapsed);
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role !== "parent") {
      router.push("/enter");
    }
  }, [currentUser, router]);

  return (
    <StoreInitializer>
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
    </StoreInitializer>
  );
}
