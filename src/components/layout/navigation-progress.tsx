"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * A hairline of progress along the top edge while a navigation is in flight.
 *
 * For a screen that arrives in a few hundred milliseconds a skeleton is the
 * wrong trade: the page being read is torn down, grey blocks flash, then the
 * real thing lands - three states for one click. Instead the current page
 * stays put and this bar says "on its way", the way a browser's own loading
 * indicator does.
 *
 * Starts on any plain click on an internal link (and on back/forward), and
 * stops when the pathname it started from is no longer the one on screen.
 * A safety timer clears it for navigations that end without a path change.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [startedFrom, setStartedFrom] = useState<string | null>(null);

  useEffect(() => {
    const start = () => setStartedFrom(window.location.pathname);

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };

    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", start);
    return () => {
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", start);
    };
  }, []);

  // Still on the page the click happened on: the new one has not arrived.
  const active = startedFrom !== null && startedFrom === pathname;

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setStartedFrom(null), 4000);
    return () => window.clearTimeout(timer);
  }, [active, startedFrom]);

  if (!active) return null;
  return (
    /* Held back for a quarter second by the animation's delay rather than by
       a timer: most navigations land inside that window, and a bar that
       flashes on every click reads as jitter - worse than no bar. Doing it in
       CSS keeps it out of React's hands, so there is no render in which a
       stale bar can be left painted across the top of the screen. */
    <div
      role="progressbar"
      aria-busy="true"
      className="animate-[nav-progress-appear_1ms_linear_250ms_forwards] pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden opacity-0"
    >
      <div className="bg-primary h-full w-1/3 animate-[org-switch_1s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-none" />
    </div>
  );
}
