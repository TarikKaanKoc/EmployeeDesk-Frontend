import { type Locale, intlLocale } from "@/i18n/config";
import { APP_TIME_ZONE } from "@/lib/time";

/**
 * Placeholder interpolation: `fmt("Showing {n} of {total}", { n: 12, total: 40 })`.
 *
 * Braces rather than positional `%s` because a translator reorders words freely
 * and Arabic reorders a great deal - a named slot survives that, an ordered one
 * does not. An unknown placeholder is left in place rather than blanked, so a
 * mismatch shows up as `{total}` on screen instead of a hole nobody notices.
 */
export function fmt(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Picks the plural form for `count` using the locale's real CLDR rules.
 *
 * English needs two forms; Arabic needs six, and `zero`/`two`/`few` are not
 * decoration - "٣ فواتير" and "١١ فاتورة" take different shapes. Callers supply
 * whatever forms their locale uses; `other` is required and is what any missing
 * form falls back to, which is why an English dictionary can keep writing just
 * `{ one, other }` without knowing Arabic exists.
 */
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export function plural(
  locale: Locale,
  count: number,
  forms: PluralForms,
): string {
  const rule = new Intl.PluralRules(intlLocale(locale)).select(count);
  const template = forms[rule] ?? forms.other;
  return fmt(template, { count });
}

/**
 * Locale-aware `Intl` factories, memoised.
 *
 * `Intl.NumberFormat` construction is measurably expensive and these run inside
 * table cells and chart ticks - a 400-row table would otherwise build
 * the same formatter 400 times per render.
 */
const numberCache = new Map<string, Intl.NumberFormat>();

function numberFormat(
  locale: Locale,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = numberCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale(locale), options);
    numberCache.set(key, formatter);
  }
  return formatter;
}

const dateCache = new Map<string, Intl.DateTimeFormat>();

function dateFormat(
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocale(locale), options);
    dateCache.set(key, formatter);
  }
  return formatter;
}

export function formatNumber(
  locale: Locale,
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return numberFormat(locale, options).format(value);
}

export function formatDate(
  locale: Locale,
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  /* A moment is read on the console's clock unless the caller pins one.
     Left to the runtime, the server wrote a sync stamp in UTC and the
     browser rewrote it in the reader's zone, and React reported the two
     renders as a hydration mismatch on every page that showed a time. */
  return dateFormat(
    locale,
    options.timeZone ? options : { ...options, timeZone: APP_TIME_ZONE },
  ).format(date);
}

/**
 * Wraps a run of Latin text (a request number, an IBAN, a supplier's legal
 * name) so it survives inside an RTL paragraph.
 *
 * Without an isolate, the bidi algorithm lets neighbouring Arabic drag the
 * trailing punctuation of `LR-2026-0117` to the wrong end, and the reader sees
 * a request number that does not match the one on the document. U+2068 opens a
 * first-strong isolate, U+2069 closes it.
 */
export function isolate(value: string): string {
  return `⁨${value}⁩`;
}
