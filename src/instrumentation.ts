/**
 * Runs once when the server boots (Next.js instrumentation hook).
 *
 * The production guard lives here rather than in a layout: a layout runs per
 * request and would fail every page one at a time, after the deploy already
 * looked green. Throwing at boot fails the deploy instead.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionEnv } = await import("@/lib/env");
    assertProductionEnv();
  }
}
