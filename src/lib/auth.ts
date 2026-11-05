/**
 * Sign-in for the console.
 *
 * The browser posts credentials to the app's own `/api/session`, never to the
 * API directly. That route performs the exchange server-side and stores the
 * tokens in HttpOnly cookies, so no token and no API origin ever reaches page
 * scripts.
 */

export interface Credentials {
  email: string;
  password: string;
  remember: boolean;
}

/** The signed-in employee, as `/auth/me` describes them. */
export interface SessionUser {
  employeeId: string;
  email: string;
  displayNameEn: string;
  displayNameAr: string;
  department: string;
  role: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function login(credentials: Credentials): Promise<SessionUser> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: credentials.email.trim(),
      password: credentials.password,
      remember: credentials.remember,
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AuthError(
      body?.message ?? `Sign-in failed (${response.status}).`,
      response.status,
      typeof body?.code === "string" ? body.code : undefined,
    );
  }
  return body.user as SessionUser;
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/session", { method: "DELETE" });
  if (!response.ok) {
    throw new AuthError(`Sign-out failed (${response.status}).`, response.status);
  }
}

/**
 * Where to go after sign-in. `?next=` is honoured only when it resolves to a
 * path on this origin; `/\evil.com` parses to `//evil.com`, so a prefix
 * check alone would be an open redirect.
 */
export function safeDestination(
  requested: string | null,
  origin: string,
  fallback = "/copilot",
): string {
  if (!requested || !requested.startsWith("/")) return fallback;
  try {
    const url = new URL(requested, origin);
    if (url.origin !== origin) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
