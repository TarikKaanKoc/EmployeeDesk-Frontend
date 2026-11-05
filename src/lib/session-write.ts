import "server-only";

import { cookies } from "next/headers";

import {
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
  cookieOptions,
} from "@/lib/session-cookie";

/** The shape every sign-in endpoint on the API answers with. */
export interface ApiSession {
  accessToken?: string;
  refreshToken?: string;
  user?: unknown;
  /** Present on a password-accepted-but-MFA-pending answer. */
  mfaRequired?: boolean;
  mfaToken?: string;
  recoveryCodesLeft?: number;
}

/**
 * Turn an API sign-in response into the console's cookies.
 *
 * One writer for every door - password, Google, Microsoft - so a cookie added
 * for one cannot be forgotten for the others. Returns false when the response
 * carries no usable access token; the caller decides how to say so.
 */
export async function writeSession(
  session: ApiSession,
  remember: boolean,
): Promise<boolean> {
  const token = session.accessToken;
  if (typeof token !== "string" || token.length === 0) return false;

  const store = await cookies();
  const options = cookieOptions(remember);
  // Recorded so every later renewal (Proxy, backend proxy) gives the rewritten
  // cookies the same lifetime the reader chose here.
  if (remember) {
    store.set(REMEMBER_COOKIE, "1", options);
  } else {
    store.delete(REMEMBER_COOKIE);
  }
  store.set(SESSION_COOKIE, token, options);
  // The access token expires in 30 minutes; this is what lets the session
  // outlive it without asking the reader to sign in mid-review.
  if (typeof session.refreshToken === "string" && session.refreshToken) {
    store.set(REFRESH_COOKIE, session.refreshToken, options);
  }
  // Display-only, so it is deliberately not HttpOnly - the header needs a name
  // to show and it carries no authority of its own.
  store.set(USER_COOKIE, JSON.stringify(session.user ?? {}), {
    ...options,
    httpOnly: false,
  });
  return true;
}
