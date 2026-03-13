const DEMO_NOW = new Date(2026, 2, 2, 9, 0, 0);

export function getDemoNow() {
  return new Date(DEMO_NOW);
}

export function getDemoNowMs() {
  return DEMO_NOW.getTime();
}

export function getDemoNowIso() {
  return DEMO_NOW.toISOString();
}
