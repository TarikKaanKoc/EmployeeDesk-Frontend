"use client";

/**
 * Where a client-side crash goes.
 *
 * `error.tsx` used to `console.error` and stop - which is a report only the
 * person who crashed can read. This posts the essentials to the console's own
 * route (`/api/client-errors`), which logs them server-side and forwards them
 * to `ERROR_REPORT_WEBHOOK_URL` when one is configured. Vendor-neutral on
 * purpose: swapping in Sentry later is one function body, not a hunt through
 * every boundary.
 *
 * Best-effort and fire-and-forget: a failed report must never become a second
 * error on a screen that already has one.
 */
export function reportError(
  error: Error & { digest?: string },
  context: { boundary: string },
): void {
  if (typeof window === "undefined") return;
  const payload = {
    message: error.message,
    name: error.name,
    digest: error.digest ?? null,
    stack: error.stack?.slice(0, 4000) ?? null,
    boundary: context.boundary,
    url: window.location.href,
    userAgent: navigator.userAgent,
    at: new Date().toISOString(),
  };
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon?.("/api/client-errors", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Nothing to do: reporting is optional, the screen is not.
  }
}
