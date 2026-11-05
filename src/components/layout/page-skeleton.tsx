import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The shape of a console screen while its data is on the way: a heading, a
 * line of description, a toolbar and a table's worth of rows. Generic on
 * purpose - every screen here is a header over a list - so one skeleton
 * serves them all and nothing flashes from one layout to another.
 */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="ms-auto h-9 w-32" />
      </div>
      <div className="overflow-hidden rounded-xl border">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-t px-4 py-3 first:border-t-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A form-sized placeholder for the narrower settings and auth screens. */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * The stat cards a ledger page opens with.
 *
 * The breakpoints are a parameter because they differ per screen - three
 * across on the supplier master, two-then-four on the order book - and a
 * placeholder that wraps differently from the cards it stands in for moves
 * everything below it when they land.
 */
export function StatCardsSkeleton({
  count = 3,
  className = "sm:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

/** A ledger table on its way: toolbar, then rows led by a page thumbnail. */
export function LedgerSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="ms-auto h-9 w-32" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-t px-4 py-2 first:border-t-0"
        >
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-11 w-8 rounded" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="ms-auto h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/** The masthead every console page opens with. */
export function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-full max-w-xl" />
    </div>
  );
}

/**
 * A panel on its way: the card the dashboards and the record screens are
 * built from, with a heading and a few rows of content inside it.
 *
 * `className` carries the grid span, because a panel that lands in a
 * different column from the one its placeholder occupied is a jump the
 * reader reads as the page changing its mind.
 */
export function PanelSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 rounded-xl border p-5", className)}>
      <Skeleton className="h-4 w-40" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The masthead of a record screen - a supplier, an order - where the name is
 * the API's to supply and so cannot be printed early like a page title.
 */
export function RecordHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

/**
 * A plain table on its way, drawn to a column count.
 *
 * The count is a parameter rather than a fixed six because the whole point of
 * a placeholder is that the row it stands in for lands in the same place: a
 * six-column ghost under an eight-column header reflows the moment the data
 * arrives, which is the jump this was meant to remove.
 */
export function TableSkeleton({
  rows = 8,
  columns = 6,
  toolbar = true,
}: {
  rows?: number;
  columns?: number;
  /** The search box and filters most tables carry above their header. */
  toolbar?: boolean;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border"
      aria-busy="true"
      aria-live="polite"
    >
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="ms-auto h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      ) : null}
      <div className="bg-muted/40 flex items-center gap-4 px-3 py-2.5">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton
            key={index}
            className={cn("h-3", index === 0 ? "w-28" : "flex-1")}
          />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-4 border-t px-3 py-3">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton
              key={index}
              className={cn("h-4", index === 0 ? "w-28" : "flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
