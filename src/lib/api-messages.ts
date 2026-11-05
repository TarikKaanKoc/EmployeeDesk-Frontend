import "server-only";

import { getScope } from "@/i18n/server";

/**
 * The route handlers' own error messages, in the reader's language.
 *
 * A handler answers the browser directly, and what it says lands in a form
 * banner - so "Not authenticated" in English on an Arabic console was a
 * translation gap, not a log line. The locale cookie is already on the
 * request; this reads it the same way a server component does.
 */
export async function apiMessages() {
  return (await getScope("errors")).api;
}
