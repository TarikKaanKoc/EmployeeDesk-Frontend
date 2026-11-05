import type { Locale } from "@/i18n/config";
import { ar } from "@/i18n/dictionaries/ar";
import { en } from "@/i18n/dictionaries/en";

/**
 * English is the schema, not merely the fallback.
 *
 * `Dictionary` is derived from the English tree, and every other locale is
 * declared as a `Dictionary` - so a key added to `en/` and forgotten in `ar/`
 * is a build failure, not a screen that silently renders `undefined` in
 * production. This is the whole reason the dictionaries are TypeScript rather
 * than JSON: JSON cannot enforce that.
 */
export type Dictionary = typeof en;

/** A single feature's slice, e.g. `Namespace<"records">`. */
export type Namespace = keyof Dictionary;

export type Scope<N extends Namespace> = Dictionary[N];

const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  ar,
};

/**
 * Synchronous by design. The dictionaries are plain objects compiled into the
 * bundle, not fetched - a page render never waits on a translation, and there
 * is no loading state to design around.
 */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
