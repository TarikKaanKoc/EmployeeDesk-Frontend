import { API_URL as BACKEND } from "@/lib/env";

/**
 * Keeping a session alive across a short-lived access token.
 *
 * The API issues a 30-minute access token and a 7-day refresh token. Storing
 * only the first made the cookie outlive the credential inside it - the console
 * looked signed in, then every call started returning 401 half an hour later.
 *
 * There is a second failure this repairs. When the API cannot identify the
 * caller from an expired bearer, its rate limiter falls back to keying by IP
 * address, so *every* expired session on a host shares one bucket and the reads
 * start returning 429. An expired token therefore did not degrade to "sign in
 * again"; it degraded to "the console is rate-limited". Refreshing before the
 * token dies keeps requests attributable to a user, which keeps the limits
 * per-user.
 *
 * Runs in both the Proxy (edge) and route handlers (node), so it stays on
 * `fetch` and `atob` and imports nothing platform-specific.
 *
 * Two callers means two chances to spend the same refresh token. The API
 * rotates it, so whichever `/auth/refresh` lands second is told the token is
 * gone - which must not be read as "signed out". The rules that stop that:
 *
 *  - The Proxy is the only *proactive* renewer. It refreshes a token that is
 *    about to expire, on navigations. The API route only refreshes a token
 *    that is already dead, or that the API has just rejected - so the two
 *    paths ask for a new pair in the same window only when a page is open and
 *    idle right across the expiry, and even then:
 *  - Calls for the same refresh token share one flight and remember the
 *    answer briefly (`refreshSession`), so parallel fetches from one page -
 *    the usual shape of a console screen loading - spend it once.
 *  - A failed refresh is never proof the session is over. If the access token
 *    in hand is still valid, callers keep using it; if it is not, they answer
 *    401 or redirect to sign in *without* deleting the cookies - the browser
 *    may already hold the pair the other path just won.
 */


/** Refresh this many seconds before expiry, so a request in flight is never cut. */
const SKEW_SECONDS = 120;

export interface RefreshedSession {
  accessToken: string;
  refreshToken: string;
}

/**
 * Whether a token is past (or nearly past) its expiry.
 *
 * The payload is read, not verified: this only decides *when* to refresh. The
 * API verifies the signature on every call, so a forged `exp` buys an attacker
 * nothing but an early refresh attempt with a token that will still be rejected.
 */
export function isExpiring(token: string, skewSeconds = SKEW_SECONDS): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(
      atob(padded + "=".repeat((4 - (padded.length % 4)) % 4)),
    );
    if (typeof claims.exp !== "number") return true;
    return claims.exp * 1000 - Date.now() < skewSeconds * 1000;
  } catch {
    // Unreadable token: treat as expired so the refresh path decides, rather
    // than sending something malformed to the API.
    return true;
  }
}

/** Past expiry outright, no skew: the API will reject it. */
export function isExpired(token: string): boolean {
  return isExpiring(token, 0);
}

/**
 * How long a spent refresh token still answers with the pair it bought.
 *
 * A request can arrive carrying a token that was rotated a moment ago by a
 * sibling request whose `Set-Cookie` the browser has not applied yet. Handing
 * it the same fresh pair is correct - it is the same session - and refusing
 * it would sign the reader out for having two tabs open.
 */
const REMEMBER_MS = 60_000;

interface Flight {
  promise: Promise<RefreshedSession | null>;
  /** When the settled answer stops being reusable. */
  until: number;
}

/**
 * Per-process, keyed by the refresh token being spent. The Proxy (edge) and
 * the route handlers (node) each have their own; the rules above are what
 * covers the seam between them.
 */
const flights = new Map<string, Flight>();

/**
 * Trade a refresh token for a fresh pair. Returns null when it is spent -
 * which callers must treat as "not this way", not "signed out".
 *
 * Single-flight per token: concurrent callers share one `/auth/refresh`, and
 * a caller arriving just after it settled gets the same answer for a minute.
 */
export function refreshSession(
  refreshToken: string,
): Promise<RefreshedSession | null> {
  const now = Date.now();
  const inFlight = flights.get(refreshToken);
  if (inFlight && inFlight.until > now) return inFlight.promise;

  const flight: Flight = {
    promise: exchange(refreshToken).then((renewed) => {
      // A failure is not remembered: the next caller should ask again rather
      // than inherit a transient error for a minute.
      if (!renewed) flights.delete(refreshToken);
      else flight.until = Date.now() + REMEMBER_MS;
      return renewed;
    }),
    // While in flight, share it regardless of how long the API takes.
    until: Number.POSITIVE_INFINITY,
  };
  flights.set(refreshToken, flight);

  // Keep the map bounded: anything past its window is dropped on the way in.
  for (const [key, entry] of flights) {
    if (entry.until <= now) flights.delete(key);
  }

  return flight.promise;
}

async function exchange(
  refreshToken: string,
): Promise<RefreshedSession | null> {
  try {
    const response = await fetch(`${BACKEND}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body = await response.json();
    if (!body.accessToken) return null;
    return {
      accessToken: body.accessToken,
      // A rotating API returns a new refresh token; one that does not, keeps
      // the old one working. Handle both rather than assuming.
      refreshToken: body.refreshToken ?? refreshToken,
    };
  } catch {
    return null;
  }
}
