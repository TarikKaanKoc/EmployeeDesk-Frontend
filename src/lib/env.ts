import "server-only";

/**
 * Server-side configuration, resolved once.
 *
 * `API_URL` is read here and nowhere else. A per-file fallback to a loopback
 * address would let a production deployment that forgot the variable start
 * up and quietly answer "not reachable" for everything. Here the fallback
 * exists only outside production; in production a missing value is a startup
 * error (see `instrumentation.ts`), which is the only place a
 * misconfiguration is cheap.
 */
const PRODUCTION = process.env.NODE_ENV === "production";
const DEV_API_URL = "http://127.0.0.1:8012/api";

function resolveApiUrl(): string {
  const value = process.env.API_URL?.trim();
  if (value) return value.replace(/\/$/, "");
  if (PRODUCTION) {
    throw new Error(
      "API_URL is not set. The console cannot reach the EmployeeDesk API without it.",
    );
  }
  return DEV_API_URL;
}

/** The analysis API, without a trailing slash. */
export const API_URL = resolveApiUrl();

/**
 * Everything a production deployment must provide, checked at boot.
 *
 * Public keys are inlined at build time, so a missing one cannot be caught by
 * reading `process.env` on the client - by then it is simply an empty string
 * and the widget is skipped. Checking on the server, where the same variables
 * are visible, is what turns "Turnstile silently off" into a refusal to start.
 */
export function assertProductionEnv(): void {
  if (!PRODUCTION) return;
  const missing = [
    ["API_URL", process.env.API_URL],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(
      `Refusing to start in production without: ${missing.join(", ")}`,
    );
  }
}
