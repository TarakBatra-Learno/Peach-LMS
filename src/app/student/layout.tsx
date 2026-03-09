"use client";

import { StudentSidebar } from "@/components/student-shell/student-sidebar";
import { StudentTopBar } from "@/components/student-shell/student-top-bar";
import { StudentBreadcrumbNav } from "@/components/student-shell/student-breadcrumb-nav";
import { StoreInitializer } from "@/components/shell/store-initializer";
import { useStore } from "@/stores";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useStore((s) => s.ui.sidebarCollapsed);
  const currentUser = useStore((s) => s.currentUser);
  const router = useRouter();

  // Guard: redirect to /enter if no user or user is not a student
  useEffect(() => {
    if (currentUser && currentUser.role !== "student") {
      router.push("/enter");
    }
  }, [currentUser, router]);

  return (
    <StoreInitializer>
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
    </StoreInitializer>
  );
}
