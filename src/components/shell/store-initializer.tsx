"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/stores";
import { generateSeedData } from "@/data/seed";
import { DashboardSkeleton } from "@/components/shared/skeleton-loader";

export function StoreInitializer({ children }: { children: React.ReactNode }) {
  const hasHydrated = useStore((s) => s.ui.hasHydrated);
  const classes = useStore((s) => s.classes);
  const resetAllData = useStore((s) => s.resetAllData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    // Seed data if store is empty (first load)
    if (classes.length === 0) {
      const seed = generateSeedData();
      resetAllData(seed);
    }

    // Auto-detect current term from report cycle dates
    const reportCycles = useStore.getState().reportCycles;
    const today = new Date().toISOString().slice(0, 10);
    const currentCycle = reportCycles.find(
      (rc) => rc.startDate <= today && today <= rc.endDate
    );
    if (currentCycle) {
      useStore.getState().setActiveTerm(currentCycle.term);
    }

    setReady(true);
  }, [hasHydrated, classes.length, resetAllData]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-5xl px-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
