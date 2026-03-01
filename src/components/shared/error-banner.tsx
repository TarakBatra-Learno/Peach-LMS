"use client";

import { useStore } from "@/stores";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorBanner() {
  const simulateErrors = useStore((s) => s.ui.simulateErrors);

  if (!simulateErrors) return null;

  return (
    <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <div>
          <p className="text-[13px] font-medium text-destructive">
            Simulated error — data may be incomplete
          </p>
          <p className="text-[12px] text-muted-foreground">
            Turn off &quot;Simulate errors&quot; in the top-bar menu to restore normal behavior.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 text-[12px] h-7"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="h-3 w-3 mr-1.5" />
        Retry
      </Button>
    </div>
  );
}
