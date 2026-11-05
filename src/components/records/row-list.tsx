import { cn } from "@/lib/utils";

/**
 * Key/value rows inside a detail sheet. A `dl`, so a screen reader pairs
 * each label with its value; values that are Latin inside Arabic prose get
 * `dir="ltr"` from the caller.
 */
export function RowList({ rows, className }: { rows: { label: string; value: React.ReactNode; ltr?: boolean }[]; className?: string }) {
  return (
    <dl className={cn("divide-border/70 divide-y text-sm", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground shrink-0">{row.label}</dt>
          <dd className={cn("min-w-0 text-end font-medium", row.ltr && "tabular-nums")} dir={row.ltr ? "ltr" : undefined}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
