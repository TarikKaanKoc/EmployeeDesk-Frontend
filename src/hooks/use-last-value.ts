"use client";

import { useEffect, useState } from "react";

/**
 * The last non-null value, kept while the current one is null.
 *
 * For a dialog whose content comes from "the row it is about": the parent
 * clears the row to close it, and the dialog then has to animate out for a
 * hundred and fifty milliseconds with nothing to draw. Rendering from the
 * last row it had keeps the surface intact while it leaves, instead of
 * collapsing to a header and a footer mid-exit.
 *
 * Set after render, deferred, so the first render of a new value paints
 * with the value it was given and the retained copy catches up behind it.
 */
export function useLastValue<T>(value: T | null | undefined): T | null {
  const [last, setLast] = useState<T | null>(value ?? null);
  useEffect(() => {
    if (value === null || value === undefined) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setLast(value);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);
  return value ?? last;
}
