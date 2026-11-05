"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Whether a region is being scrolled right now - true from the first wheel
 * tick until the scrolling has been quiet for a moment. Pairs with the
 * `scrollbar-auto` class, which keeps a region's bar invisible until the
 * reader actually scrolls, the way a mail client's panes behave.
 */
export function useScrolling(quietMs = 700) {
  const [scrolling, setScrolling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = useCallback(() => {
    setScrolling(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setScrolling(false), quietMs);
  }, [quietMs]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { scrolling, onScroll };
}
