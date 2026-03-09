"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/stores";
import { generateSeedData } from "@/data/seed";
import { DashboardSkeleton } from "@/components/shared/skeleton-loader";

// Bump this version whenever seed data shape changes to force a reseed.
const SEED_VERSION = 17;
const SEED_VERSION_KEY = "peach-lms-seed-version";

export function StoreInitializer({ children }: { children: React.ReactNode }) {
  const hasHydrated = useStore((s) => s.ui.hasHydrated);
  const classes = useStore((s) => s.classes);
  const resetAllData = useStore((s) => s.resetAllData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    // Seed data if store is empty (first load) or if seed version is outdated
    const storedVersion = Number(localStorage.getItem(SEED_VERSION_KEY) || "0");
    if (classes.length === 0 || storedVersion < SEED_VERSION) {
      const seed = generateSeedData();
      resetAllData(seed);
      localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));
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
