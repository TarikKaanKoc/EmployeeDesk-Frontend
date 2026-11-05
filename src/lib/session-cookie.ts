/**
 * Names and options for the session cookies.
 *
 * Tokens live in HttpOnly cookies, not in localStorage: anything readable by
 * JavaScript is readable by injected JavaScript, and these are the only thing
 * standing between an anonymous visitor and every employee's records. Client
 * code never sees them - browser calls go through the same-origin proxy in
 * `app/api/backend`, which attaches the bearer server-side.
 *
 * Two cookies, because the access token is deliberately short-lived (30
 * minutes) while a working session is not. Holding only the access token made
 * the cookie outlive the credential inside it: the session looked alive right
 * up until every request began failing. The refresh token is what makes the
 * long cookie honest - see `session-refresh.ts`.
 */

export const SESSION_COOKIE = "employeedesk_token";
export const REFRESH_COOKIE = "employeedesk_refresh";
export const USER_COOKIE = "employeedesk_user";
/**
 * Whether "keep me signed in" was ticked, kept beside the tokens.
 *
 * The choice has to outlive the sign-in request: every token renewal rewrites
 * the session cookies, and it needs to know which lifetime to give them.
 * Without this, the first refresh - about 28 minutes in - silently promoted an
 * "until I close the browser" session to a 30-day one. Present (value `1`)
 * means remembered; absent means a session cookie. HttpOnly like the rest, so
 * a script cannot flip it.
 */
export const REMEMBER_COOKIE = "employeedesk_remember";

/** Reads the stored preference back; the cookie is a flag, not a value. */
export function isRemembered(value: string | undefined): boolean {
  return value === "1";
}

/** 30 days when "keep me signed in" is ticked, otherwise a session cookie. */
export function cookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // Secure in production only; on http://localhost a Secure cookie is
    // dropped silently, which would look like a broken login.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  };
}
