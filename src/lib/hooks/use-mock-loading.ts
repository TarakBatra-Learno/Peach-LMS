"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/stores";

export function useMockLoading(deps: unknown[] = []) {
  const [loading, setLoading] = useState(true);
  const simulateLatency = useStore((s) => s.ui.simulateLatency);

  useEffect(() => {
    if (!simulateLatency) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const delay = Math.floor(Math.random() * 400) + 200;
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulateLatency, ...deps]);

  return loading;
}
