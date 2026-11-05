"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormat, useScope } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * The card a list lives in: filters, then the list, then whatever the list
 * needs underneath it.
 *
 * The filters sit *on* the panel rather than floating above it because the
 * control and the result it produces belong to the same object. Every list
 * screen in the console is built from this, so a reader who learns where the
 * search box is on one page has learned it for all of them.
 */
export function DataPanel({
  filters,
  footer,
  children,
  className,
}: {
  filters?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card overflow-hidden rounded-xl border", className)}>
      {filters ? (
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          {filters}
        </div>
      ) : null}

      {children}

      {footer ? (
        <div className="bg-muted/30 flex flex-wrap items-center gap-3 border-t px-4 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The search box, with its own clear button.
 *
 * Inline rather than a separate "clear filters" control: emptying the box is
 * the commonest correction a reader makes, and it should not cost a trip to
 * the other end of the row.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  className,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name. The placeholder is not one. */
  label: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const common = useScope("common");

  return (
    <div className={cn("relative min-w-0 flex-1 sm:max-w-xs", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-9 pe-8 ps-9"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={common.actions.clearSearch}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 end-2 -translate-y-1/2 rounded-sm p-1"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  /** Shown after the label - a count, usually. */
  badge?: React.ReactNode;
}

/**
 * The two-to-four-way filter a screen leads with.
 *
 * A segmented row rather than another dropdown: these are the cuts a reader
 * takes constantly, and the count of open choices is small enough that hiding
 * them behind a click costs more than the space it saves. Anything longer
 * belongs in a `Select`.
 */
export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((option) => (
        <Button
          key={option.key}
          type="button"
          size="sm"
          variant={value === option.key ? "secondary" : "ghost"}
          onClick={() => onChange(option.key)}
          aria-pressed={value === option.key}
          className="h-8"
        >
          {option.label}
          {option.badge !== undefined ? (
            <span className="text-muted-foreground ms-1 tabular-nums">
              {option.badge}
            </span>
          ) : null}
        </Button>
      ))}
    </div>
  );
}

/**
 * Right-aligned end of the filter row. Selects and secondary controls go here,
 * so the search box is always leftmost and the dropdowns always trail.
 */
export function FilterTrail({ children }: { children: React.ReactNode }) {
  return (
    /* On a phone the controls run along one line that scrolls, under the
       search box: four chips wrapped three-deep read as a form, not a
       toolbar. From sm up they wrap beside the search as before. */
    <div className="no-scrollbar -mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0 sm:ms-auto [&>*]:shrink-0">
      {children}
    </div>
  );
}

/**
 * The line under a list saying how much of it is showing. Every list has one,
 * in the same place, in tabular figures.
 */
export function ResultCount({
  showing,
  total,
  noun,
  extra,
}: {
  showing: number;
  total: number;
  noun: string;
  /** A value total, usually. */
  extra?: React.ReactNode;
}) {
  const common = useScope("common");
  const { fmt, number } = useFormat();

  // "12 of 40 requests" is not a sentence that survives word-for-word: Arabic
  // says "١٢ من أصل ٤٠". The whole line is one template per case so the
  // translator controls the order, not the concatenation here.
  const line =
    showing === total
      ? fmt(common.results.count, { total: number(total), noun })
      : fmt(common.results.partial, {
          showing: number(showing),
          total: number(total),
          noun,
        });

  return (
    <p className="text-muted-foreground text-sm tabular-nums">
      {line}
      {extra ? <> · {extra}</> : null}
    </p>
  );
}
