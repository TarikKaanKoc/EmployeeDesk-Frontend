const CURRENCY = "QAR";
import { type Locale, DEFAULT_LOCALE, intlLocale } from "@/i18n/config";

/**
 * Money arrives from the API in minor units (dirhams) and is never a float -
 * the same rule the backend follows. Division happens once, here, at the point
 * of display.
 */
const major = (minor: number) => minor / 100;

/**
 * Where the currency code sits.
 *
 * English writes `QAR 412,500`; Arabic writes the amount first and the currency
 * after it. This is not a translation of the word - the code stays `QAR`,
 * because that is what the payslip, the bank statement and the ERP all print -
 * only its position moves.
 *
 * The Arabic form is wrapped in a *left-to-right isolate* (U+2066 … U+2069)
 * rather than a first-strong one. Both seal the string off from the text around
 * it, but first-strong resolves the direction from the first character it
 * finds, so what the reader saw depended on whether the amount happened to
 * begin with a digit, a minus sign or the compact suffix - `1.8 مليون QAR`
 * came out in a different order from `412,500 QAR`. An explicit LTR isolate
 * pins it: the string renders in exactly the order written here, whatever
 * surrounds it, and it stays one indivisible object to the paragraph outside.
 *
 * Doing it in the string rather than with `direction: ltr` in CSS is what keeps
 * the *cell* right-to-left, so a money column and its header still agree about
 * which edge they align to.
 */
function withCurrency(locale: Locale, amount: string): string {
  return locale === "ar" ? `⁦${amount} ${CURRENCY}⁩` : `${CURRENCY} ${amount}`;
}

const cache = new Map<string, Intl.NumberFormat>();

function formatter(locale: Locale, options: Intl.NumberFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let found = cache.get(key);
  if (!found) {
    found = new Intl.NumberFormat(intlLocale(locale), options);
    cache.set(key, found);
  }
  return found;
}

/**
 * The formatting trio, bound to one locale.
 *
 * Built as a factory rather than three loose functions so a server component
 * can call `formatters(locale)` with a locale it awaited, and a client
 * component can get the same object from `useFormatters()` - the call sites
 * then read identically on both sides of the boundary.
 */
export function formatters(locale: Locale) {
  return {
    /** `QAR 412,500` - for figures a reader may reconcile against a ledger. */
    money(minor: number): string {
      return withCurrency(
        locale,
        formatter(locale, { maximumFractionDigits: 0 }).format(major(minor)),
      );
    },

    /** `12,280.00` - a figure in a column whose header states the currency
        once. No prefix and always two decimals, so a column of them lines up
        on the decimal point and can be added up by eye. */
    amount(minor: number): string {
      return formatter(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(major(minor));
    },

    /** `QAR 412.5K` - for axis ticks and tiles, where the exact digit is noise. */
    moneyCompact(minor: number): string {
      return withCurrency(
        locale,
        formatter(locale, {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(major(minor)),
      );
    },

    /** `412.5K` - the compact figure without its currency, for a column
        whose header states the currency once. A register that repeats "QAR"
        on every row is spending a column's width on a constant. */
    amountCompact(minor: number): string {
      return formatter(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(major(minor));
    },

    /**
     * `412,500` below a million, `1.26M` at and above it, no currency code.
     *
     * For a summary cell, where the code is said once beside the figure in
     * muted type rather than repeated in full ink. A tile has room for the
     * exact digits of most amounts, so abbreviating from a thousand threw
     * away precision it did not need to; the cut is at a million, which is
     * where the digits stop being readable at a glance. The exact figure
     * stays available on hover through `amount`.
     */
    amountTile(minor: number): string {
      const value = major(minor);
      if (Math.abs(value) >= 1_000_000) {
        return formatter(locale, {
          notation: "compact",
          maximumFractionDigits: 2,
        }).format(value);
      }
      return formatter(locale, { maximumFractionDigits: 0 }).format(value);
    },

    /** `QAR 412,500`, `QAR 1.26M` - `amountTile` with its code, for a
        sentence that has to carry the currency inside it. */
    moneyTile(minor: number): string {
      const value = major(minor);
      const digits =
        Math.abs(value) >= 1_000_000
          ? formatter(locale, {
              notation: "compact",
              maximumFractionDigits: 2,
            }).format(value)
          : formatter(locale, { maximumFractionDigits: 0 }).format(value);
      return withCurrency(locale, digits);
    },

    /** A plain grouped integer: row counts, document counts, days. */
    count(value: number): string {
      return formatter(locale, {}).format(value);
    },

    /** A percentage the caller has already computed as 0–100. */
    percent(value: number, fractionDigits = 0): string {
      return formatter(locale, {
        style: "percent",
        maximumFractionDigits: fractionDigits,
      }).format(value / 100);
    },
  };
}

export type Formatters = ReturnType<typeof formatters>;

/**
 * Locale-free fallbacks, for the few places that format outside a render -
 * a `generateMetadata` string, a sort comparator's tie-break label. Anything a
 * reader sees inside the page should use the hooks or `formatters(locale)`.
 */
const fallback = formatters(DEFAULT_LOCALE);

export const money = fallback.money;
export const moneyCompact = fallback.moneyCompact;
export const count = fallback.count;
