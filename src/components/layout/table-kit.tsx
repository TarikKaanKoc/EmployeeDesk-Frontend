"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { useFormat, useScope } from "@/i18n/provider";
import { useCount } from "@/lib/format-client";
import { EmptyScene } from "@/components/layout/empty-scene";
import { cn } from "@/lib/utils";
import type { SortState } from "@/hooks/use-table-query";

/* ------------------------------------------------------------------ */
/* Filter chips                                                        */
/* ------------------------------------------------------------------ */

export interface FilterChip {
  key: string;
  label: string;
  clear: () => void;
}

/**
 * What is currently hidden, said out loud.
 *
 * Without this a reader who left a filter on decides a record has been
 * lost. Each chip clears its own filter; the button at the end clears all of
 * them. Renders nothing when nothing is filtered, so the row never sits empty
 * above a list.
 */
export function FilterChips({
  chips,
  onClearAll,
  clearAllLabel,
}: {
  chips: (FilterChip | null)[];
  onClearAll: () => void;
  clearAllLabel: string;
}) {
  const active = chips.filter((chip) => chip !== null);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
      {active.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="bg-muted hover:bg-muted/70 text-muted-foreground inline-flex items-center gap-1.5 rounded-full py-1 pe-2 ps-2.5 text-xs transition-colors"
        >
          {chip.label}
          <X className="size-3" aria-hidden="true" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        {clearAllLabel}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

/**
 * The line under a paged list and the two buttons that move it.
 *
 * Laid out as siblings of a flex row - the panel footer - rather than in a
 * wrapper of its own, so a table can put something else on the same line
 * (the audit log prints its time zone there).
 *
 * @param summary Replaces the default "1–25 of 300" line. The buttons are
 * shown only when there is a second page; the summary always, unless the
 * whole list fits and `always` is off, in which case nothing renders.
 */
export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPage,
  summary,
  always = false,
  trailing,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  summary?: React.ReactNode;
  always?: boolean;
  /** Something for the far end of the line, after the buttons. */
  trailing?: React.ReactNode;
}) {
  const common = useScope("common");
  const { fmt, number } = useFormat();
  const count = useCount();

  if (!always && total <= pageSize) return null;

  return (
    <>
      <p className="text-muted-foreground text-sm tabular-nums">
        {summary ??
          fmt(common.pagination.range, {
            from: number(page * pageSize + 1),
            to: number(Math.min((page + 1) * pageSize, total)),
            total: count(total),
          })}
      </p>

      {pageCount > 1 ? (
        <nav
          aria-label={fmt(common.pagination.page, {
            page: number(page + 1),
            pages: number(pageCount),
          })}
          className={cn("flex items-center gap-1", !trailing && "ms-auto")}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={page === 0}
            onClick={() => onPage(page - 1)}
            aria-label={common.actions.previous}
          >
            <ChevronLeft data-flip />
            <span className="hidden sm:inline">{common.actions.previous}</span>
          </Button>

          {/* Every page is one click away: the numbers a reader can reach,
              with the gaps folded into an ellipsis. The current page is the
              only filled button, so the position reads at a glance. */}
          {pageNumbers(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <span
                key={`gap-${index}`}
                className="text-muted-foreground w-8 text-center text-sm select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 min-w-8 px-2 tabular-nums",
                  item === page && "pointer-events-none",
                )}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPage(item)}
              >
                {number(item + 1)}
              </Button>
            ),
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={page >= pageCount - 1}
            onClick={() => onPage(page + 1)}
            aria-label={common.actions.next}
          >
            <span className="hidden sm:inline">{common.actions.next}</span>
            <ChevronRight data-flip />
          </Button>
        </nav>
      ) : null}

      {trailing ? <div className="ms-auto">{trailing}</div> : null}
    </>
  );
}

/**
 * Which page numbers to print: all of them up to seven, otherwise the first,
 * the last, and a window around the current one - `1 … 4 5 6 … 12`.
 */
function pageNumbers(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
  const pages = new Set<number>([0, pageCount - 1]);
  for (let i = page - 1; i <= page + 1; i += 1) {
    if (i > 0 && i < pageCount - 1) pages.add(i);
  }
  // Keep the window three wide at the edges so the row never changes length.
  if (page <= 2) [1, 2, 3].forEach((i) => pages.add(i));
  if (page >= pageCount - 3)
    [pageCount - 4, pageCount - 3, pageCount - 2].forEach((i) => pages.add(i));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Sortable column header                                              */
/* ------------------------------------------------------------------ */

/**
 * A column header that sorts. `aria-sort` belongs on the cell, not the button.
 *
 * Built on the `TableHead` primitive so every sortable column in the console
 * has the same height and weight; pass the cell's own classes in on top.
 *
 * `hint` draws the two-way arrow on inactive columns, for tables where the
 * header is the only sort control and a reader has to see it is one.
 */
export function SortableTh<Column extends string>({
  column,
  sort,
  onSort,
  children,
  className,
  hint = false,
}: {
  column: Column;
  sort: SortState<Column>;
  onSort: (column: Column) => void;
  children: React.ReactNode;
  className?: string;
  hint?: boolean;
}) {
  const active = sort.column === column;
  const Icon = sort.descending ? ArrowDown : ArrowUp;

  return (
    <TableHead
      className={className}
      aria-sort={
        active ? (sort.descending ? "descending" : "ascending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1 transition-colors",
          active && "text-foreground font-medium",
        )}
      >
        {children}
        {active ? (
          <Icon className="size-3.5" aria-hidden="true" />
        ) : hint ? (
          <ArrowUpDown className="size-3 opacity-30" aria-hidden="true" />
        ) : null}
      </button>
    </TableHead>
  );
}

/* ------------------------------------------------------------------ */
/* Empty states                                                        */
/* ------------------------------------------------------------------ */

/**
 * The row a table shows when a filter left it empty.
 *
 * Not the same as a list with nothing in it: telling a new customer to
 * "clear filters" is nonsense. Use this only when something is filtered out;
 * `EmptyState` covers the other case.
 */
export function NoMatchRow({
  colSpan,
  title,
  body,
  onClear,
  clearLabel,
}: {
  colSpan: number;
  title: string;
  body?: string;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-14 text-center">
        <p className="text-sm font-medium">{title}</p>
        {body ? (
          <p className="text-muted-foreground mt-1 text-xs">{body}</p>
        ) : null}
        {onClear && clearLabel ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onClear}
          >
            {clearLabel}
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

/**
 * An empty panel: a small line-art scene in the hand of the error pages, a
 * line, and one thing to do about it. Used both for "nothing here yet" and
 * "nothing matches" - the copy, the scene and the action are what tell those
 * apart, and they come from the caller. `scene="icon"` keeps the plain glyph
 * for the rare state where neither drawing fits.
 */
/**
 * A figure in a column, with its currency said quietly beside it.
 *
 * "QAR 160K" in full ink on every row makes three letters as loud as the
 * number they qualify; the currency in muted small caps beside the figure
 * keeps the column readable as a column of amounts and still says what the
 * amounts are in.
 */
export function Money({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5 tabular-nums">
      <span className="text-muted-foreground text-[11px] font-normal">
        {currency}
      </span>
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  scene = "search",
  className,
}: {
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true";
  }>;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  /** `search`: the filter hid everything. `inbox`: nothing has arrived. */
  scene?: "search" | "inbox" | "suppliers" | "orders" | "icon";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-8 py-10 text-center",
        className,
      )}
    >
      {scene === "icon" ? (
        <Icon
          className="text-muted-foreground mb-3 size-6"
          aria-hidden="true"
        />
      ) : (
        <EmptyScene kind={scene} className="mb-1 w-[15rem]" />
      )}
      <p className="text-base font-semibold tracking-tight">{title}</p>
      {body ? (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm text-balance">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
