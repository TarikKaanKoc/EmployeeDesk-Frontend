"use client";

import { createContext, useContext, useMemo } from "react";

import {
  type Locale,
  DEFAULT_LOCALE,
  direction,
  intlLocale,
  isRtl,
} from "@/i18n/config";
import { type Namespace, type Scope, getDictionary } from "@/i18n/dictionaries";
import {
  type PluralForms,
  fmt,
  formatDate,
  formatNumber,
  plural,
} from "@/i18n/format";

/**
 * Only the locale code crosses the server/client boundary - not the dictionary.
 *
 * The strings are a compile-time constant already sitting in the bundle, so
 * shipping them again through the RSC payload on every navigation would pay for
 * the same text twice. The provider looks them up locally instead.
 */
interface I18nValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  rtl: boolean;
}

const I18nContext = createContext<I18nValue | null>(null);

interface Props {
  locale: Locale;
  children: React.ReactNode;
}

export function I18nProvider({ locale, children }: Props) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir: direction(locale),
      rtl: isRtl(locale),
    }),
    [locale],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}

function useI18nContext(): I18nValue {
  const context = useContext(I18nContext);
  // A client component rendered outside the provider would otherwise fall back
  // to English silently and look correct in every English test run - exactly
  // the bug that reaches an Arabic reader instead of a developer.
  if (!context) {
    throw new Error("useLocale must be used inside <I18nProvider>");
  }
  return context;
}

export function useLocale(): Locale {
  return useI18nContext().locale;
}

/**
 * `true` when the interface is mirrored. For the handful of cases CSS logical
 * properties cannot reach: a chart's axis orientation, a carousel's scroll
 * delta, an icon that means "next" rather than "right".
 */
export function useRtl(): boolean {
  return useI18nContext().rtl;
}

export function useDirection(): "ltr" | "rtl" {
  return useI18nContext().dir;
}

/**
 * One feature's strings, in a client component:
 *
 * ```tsx
 * const t = useScope("records");
 * return <h1>{t.title}</h1>;
 * ```
 *
 * Mirrors `getScope` on the server deliberately: the two call sites read the
 * same, so moving a component across the boundary is an import change and
 * nothing else.
 */
export function useScope<N extends Namespace>(namespace: N): Scope<N> {
  const { locale } = useI18nContext();
  return getDictionary(locale)[namespace];
}

/**
 * Locale-bound formatting helpers, so a component never has to thread the
 * locale into `fmt`/`plural`/`Intl` by hand.
 */
export function useFormat() {
  const { locale } = useI18nContext();

  return useMemo(
    () => ({
      locale,
      intlLocale: intlLocale(locale),
      fmt,
      plural: (count: number, forms: PluralForms) =>
        plural(locale, count, forms),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(locale, value, options),
      date: (
        value: Date | string | number,
        options?: Intl.DateTimeFormatOptions,
      ) => formatDate(locale, value, options),
    }),
    [locale],
  );
}

/** Escape hatch for the rare component that is not under a provider yet. */
export const FALLBACK_LOCALE = DEFAULT_LOCALE;
