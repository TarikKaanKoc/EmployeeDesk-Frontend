import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiMessages } from "@/lib/api-messages";
import { API_URL as BACKEND } from "@/lib/env";
import {
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
} from "@/lib/session-cookie";
import { writeSession, type ApiSession } from "@/lib/session-write";

/**
 * Signs in and turns the result into HttpOnly session cookies. The API
 * answers with a token pair only; the display user comes from `/auth/me`
 * with the fresh access token, so the sidebar can show a name on first paint.
 */
export async function POST(request: Request) {
  const messages = await apiMessages();
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ message: messages.missingCredentials }, { status: 400 });
  }

  let session: ApiSession;
  try {
    const clientIp = request.headers.get("x-forwarded-for");
    const upstream = await fetch(`${BACKEND}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientIp ? { "X-Forwarded-For": clientIp } : {}),
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!upstream.ok) {
      let message =
        upstream.status === 401
          ? "Email or password is incorrect."
          : upstream.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : `Sign-in failed (${upstream.status}).`;
      let code: string | undefined;
      try {
        const detail = await upstream.json();
        message = detail.message ?? detail.detail ?? message;
        if (typeof detail.errorCode === "string" && !detail.errorCode.startsWith("HTTP_")) {
          code = detail.errorCode;
        }
      } catch {
        // Non-JSON error body; the status is all we have.
      }
      return NextResponse.json({ message, code }, { status: upstream.status });
    }
    session = await upstream.json();
    if (typeof session.accessToken === "string") {
      const me = await fetch(`${BACKEND}/auth/me`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (me.ok) session.user = await me.json();
    }
  } catch {
    return NextResponse.json({ message: messages.unreachable }, { status: 503 });
  }

  if (!(await writeSession(session, Boolean(body?.remember)))) {
    return NextResponse.json({ message: messages.signInFailed }, { status: 502 });
  }
  return NextResponse.json({ user: session.user ?? null });
}

/** Sign out: drop the cookies. The API's own revocation happens through the proxy. */
export async function DELETE() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await fetch(`${BACKEND}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(REMEMBER_COOKIE);
  store.delete(USER_COOKIE);
  return NextResponse.json({ ok: true });
}
