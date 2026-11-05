"use client";

import { useMemo } from "react";

import { useLocale } from "@/i18n/provider";
import { type Formatters, formatters } from "@/lib/format";

/**
 * The formatting trio, bound to the locale in React context.
 *
 * Split from `lib/format.ts` because that module is imported by server
 * components too, and a `"use client"` file's exports become client references
 * the server cannot call. The pure functions live there; the hooks live here.
 */
export function useFormatters(): Formatters {
  const locale = useLocale();
  return useMemo(() => formatters(locale), [locale]);
}

export function useMoney() {
  return useFormatters().money;
}

export function useAmount() {
  return useFormatters().amount;
}

export function useMoneyCompact() {
  return useFormatters().moneyCompact;
}

export function useCount() {
  return useFormatters().count;
}
