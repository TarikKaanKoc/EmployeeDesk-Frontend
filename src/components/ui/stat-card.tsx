"use client";

import { Check, Info, ListFilter } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * One tile over a list: a label, a figure, and a second figure facing it.
 *
 * ## Why there are two figures
 *
 * A tile with one number in its top-left corner is three quarters empty,
 * and the emptiness is what made the last version look unfinished. The
 * answer is not more padding or a bigger number; it is a second reading in
 * the opposite corner, set small, that says something the first one does
 * not. Thirty-three bills blocked is a fact. Five without blockers is the
 * other half of the same fact, and together they fill the tile honestly.
 *
 * The rule that keeps it honest: the second figure never restates the
 * first. "1 / 1 over-billed" is one fact printed twice.
 *
 * ## The figure is not tabular here
 *
 * Tabular numerals exist so digits line up down a column. Nothing lines up
 * in a tile, and at thirty pixels the fixed advance gives the 1 a slab foot
 * and spaces the digits like a table. Tables keep tabular; display figures
 * use the proportional default.
 *
 * ## Colour says one thing
 *
 * An 8px dot beside the label, in the hue the table's own badge uses, with
 * a soft halo. It appears only on a tile that maps to a status, and it goes
 * grey when the count is zero. The figure itself is always ink, because a
 * total is not an event.
 *
 * ## A tile that filters looks like a control
 *
 * It is a real button, it carries `aria-pressed`, a filter glyph appears on
 * hover, and a tick replaces it when it is on. A tile that only reports has
 * no hover and no cursor, so nobody learns to press things that never
 * answer.
 */

/** The dot's colour, matching the badges the tables already draw. */
export type StatDot =
  "none" | "open" | "progress" | "done" | "warning" | "danger";

/* Dot plus halo. The halo is the same hue at low alpha rather than a
   lighter tint, so it holds on both grounds without a second token. */
const DOT: Record<Exclude<StatDot, "none">, string> = {
  open: "bg-primary ring-primary/15",
  progress: "bg-amber-500 ring-amber-500/15",
  done: "bg-emerald-500 ring-emerald-500/15",
  warning: "bg-warning ring-warning/18",
  danger: "bg-destructive ring-destructive/15",
};

export interface StatFigure {
  /** The upper line, 14px semibold. An amount, a reason, a share. */
  primary: React.ReactNode;
  /** The lower line, muted. Says what the upper line counts. */
  caption: string;
}

export interface StatTileProps {
  label: string;
  /** Stands in for the dot on a tile whose metric is not a status. */
  icon?: LucideIcon;
  dot?: StatDot;
  /** The headline. Already formatted, already localised. */
  value: string;
  /**
   * Set as prose rather than as a figure.
   *
   * A field name is not a number, and at the figure's size and tracking it
   * reads as one. Twenty-two pixels on the same baseline keeps it the
   * headline without pretending it can be counted.
   */
  valueIsText?: boolean;
  /** The currency code, said quietly before the amount. */
  currency?: string;
  /** What the figure counts, on its own baseline: "of 38 bills", "orders". */
  unit?: string;
  /** The pair facing the figure. Never a restatement of it. */
  figure?: StatFigure;
  /** Nothing to count: grey dot, muted figure, and never a filter. */
  zero?: boolean;
  loading?: boolean;
  /** The metric's definition, behind an icon beside the label. */
  info?: string;
  /** Makes the tile a filter; the caller decides what it narrows to. */
  onClick?: () => void;
  /** Drawn as held down - the filter this tile owns is on. */
  active?: boolean;
  className?: string;
}

/**
 * The row the tiles sit in.
 *
 * Separate tiles with a 12px gap, not one divided strip: a strip put four
 * readings inside a single box and made the whole summary one object, which
 * is wrong when three of the four are independently pressable.
 *
 * Three tiles hold one row at every width: on a phone they narrow to a
 * strip of figures rather than stacking into three tall cards that push
 * the list a screen down. Four step 4 to 2, never to 1, for the same
 * reason.
 */
export function StatTileRow({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode;
  columns?: 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 sm:gap-3",
        columns === 3 ? "grid-cols-3" : "grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * An amount inside the second figure.
 *
 * The code is said once, quietly, before the digits - the same way the
 * tables write it. Both places in a tile that carry money use this, so one
 * cell never has a muted code in its figure and a full-ink one underneath.
 */
export function StatAmount({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-muted-foreground text-[12px] font-medium">
        {currency}
      </span>
      <span>{children}</span>
    </span>
  );
}

export function StatTile({
  label,
  icon: Icon,
  dot = "none",
  value,
  valueIsText = false,
  currency,
  unit,
  figure,
  zero = false,
  loading = false,
  info,
  onClick,
  active = false,
  className,
}: StatTileProps) {
  /* A tile with nothing in it is not a filter: pressing it would empty the
     list under it and leave the reader to work out why. */
  const clickable = Boolean(onClick) && !loading && !zero;

  const spoken = [
    label,
    [currency, value, unit].filter(Boolean).join(" "),
    figure?.caption,
  ]
    .filter(Boolean)
    .join(", ");

  const body = (
    <>
      {/* ------------------------------------------------------- label */}
      <span className="flex min-h-5 items-start gap-1.5 text-xs leading-4 font-medium sm:h-5 sm:items-center sm:gap-2 sm:text-[13px] sm:leading-5">
        {/* A glyph only where the metric is not a status and so has no dot
            to wear: a reading like confidence has no badge in the table to
            borrow a colour from, and the icon is what names it instead. */}
        {Icon && dot === "none" ? (
          <Icon
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
        ) : null}
        {dot === "none" ? null : (
          <span
            className={cn(
              "mt-1 size-2 shrink-0 rounded-full ring-3 sm:mt-0",
              zero
                ? "bg-muted-foreground/35 ring-muted-foreground/12"
                : DOT[dot],
            )}
            aria-hidden="true"
          />
        )}
        <span
          /* Two lines on a phone, where a tile is a third of the screen and
             "Active, last 12 months" would otherwise lose its half. */
          className={cn(
            "line-clamp-2 sm:line-clamp-none sm:truncate",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </span>

        {info ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={label}
                  onClick={(event) => event.stopPropagation()}
                  className="text-muted-foreground/60 hover:text-muted-foreground focus-visible:ring-ring shrink-0 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Info className="size-3.5" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[16rem]">{info}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}

        {/* The glyph that says this tile answers. Hidden until the pointer
            is on it, so a resting row of tiles stays quiet. */}
        {clickable && active ? (
          <Check
            className="text-primary ms-auto size-4 shrink-0 stroke-[2.4]"
            aria-hidden="true"
          />
        ) : clickable ? (
          <ListFilter
            className="text-muted-foreground ms-auto size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        ) : null}
      </span>

      {/* ------------------------------------- figure, and the one facing it */}
      {loading ? (
        <span className="flex h-10 items-end justify-between gap-4">
          <span
            className="bg-muted mb-1 block h-[26px] w-[76px] rounded-[7px]"
            aria-hidden="true"
          />
          <span
            className="hidden flex-col items-end gap-[7px] pb-[5px] sm:flex"
            aria-hidden="true"
          >
            <span className="bg-muted block h-[11px] w-[92px] rounded-full" />
            <span className="bg-muted/60 block h-[9px] w-[62px] rounded-full" />
          </span>
        </span>
      ) : (
        <span
          /* One row, always. Wrapping let a long caption push itself onto a
             second line, which stretched that tile and left every tile beside
             it with a band of empty space. The figure keeps its width and the
             caption gives way instead. */
          className="flex items-end justify-between gap-4"
        >
          <span className="flex min-w-0 shrink-0 flex-col items-start sm:flex-row sm:items-baseline sm:gap-1.5">
            {/* The code sits above the amount on a phone: beside it, a six
                figure sum ran out of the tile. */}
            {currency ? (
              <span className="text-muted-foreground text-[11px] leading-4 font-medium tracking-[0.01em] sm:text-[13px] sm:leading-5">
                {currency}
              </span>
            ) : null}
            <span
              className={cn(
                "font-semibold",
                valueIsText
                  ? "relative top-0.5 text-base leading-8 tracking-[-0.02em] sm:text-[22px] sm:leading-9"
                  : "text-xl leading-8 tracking-[-0.03em] sm:text-[30px] sm:leading-9",
                zero && "text-muted-foreground",
              )}
            >
              {value}
            </span>
            {unit ? (
              <span className="text-muted-foreground hidden text-sm leading-5 font-medium sm:inline">
                {unit}
              </span>
            ) : null}
          </span>

          {/* Both lines are held to one line each. A caption that wrapped
              stretched its own tile and left every tile beside it with a
              band of empty space at the bottom, which is the exact fault
              this redesign set out to remove. Callers shorten the words;
              this is the backstop. */}
          {figure ? (
            <span className="ms-auto hidden min-w-0 flex-col items-end pb-1 text-end sm:flex">
              <span
                className={cn(
                  "max-w-full truncate text-sm leading-5",
                  zero ? "text-muted-foreground font-medium" : "font-semibold",
                )}
              >
                {figure.primary}
              </span>
              <span className="text-muted-foreground max-w-full truncate text-[12.5px] leading-4">
                {figure.caption}
              </span>
            </span>
          ) : null}
        </span>
      )}
    </>
  );

  const shell = cn(
    "bg-card flex min-w-0 flex-col gap-2 rounded-xl border p-3 sm:gap-3 sm:p-4 sm:px-[18px]",
    "shadow-[0_1px_2px_rgba(12,12,20,0.04)]",
    className,
  );

  if (!clickable) {
    return (
      <div className={shell} aria-busy={loading || undefined}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={spoken}
      onClick={onClick}
      className={cn(
        shell,
        "group cursor-pointer text-start transition-[border-color,box-shadow,background-color]",
        "focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2",
        active
          ? "border-primary bg-primary/5 shadow-[0_0_0_3px_var(--ring-soft)]"
          : "hover:border-muted-foreground/35 hover:shadow-[0_1px_2px_rgba(12,12,20,0.05),0_8px_20px_-8px_rgba(12,12,20,0.16)]",
      )}
      style={
        {
          "--ring-soft": "color-mix(in oklch, var(--primary) 16%, transparent)",
        } as React.CSSProperties
      }
    >
      {body}
    </button>
  );
}
