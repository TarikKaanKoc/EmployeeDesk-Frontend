import "server-only";

import { cookies } from "next/headers";

import { type Locale, direction, toLocale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/cookie";
import {
  type Dictionary,
  type Namespace,
  type Scope,
  getDictionary,
} from "@/i18n/dictionaries";

/**
 * The locale for this request, from the cookie the Proxy guarantees is set.
 *
 * "Guarantees" is doing real work: because the Proxy writes the cookie on the
 * way in, a server component never has to negotiate `Accept-Language` itself,
 * and every component in a single render therefore agrees on the language. A
 * missing cookie only happens on paths the Proxy does not match, where English
 * is the right answer anyway.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return toLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getDirection(): Promise<"ltr" | "rtl"> {
  return direction(await getLocale());
}

/** The whole tree, for a layout that needs strings from several features. */
export async function getMessages(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}

/**
 * One feature's strings, in a server component:
 *
 * ```tsx
 * const t = await getScope("records");
 * return <h1>{t.title}</h1>;
 * ```
 *
 * Returning the namespace object rather than a `t("a.b.c")` string lookup is
 * what makes a typo a compile error and gives the editor autocomplete on every
 * key - a dotted string is neither.
 */
export async function getScope<N extends Namespace>(
  namespace: N,
): Promise<Scope<N>> {
  const dictionary = await getMessages();
  return dictionary[namespace];
}
