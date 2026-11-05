"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { useScope } from "@/i18n/provider";

/** Light <-> dark. Renders nothing until mounted so the icon never disagrees with the theme that hydrated. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nav = useScope("nav");
  // True only after hydration, without an effect: the icon must not disagree
  // with the theme the inline script applied before React ran.
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  if (!mounted) return <span className="size-8" aria-hidden="true" />;
  const dark = resolvedTheme === "dark";
  const label = dark ? nav.theme.light : nav.theme.dark;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 rounded-full"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
