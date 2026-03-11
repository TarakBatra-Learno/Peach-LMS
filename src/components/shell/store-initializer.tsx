"use client";

import { useEffect } from "react";
import { useStore } from "@/stores";
import { generateSeedData } from "@/data/seed";
import { DashboardSkeleton } from "@/components/shared/skeleton-loader";

// Bump this version whenever seed data shape changes to force a reseed.
const SEED_VERSION = 21;
const SEED_VERSION_KEY = "peach-lms-seed-version";

export function StoreInitializer({ children }: { children: React.ReactNode }) {
  const hasHydrated = useStore((s) => s.ui.hasHydrated);
  const classes = useStore((s) => s.classes);
  const parentProfiles = useStore((s) => s.parentProfiles);
  const resetAllData = useStore((s) => s.resetAllData);
  const storedVersion =
    typeof window === "undefined"
      ? 0
      : Number(window.localStorage.getItem(SEED_VERSION_KEY) || "0");
  const needsSeed =
    hasHydrated &&
    (classes.length === 0 || parentProfiles.length === 0 || storedVersion < SEED_VERSION);

  useEffect(() => {
    if (!needsSeed) return;

    const seed = generateSeedData();
    resetAllData(seed);
    window.localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));
  }, [needsSeed, resetAllData]);

  const ready = hasHydrated && !needsSeed;

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
