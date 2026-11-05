import type { NextConfig } from "next";
import path from "path";

/**
 * Response headers for every route - all but the Content-Security-Policy,
 * which is minted per request in `src/proxy.ts` because it carries a nonce.
 *
 * A static policy would need `script-src 'unsafe-inline'`: Next emits inline
 * scripts of its own and a static header cannot name them, and that one
 * allowance would let an injected script run. A nonce closes it, and a nonce
 * has to be different on every response, which a config file cannot do.
 *
 * The remaining headers are static by nature and stay here.
 */
const PRODUCTION = process.env.NODE_ENV === "production";

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Only meaningful over HTTPS, so only in production: a dev server on
  // http://localhost must not teach the browser to demand TLS from it.
  ...(PRODUCTION
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // The container runs the standalone server (`node server.js`); the build
  // folds the traced node_modules subset in, so the image stays small.
  output: "standalone",
  experimental: {
    // Keep a visited or prefetched screen in the browser's router cache for
    // a minute. Every page here is dynamic, and with the default of zero each
    // click refetched from the server and flashed a skeleton over data that
    // had not changed; together with the rail's full prefetch this is what
    // makes navigation feel local. Writes still call `router.refresh()`,
    // which bypasses this; the cache only covers plain navigation.
    staleTimes: { dynamic: 60, static: 180 },
  },
  // The API is called as `/api/backend/health/` - FastAPI's own spelling,
  // trailing slash included. Without this Next answers with a 308 to the
  // slash-less form, and a redirected POST is one more place for a browser
  // to drop the body or upgrade the scheme. The route handler sees the path
  // either way; the slash is passed on to the API in the proxy.
  skipTrailingSlashRedirect: true,
  async headers() {
    // The API proxy sets its own framing headers per response: a PDF may be
    // framed by this origin (the document viewer), everything else may not.
    // The global rule would stamp `frame-ancestors 'none'` on the PDF too.
    return [{ source: "/((?!api/backend).*)", headers: SECURITY_HEADERS }];
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
