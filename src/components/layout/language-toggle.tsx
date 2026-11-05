"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { LOCALE_LABELS, type Locale } from "@/i18n/config";
import { writeLocaleCookie } from "@/i18n/cookie";
import { useFormat, useLocale, useScope } from "@/i18n/provider";

/**
 * English <-> Arabic. Writes the locale cookie the Proxy reads and refreshes,
 * so the next render is already in the right language and direction.
 */
export function LanguageToggle() {
  const locale = useLocale();
  const nav = useScope("nav");
  const { fmt } = useFormat();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "ar" ? "en" : "ar";
  const label = fmt(nav.language.switchTo, { language: LOCALE_LABELS[next] });

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold"
      onClick={() => {
        writeLocaleCookie(next);
        startTransition(() => router.refresh());
      }}
      disabled={pending}
      aria-label={label}
      title={label}
    >
      <Languages className="size-4" aria-hidden="true" />
      <span dir={next === "ar" ? "rtl" : "ltr"}>{LOCALE_LABELS[next]}</span>
    </Button>
  );
}
