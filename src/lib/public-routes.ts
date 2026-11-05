/** Paths that need no session. Everything else is redirected to /login. */
export const PUBLIC_ROUTES = ["/login", "/robots.txt"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
