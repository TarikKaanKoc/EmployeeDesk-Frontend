"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      /**
       * Outcome carried by colour, not just by words.
       *
       * A neutral toast for both "posted" and "could not post" makes the
       * reader parse a sentence to find out which happened - fine once,
       * expensive on a screen someone works for hours. The tints are the
       * console's own success and destructive tokens rather than sonner's
       * `richColors`, so they follow the theme in both modes instead of
       * introducing a second red.
       */
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          /* The tint is mixed into a solid surface rather than painted at
             10% opacity: a toast lands over whatever the reader was doing -
             a PDF, a dense table - and a see-through error is an unreadable
             one exactly when it matters. */
          success:
            "group-[.toaster]:![background:color-mix(in_oklab,var(--success)_12%,var(--background))] group-[.toaster]:!border-success/40 group-[.toaster]:!text-success [&_[data-icon]]:text-success [&_[data-description]]:!text-foreground/70",
          error:
            "group-[.toaster]:![background:color-mix(in_oklab,var(--destructive)_12%,var(--background))] group-[.toaster]:!border-destructive/40 group-[.toaster]:!text-destructive [&_[data-icon]]:text-destructive [&_[data-description]]:!text-foreground/70",
          warning:
            "group-[.toaster]:![background:color-mix(in_oklab,var(--warning)_12%,var(--background))] group-[.toaster]:!border-warning/40 group-[.toaster]:!text-warning [&_[data-icon]]:text-warning [&_[data-description]]:!text-foreground/70",
          info:
            "group-[.toaster]:![background:color-mix(in_oklab,var(--primary)_10%,var(--background))] group-[.toaster]:!border-primary/40 group-[.toaster]:!text-primary [&_[data-icon]]:text-primary [&_[data-description]]:!text-foreground/70",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
