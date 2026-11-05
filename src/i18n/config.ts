/**
 * Locale registry.
 *
 * Deliberately free of `next/headers`, `next/server` and any dictionary import:
 * the Proxy, the root layout, client components and the settings form all need
 * to agree on what a locale *is*, and they run in three different environments.
 * Keeping this module dependency-free is what lets all of them import it.
 *
 * Adding a locale is a four-step change and the compiler enforces three of
 * them: add it here, add `src/i18n/dictionaries/<code>/`, register that folder
 * in `dictionaries.ts`, and the language picker picks it up on its own.
 */

export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Writing direction. This is the single source of truth for it - the `<html
 * dir>` attribute, the sidebar's collapse side and the chart axis flips all
 * read from here rather than testing `locale === "ar"` in ten places, so a
 * future RTL locale (Hebrew, Farsi) works everywhere by being listed once.
 */
const DIRECTIONS: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

export function direction(locale: Locale): "ltr" | "rtl" {
  return DIRECTIONS[locale];
}

export function isRtl(locale: Locale): boolean {
  return DIRECTIONS[locale] === "rtl";
}

/**
 * BCP 47 tags for `Intl`. Arabic is pinned to `-u-nu-latn` on purpose: this is
 * a console whose figures get reconciled against payslips, ERP exports and
 * PDFs that all print Latin digits. Rendering a balance or an amount in
 * Arabic-Indic numerals would make the screen and the document it describes
 * disagree at a glance. The *language* flips; the digits do not.
 */
const INTL_LOCALES: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-AE-u-nu-latn",
};

export function intlLocale(locale: Locale): string {
  return INTL_LOCALES[locale];
}

/** Endonyms - a language is always listed in its own script, never translated. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Narrows anything (a cookie value, an API field, an `Accept-Language` token)
 * to a locale we actually ship. Unknown input is not an error worth surfacing -
 * it means an old cookie or a stale profile, and English is a safe fallback.
 */
export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
