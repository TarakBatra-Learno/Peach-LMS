const FAMILY_DEMO_NOW = new Date("2026-02-28T09:00:00.000Z");

export function getFamilyDemoNow() {
  return new Date(FAMILY_DEMO_NOW);
}

export function getFamilyDemoNowMs() {
  return FAMILY_DEMO_NOW.getTime();
}
