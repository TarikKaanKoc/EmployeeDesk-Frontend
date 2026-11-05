"use client";

import { Direction } from "radix-ui";

import { ThemeProvider } from "@/components/theme-provider";
import { type Locale, direction } from "@/i18n/config";
import { I18nProvider } from "@/i18n/provider";
import { NonceProvider } from "@/lib/nonce";

interface Props {
  locale: Locale;
  /** This response's CSP nonce, for the scripts that are not Next's own. */
  nonce?: string;
  children: React.ReactNode;
}

export function Providers({ locale, nonce, children }: Props) {
  return (
    // Locale outside theme: a client component may need the language to decide
    // what it renders, but nothing needs the theme to decide what it says.
    <I18nProvider locale={locale}>
      {/* `dir` on <html> only mirrors what CSS can see. Radix decides where a
          menu opens, which way a submenu flies out, and what Left/Right do on
          the keyboard in JS - and defaults to LTR unless it is told otherwise,
          so in Arabic every `align="start"` would anchor to the left edge. */}
      <Direction.DirectionProvider dir={direction(locale)}>
        {/* next-themes sets the theme class with an inline script before
            first paint; without the nonce the policy would refuse it and
            every dark-mode reader would see a flash of light. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <NonceProvider nonce={nonce}>{children}</NonceProvider>
        </ThemeProvider>
      </Direction.DirectionProvider>
    </I18nProvider>
  );
}
