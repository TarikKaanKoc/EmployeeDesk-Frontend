import { NextResponse } from "next/server";

/**
 * Receives what `reportError` sends and makes it visible to someone who is
 * not the person who crashed: a structured line in the server log, and a
 * forward to `ERROR_REPORT_WEBHOOK_URL` (Slack, Zapier, a Sentry ingest
 * proxy…) when it is set. No authentication - an error boundary may be the
 * one place a broken session cannot present a cookie - so the payload is
 * capped and never interpreted, only relayed.
 */
const MAX_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const raw = await request.text().catch(() => "");
  if (!raw || raw.length > MAX_BYTES) {
    return new NextResponse(null, { status: 204 });
  }
  let report: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") report = parsed;
  } catch {
    report = null;
  }
  if (!report) return new NextResponse(null, { status: 204 });

  const entry = {
    level: "error",
    source: "console-client",
    ...report,
    ip:
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
  };
  console.error(JSON.stringify(entry));

  const webhook = process.env.ERROR_REPORT_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `[app] ${String(report.message ?? "error")} | ${String(report.url ?? "")}`, ...entry }),
        cache: "no-store",
      });
    } catch {
      // The log line above already has it.
    }
  }
  return new NextResponse(null, { status: 204 });
}
