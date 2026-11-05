import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The one way a surface is closed.
 *
 * Every sheet, dialog, panel and drawer in the console closes through this:
 * a quiet round ghost button, visible on hover rather than outlined at rest,
 * in the top end corner, so a reader who learns one recognises the next.
 *
 * `asChild` lets a Radix `Close` primitive wear these clothes without a
 * second button inside it.
 */
export const closeButtonClass =
  "text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-full opacity-70 transition-[color,background-color,opacity] hover:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden disabled:pointer-events-none";

/**
 * The same control on an ink header.
 *
 * Only the colours change: the light `accent` wash reads as a filled white
 * disc over a dark bar, which is a different control as far as a reader is
 * concerned. The shape, the size, the corner and the quiet-until-hovered
 * grammar all stay.
 */
export const closeButtonOnDarkClass =
  "text-white/70 hover:text-white hover:bg-white/15 focus-visible:ring-white/40";

/** Pinned to the surface's top end corner, the way a sheet's close sits. */
export const closeButtonCornerClass = "absolute top-4 end-4 z-10";

export const CloseButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Read by screen readers; defaults to "Close". */
    label?: string;
    /** Pin to the top end corner of the nearest positioned ancestor. */
    corner?: boolean;
    /** On an ink surface: white, with a wash instead of the light accent. */
    onDark?: boolean;
  }
>(
  (
    { className, label = "Close", corner = false, onDark = false, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        closeButtonClass,
        corner && closeButtonCornerClass,
        onDark && closeButtonOnDarkClass,
        className,
      )}
      {...props}
    >
      <X className="size-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  ),
);
CloseButton.displayName = "CloseButton";
