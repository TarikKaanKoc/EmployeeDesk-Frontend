import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { LOCALE_COOKIE, localeCookieOptions } from "@/i18n/cookie";
import { isPublicPath } from "@/lib/public-routes";
import {
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
  cookieOptions,
  isRemembered,
} from "@/lib/session-cookie";
import { isExpired, isExpiring, refreshSession } from "@/lib/session-refresh";

/**
 * First visit only: read `Accept-Language` so an Arabic-speaking reader does
 * not have to find the language picker before they can read the screen that
 * contains it. Once they choose explicitly the cookie is authoritative and this
 * never runs again - a browser preference must not override a stated one.
 *
 * Parsed by hand rather than with a matcher library: there are two locales and
 * no regional variants, so the full BCP 47 negotiation would be a dependency
 * bought to answer a yes/no question.
 */
function negotiate(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        // `ar-QA`, `ar-AE` and `ar` all mean the same dictionary to us.
        base: tag.trim().toLowerCase().split("-")[0],
        weight: q ? Number.parseFloat(q.split("=")[1]) || 0 : 1,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  return ranked.find((entry) => isLocale(entry.base))?.base ?? DEFAULT_LOCALE;
}

/** Pages that a signed-in reader has no business seeing. */
const AUTH_PAGES = ["/login"];

const PRODUCTION = process.env.NODE_ENV === "production";

/**
 * The Content-Security-Policy, built around a nonce minted for this one
 * request.
 *
 * Hosts are strict, inline code is not allowed unless it carries the nonce.
 * `'strict-dynamic'` is what makes that workable: a script the nonce admits
 * (Next's own bootstrap, the Turnstile loader) may load further scripts, and
 * the host list is then ignored by browsers that understand it - the
 * Cloudflare host stays for the ones that do not. `'unsafe-eval'` is
 * development only: React Refresh needs it, production does not.
 *
 * Styles keep `'unsafe-inline'`. Next, next/font and the chart theme all
 * write inline style, and a style nonce buys little: style injection is not
 * code execution.
 */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${PRODUCTION ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    // Profile pictures: Google serves the signed-in account's own photo,
    // Gravatar answers for any address by hash; initials otherwise.
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    // `data:` for Turnstile's own tamper probe (`fetch("data:,")`), which the
    // widget runs on every load. A data: URL never leaves the machine.
    "connect-src 'self' data: https://challenges.cloudflare.com",
    // 'self' so a stored document can be shown in a frame - the bytes come
    // from this origin's own proxy, never from a third party.
    "frame-src 'self' https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Production only: on http://localhost the browser would upgrade the dev
    // server's own redirects to https and every write would fail.
    ...(PRODUCTION ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

/** 128 bits of randomness, base64: what the CSP spec asks of a nonce. */
function mintNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Route guard and session keep-alive. (Next 16 renamed Middleware to Proxy;
 * same mechanism.)
 *
 * The guard is an optimistic check - it looks for a session cookie, not a valid
 * one, because the Proxy runs on every request and has no business calling the
 * API to authorise each. The real gate is the backend, where every
 * endpoint requires a valid token and returns 401 without one. This layer only
 * stops an anonymous visitor from landing on a page that cannot load.
 *
 * It is also where the access token is renewed. Doing it here rather than after
 * a failure means the server components downstream are handed a live token on
 * the same pass, so a page render never has to fail once to discover it should
 * have refreshed.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = mintNonce();
  const csp = contentSecurityPolicy(nonce);
  const access = request.cookies.get(SESSION_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const guarded = !isPublicPath(pathname);

  // Resolve the locale before anything else, and pin it onto the incoming
  // request. Server components read the cookie off *this* request, so setting
  // it only on the response would leave the very first render - the one the
  // reader actually sees - in the wrong language.
  const stated = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stated)
    ? stated
    : negotiate(request.headers.get("accept-language"));
  request.cookies.set(LOCALE_COOKIE, locale);

  /**
   * Every exit from this function goes through here. The locale cookie is
   * re-stamped on redirects too: a reader bounced to `/login` must land there
   * in the language they were reading a moment ago, not in the default.
   */
  function withLocale(response: NextResponse) {
    if (stated !== locale) {
      response.cookies.set(LOCALE_COOKIE, locale, localeCookieOptions);
    }
    // On every exit, redirects included: a redirect carries no script, but
    // a response with no policy is a response an error page could render
    // under, and the header costs nothing on the way to the next one.
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  /**
   * `NextResponse.next()` does not carry a mutated request cookie jar on its
   * own - the downstream render reads the original `cookie` header. Rebuilding
   * it from the jar is what actually delivers the locale (and, below, a freshly
   * renewed token) to the server components on this same pass.
   */
  function forward() {
    const headers = new Headers(request.headers);
    headers.set("cookie", request.cookies.toString());
    // Both on the request: Next reads the nonce off the policy header to
    // stamp its own inline scripts, and the root layout reads `x-nonce` to
    // hand it to the components that add a script tag by hand.
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", csp);
    return NextResponse.next({ request: { headers } });
  }

  /**
   * @param clear Drop the session cookies on the way out. Only when there is
   * nothing to keep: a refresh that failed may have failed because the API
   * route won the same token a moment ago, and the browser is about to be
   * handed the pair it bought. Deleting here would sign that reader out.
   */
  function toLogin(clear: boolean) {
    const login = new URL("/login", request.url);
    // Remember where they were headed, query string included: a filtered
    // work queue lives entirely in the search params.
    login.searchParams.set("next", pathname + request.nextUrl.search);
    const response = NextResponse.redirect(login);
    if (clear) {
      response.cookies.delete(SESSION_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      response.cookies.delete(REMEMBER_COOKIE);
      // Display-only, but it is the one cookie a script can read: a name and
      // an email must not outlive the session on a shared machine.
      response.cookies.delete(USER_COOKIE);
    }
    return response;
  }

  if (guarded && !access && !refresh) return withLocale(toLogin(true));

  // Renew before the token dies rather than after it fails. An expired bearer
  // is worse than useless here: the API can no longer tell who is calling, so
  // its rate limiter falls back to keying by IP and the reads start answering
  // 429 instead of 401.
  const onAuthPage = AUTH_PAGES.includes(pathname);

  if ((guarded || onAuthPage) && refresh && (!access || isExpiring(access))) {
    const renewed = await refreshSession(refresh);
    if (!renewed) {
      // The token in hand is still good for a couple of minutes: use it. The
      // renewal that failed here may have succeeded on the API route, and the
      // next navigation will carry whichever pair the browser ends up with.
      if (access && !isExpired(access)) return withLocale(forward());
      // Nothing usable. Send them to sign in, but leave the cookies alone
      // for the same reason - the login page re-checks and comes straight
      // back to the dashboard if a live pair turns up.
      return withLocale(guarded ? toLogin(false) : forward());
    }

    // Hand the new token to this same request, so the server components
    // rendering below see it instead of the stale one.
    request.cookies.set(SESSION_COOKIE, renewed.accessToken);
    request.cookies.set(REFRESH_COOKIE, renewed.refreshToken);

    const response = onAuthPage
      ? NextResponse.redirect(new URL("/copilot", request.url))
      : forward();

    // The lifetime comes from the choice made at sign-in, kept in its own
    // cookie: a `Set-Cookie` cannot say "keep whatever expiry this had", so
    // without reading it back every renewal would have to pick one.
    const options = cookieOptions(
      isRemembered(request.cookies.get(REMEMBER_COOKIE)?.value),
    );
    response.cookies.set(SESSION_COOKIE, renewed.accessToken, options);
    response.cookies.set(REFRESH_COOKIE, renewed.refreshToken, options);
    return withLocale(response);
  }

  if (guarded && !access) return withLocale(toLogin(true));

  if (onAuthPage && access && !isExpiring(access)) {
    return withLocale(
      NextResponse.redirect(new URL("/copilot", request.url)),
    );
  }

  return withLocale(forward());
}

export const config = {
  matcher: [
    /**
     * Every page, not just the guarded ones.
     *
     * The auth screens, the marketing root and the error pages all need a
     * locale too, and the cookie is only written here - a reader who lands on
     * `/register` first would otherwise read it in English and then watch the
     * app switch languages the moment they signed in. Static assets, the API
     * routes and the image optimiser are excluded because none of them render
     * text a reader sees.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
