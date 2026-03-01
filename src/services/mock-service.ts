import { useStore } from "@/stores";

const MIN_LATENCY = 200;
const MAX_LATENCY = 600;

export async function simulateLatency(): Promise<void> {
  const { simulateLatency: enabled } = useStore.getState().ui;
  if (!enabled) return;
  const delay = Math.floor(Math.random() * (MAX_LATENCY - MIN_LATENCY + 1)) + MIN_LATENCY;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function mockServiceCall<T>(fn: () => T): Promise<T> {
  const { simulateErrors } = useStore.getState().ui;
  await simulateLatency();
  if (simulateErrors && Math.random() < 0.15) {
    throw new Error("Simulated error (demo mode)");
  }
  return fn();
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
