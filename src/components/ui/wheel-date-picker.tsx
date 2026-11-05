"use client";

import { useEffect, useMemo, useRef } from "react";

import { useFormat } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const ROW = 36;
const VISIBLE = 5;
const PAD = (ROW * (VISIBLE - 1)) / 2;

/**
 * A date as three wheels - day, month, year - the way a phone asks for one.
 *
 * Each column is a plain scroll container with `scroll-snap` rows; the value
 * is whatever sits in the centre band. That keeps it native-feeling on touch
 * (momentum, snap) and works with a mouse wheel and keyboard scrolling for
 * free, with no drag maths of its own. Month names come from the locale, so
 * the Arabic console spins Arabic months.
 */
export function WheelDatePicker({
  value,
  onChange,
  min,
  years: window,
  className,
}: {
  /** `YYYY-MM-DD`. An empty value shows (but does not select) a week away. */
  value: string;
  onChange: (next: string) => void;
  /** Earliest selectable day, `YYYY-MM-DD`. */
  min?: string;
  /** Which years the wheel offers, as offsets from this one. A delegation
      runs forward, so the default is this year and the two after it; a bill
      is dated when it was written, which is behind us. */
  years?: { back: number; forward: number };
  className?: string;
}) {
  const { intlLocale } = useFormat();
  const now = new Date();
  const fallback = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  const selected = value ? parse(value) : fallback;

  const selectedYear = selected.getFullYear();
  const years = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const back = window?.back ?? 0;
    const forward = window?.forward ?? 2;
    const list = Array.from(
      { length: back + forward + 1 },
      (_, index) => thisYear - back + index,
    );
    /* A date already on the bill keeps its year on the wheel even when it
       falls outside the window: the value is a fact, and a picker that
       cannot show it will quietly change it. */
    if (!list.includes(selectedYear)) {
      list.push(selectedYear);
      list.sort((a, b) => a - b);
    }
    return list;
  }, [window?.back, window?.forward, selectedYear]);
  const months = useMemo(() => {
    const names = new Intl.DateTimeFormat(intlLocale, { month: "long" });
    return Array.from({ length: 12 }, (_, m) => names.format(new Date(2026, m, 1)));
  }, [intlLocale]);
  const dayCount = new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => String(i + 1)), [dayCount]);

  function commit(year: number, month: number, day: number) {
    const clampedDay = Math.min(day, new Date(year, month + 1, 0).getDate());
    let next = new Date(year, month, clampedDay);
    if (min) {
      const floor = parse(min);
      if (next < floor) next = floor;
    }
    onChange(iso(next));
  }

  return (
    <div
      className={cn(
        "bg-muted/40 relative isolate grid grid-cols-[2fr_3fr_2.5fr] overflow-hidden rounded-xl border",
        className,
      )}
      style={{ height: ROW * VISIBLE }}
    >
      {/* The centre band the wheels snap into, and the fades above and
          below it - drawn once, over all three columns. */}
      <div
        aria-hidden="true"
        className="bg-background/80 ring-border pointer-events-none absolute inset-x-1.5 top-1/2 -z-10 h-9 -translate-y-1/2 rounded-lg shadow-xs ring-1"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,var(--card),transparent_38%,transparent_62%,var(--card))] opacity-90"
      />

      <Wheel
        label="day"
        items={days}
        index={Math.min(selected.getDate() - 1, dayCount - 1)}
        onPick={(i) => commit(selected.getFullYear(), selected.getMonth(), i + 1)}
      />
      <Wheel
        label="month"
        items={months}
        index={selected.getMonth()}
        onPick={(i) => commit(selected.getFullYear(), i, selected.getDate())}
      />
      <Wheel
        label="year"
        items={years.map(String)}
        index={Math.max(0, years.indexOf(selected.getFullYear()))}
        onPick={(i) => commit(years[i], selected.getMonth(), selected.getDate())}
      />
    </div>
  );
}

function Wheel({
  label,
  items,
  index,
  onPick,
}: {
  label: string;
  items: string[];
  index: number;
  onPick: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settling = useRef<number>(0);

  /* Keep the wheel under the chosen row whenever the value changes from
     outside (a preset chip, a month with fewer days). */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = index * ROW;
    if (Math.abs(el.scrollTop - top) < 2) return;
    const smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    el.scrollTo({ top, behavior: smooth as ScrollBehavior });
  }, [index, items.length]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    /* The pick lands when the wheel stops: scroll events fire mid-flick, and
       committing on each one makes the columns fight their own snapping. */
    window.clearTimeout(settling.current);
    settling.current = window.setTimeout(() => {
      const picked = Math.round(el.scrollTop / ROW);
      if (picked !== index && picked >= 0 && picked < items.length) onPick(picked);
    }, 90);
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      onScroll={onScroll}
      className="snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingTop: PAD, paddingBottom: PAD }}
    >
      {items.map((item, i) => (
        <button
          key={`${item}-${i}`}
          type="button"
          role="option"
          aria-selected={i === index}
          onClick={() => onPick(i)}
          className={cn(
            "flex w-full snap-center items-center justify-center text-sm tabular-nums transition-[color,transform] duration-150",
            i === index ? "text-foreground scale-105 font-semibold" : "text-muted-foreground/70",
          )}
          style={{ height: ROW }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function parse(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
