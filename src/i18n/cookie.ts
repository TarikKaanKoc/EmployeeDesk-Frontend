/**
 * The locale cookie.
 *
 * Not HttpOnly, unlike the session cookies next to it: this carries a display
 * preference, never authority, and the client needs to write it the moment the
 * reader picks a language - before the profile round-trip finishes, so the UI
 * flips at the speed of the click rather than the speed of the API.
 *
 * A year, because a language preference does not expire the way a session does.
 */

export const LOCALE_COOKIE = "employeedesk_locale";

const ONE_YEAR = 60 * 60 * 24 * 365;

export const localeCookieOptions = {
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_YEAR,
};

/** Client-side write. The server reads it on the very next request. */
export function writeLocaleCookie(locale: string) {
  const secure = localeCookieOptions.secure ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
}
