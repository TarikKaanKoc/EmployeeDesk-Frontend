/**
 * Stands in for `server-only` and `client-only` under Vitest.
 *
 * Both packages exist to make a build fail when a module crosses the
 * server/client line; they have no runtime behaviour and no resolution outside
 * Next's own bundler. Importing them in a test run is meaningless, so they
 * resolve to this empty module rather than an unresolved-import error.
 */
export {};
