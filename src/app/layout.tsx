import "./globals.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  Geist,
  Geist_Mono,
  Noto_Kufi_Arabic,
} from "next/font/google";

import { IntroLoader } from "@/components/intro/intro-loader";
import { Toaster } from "@/components/ui/sonner";
import { direction } from "@/i18n/config";
import { getLocale, getScope } from "@/i18n/server";
import { cn } from "@/lib/utils";

import { Providers } from "./providers";

/* Geist replaced Inter on 2026-08-18. The colour palette from that same pass
   was reverted; the type was kept. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

/**
 * Geist has no Arabic coverage, so an Arabic console rendered in it falls back
 * to whatever the OS happens to supply - which is Times on one machine and
 * Tahoma on the next, at wildly different optical sizes beside the Latin
 * figures in the same table cell. Noto Kufi Arabic is a UI face with a large
 * x-height and unambiguous digits, which is what a screen full of figures
 * needs. It is loaded for every locale but only *used* by Arabic
 * glyphs: the font stack in `globals.css` puts Geist first, so Latin text is
 * untouched.
 */
const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getScope("meta");

  return {
    title: {
      default: t.title,
      template: `%s · ${t.title}`,
    },
    description: t.description,
    // A console, not a site: every page here is behind a session or is a
    // sign-in screen, and none of it belongs in a search result.
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The Proxy has already resolved this and written it onto the request, so
  // the first paint is in the right language and direction - no flash of an
  // LTR layout that reverses once the client hydrates.
  const locale = await getLocale();
  const dir = direction(locale);
  // Minted by the Proxy for this one response; see `src/proxy.ts`. Next
  // stamps it on its own scripts, this hands it to the ones we add.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(
        "h-full font-sans antialiased",
        geist.variable,
        geistMono.variable,
        notoKufi.variable,
      )}
    >
      <body className="group/body flex min-h-full flex-col">
        <Providers locale={locale} nonce={nonce}>
          {children}
          {/* Mounted here, above the route groups, so the post-sign-in intro
              survives the /login → /dashboard navigation instead of being
              torn down with the sign-in page. */}
          <IntroLoader />
        </Providers>
        {/* Sonner anchors to a physical corner, so it has to be told which one
            the reader considers "the end of the row". */}
        <Toaster
          position={dir === "rtl" ? "bottom-left" : "bottom-right"}
          dir={dir}
        />
      </body>
    </html>
  );
}
