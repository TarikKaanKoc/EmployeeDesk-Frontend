import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  SESSION_COOKIE,
  cookieOptions,
  isRemembered,
} from "@/lib/session-cookie";
import { isExpired, refreshSession } from "@/lib/session-refresh";
import { apiMessages } from "@/lib/api-messages";
import { API_URL as BACKEND } from "@/lib/env";

/**
 * Same-origin proxy to the analysis API.
 *
 * Browser code cannot read the HttpOnly session cookie, so it cannot build an
 * Authorization header itself. It calls this instead: the cookie rides along
 * because the request is same-origin, and the bearer is attached here,
 * server-side. That keeps the token out of the page entirely and removes the
 * cross-origin CORS/cookie problem at the same time.
 *
 * The Proxy renews the token on navigations, but a console page can sit open
 * far longer than one, so this route renews too - on a 401, once, before
 * surfacing the failure. Long-lived views (an open chat panel, a run being
 * polled) would otherwise die at the 30-minute mark with no navigation to
 * rescue them.
 *
 * It does *not* renew early. Refreshing a token that is merely close to expiry
 * is the Proxy's job, and doing it from both places had them spending the same
 * rotating refresh token at once, with the loser reading "spent" as "signed
 * out". Here a token is used until the API says no - see `session-refresh.ts`
 * for the rest of the arrangement.
 */
async function forward(request: Request, path: string[]) {
  const store = await cookies();
  let token = store.get(SESSION_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;

  const messages = await apiMessages();
  if (!token && !refresh) {
    return NextResponse.json(
      { message: messages.notAuthenticated },
      { status: 401 },
    );
  }

  // Only a token that is already dead is replaced before the call; one that is
  // nearly dead is still a valid bearer, and the API will say so if not.
  let renewed: { accessToken: string; refreshToken: string } | null = null;
  if (refresh && (!token || isExpired(token))) {
    renewed = await refreshSession(refresh);
    if (renewed) token = renewed.accessToken;
  }
  if (!token || isExpired(token)) {
    // A plain 401, cookies untouched: the refresh may have been spent by the
    // Proxy on a navigation a moment ago, in which case the browser is about
    // to hold a live pair and the caller's retry will go through.
    return NextResponse.json(
      { message: messages.notAuthenticated },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  // The trailing slash is kept: FastAPI declares `/entities/` and answers the
  // slash-less form with a redirect, which is a wasted round trip per call.
  const slash = url.pathname.endsWith("/") ? "/" : "";
  const target = `${BACKEND}/${path.map(encodeURIComponent).join("/")}${slash}${url.search}`;
  // Read once, as bytes: the body is a stream, and a retry needs to send it
  // again. Bytes rather than text so the proxy has no opinion about what it
  // carries - a multipart upload goes through exactly as the browser built it,
  // boundary and all, instead of being decoded and re-labelled as JSON.
  //
  // A Blob, not an ArrayBuffer: the outgoing fetch takes an ArrayBuffer by
  // transfer and detaches it, so it cannot be sent a second time. A Blob
  // owns its bytes and can.
  const body = request.body ? await request.blob() : undefined;

  // The caller's content negotiation is its own business. Only the headers
  // that describe the payload and the wanted answer are passed on: `Cookie`,
  // `Host` and the rest belong to this origin, not the API.
  const headers = new Headers();
  for (const name of ["Content-Type", "Accept", "Accept-Language"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  async function call(bearer: string) {
    headers.set("Authorization", `Bearer ${bearer}`);
    return fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  }

  let response = await call(token);

  // The token can expire between the check above and the call, or have been
  // revoked. One retry, never a loop.
  if (response.status === 401 && refresh && !renewed) {
    renewed = await refreshSession(refresh);
    if (renewed) {
      token = renewed.accessToken;
      response = await call(token);
    }
  }

  const contentType =
    response.headers.get("Content-Type") ?? "application/json";

  /**
   * Statuses the fetch spec forbids a body on. `new Response(body, {status})`
   * throws outright for these - and `await response.text()` yields `""`, which
   * is still a body as far as the constructor is concerned. Forwarding a 204
   * therefore turned every successful write into a 500 on the way back: the
   * API had already done the work, and the browser was told it had failed.
   *
   * Every endpoint that answers "done, nothing to say" goes through here -
   * changing a password, switching organization, removing a member - so this
   * is the difference between those working and not.
   */
  const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

  // A streamed answer is passed straight through rather than buffered - the
  // point of streaming is that the reader sees the first sentence before the
  // last one exists, and `await response.text()` would throw that away.
  const streamed = contentType.includes("text/event-stream") && response.body;
  // The API decides how a download may be cached and what it is called
  // (`Cache-Control: private, no-store`, `nosniff`, the RFC 5987 filename),
  // so those headers are passed through rather than rebuilt. Nothing is ever
  // cacheable through here. This route is excluded from the global security
  // headers so a stored PDF can be shown in the document frame; everything
  // else keeps the API's stance: not to be framed by anyone.
  const framable = contentType.includes("application/pdf");
  const out = new Headers({
    "Content-Type": contentType,
    "Cache-Control": response.headers.get("Cache-Control") ?? "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": framable ? "SAMEORIGIN" : "DENY",
    "Content-Security-Policy": framable
      ? "default-src 'none'; frame-ancestors 'self'"
      : "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) out.set("Content-Disposition", disposition);
  // Next buffers by default behind some deployments; this opts out.
  if (streamed) out.set("X-Accel-Buffering", "no");

  const result = NULL_BODY_STATUSES.has(response.status)
    ? new NextResponse(null, { status: response.status })
    : streamed
      ? new NextResponse(response.body, {
          status: response.status,
          headers: out,
        })
      : new NextResponse(await response.arrayBuffer(), {
          status: response.status,
          headers: out,
        });

  // Some answers carry a fresh token pair of their own - a password change
  // revokes every earlier token and hands the caller new ones so *this*
  // device stays signed in. The API sets its own cookies, but those never
  // reach the browser through this proxy; the pair is lifted from the body.
  let rotated: { accessToken: string; refreshToken: string } | null = null;
  if (response.ok && !streamed && contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(
        new TextDecoder().decode(await result.clone().arrayBuffer()),
      );
      if (
        typeof parsed?.accessToken === "string" &&
        typeof parsed?.refreshToken === "string"
      ) {
        rotated = {
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
        };
      }
    } catch {
      // Not JSON after all; nothing to lift.
    }
  }

  const pair = rotated ?? renewed;
  if (pair) {
    // Same lifetime the reader chose at sign-in: a renewal replaces the value,
    // never the choice.
    const options = cookieOptions(
      isRemembered(store.get(REMEMBER_COOKIE)?.value),
    );
    result.cookies.set(SESSION_COOKIE, pair.accessToken, options);
    result.cookies.set(REFRESH_COOKIE, pair.refreshToken, options);
  }
  return result;
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(request, (await ctx.params).path);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(request, (await ctx.params).path);
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(request, (await ctx.params).path);
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(request, (await ctx.params).path);
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return forward(request, (await ctx.params).path);
}
