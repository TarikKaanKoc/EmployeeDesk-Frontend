"use client"; // Error boundaries must be Client Components.

// global-error replaces the root layout, so it must bring its own document and styles.
import "./globals.css";

import { useEffect } from "react";

import { GeneralError } from "@/components/errors/general-error";
import { direction, toLocale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/cookie";
import { getDictionary } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { reportError } from "@/lib/report-error";

/**
 * This boundary replaces the root layout, which means the locale provider,
 * `<html lang>` and `<html dir>` that layout sets are all gone too. So the
 * locale is recovered from the cookie here rather than inherited: a reader
 * whose console just crashed should not also find it has switched to English
 * and flipped back to left-to-right.
 *
 * Read from `document.cookie` because this only ever renders in the browser -
 * there is no request to read on the server, and the cookie is deliberately
 * not HttpOnly for exactly this kind of case.
 */
function currentLocale() {
  if (typeof document === "undefined") return toLocale(undefined);
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  return toLocale(match?.[1]);
}

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = currentLocale();
  const dictionary = getDictionary(locale);
  useEffect(() => {
    console.error(error);
    reportError(error, { boundary: "global" });
  }, [error]);

  return (
    <html lang={locale} dir={direction(locale)} suppressHydrationWarning>
      <body className="flex min-h-svh flex-col antialiased">
        {/* metadata exports aren't supported in Client Components. */}
        <title>{`${dictionary.errors.general.title} · ${dictionary.meta.title}`}</title>
        <I18nProvider locale={locale}>
          <GeneralError error={error} onRetry={() => unstable_retry()} />
        </I18nProvider>
      </body>
    </html>
  );
}
