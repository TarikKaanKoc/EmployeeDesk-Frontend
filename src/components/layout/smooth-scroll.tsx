"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Momentum scrolling for the console: each wheel/trackpad tick eases toward
 * its target instead of jumping. Regions with their own scroll (the sidebar
 * rail, the assistant thread) opt out
 * with `data-lenis-prevent`, and the whole thing steps aside when the visitor
 * asks for reduced motion.
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* The console's scroller is the page area under the header, not the
       window. Lenis is given it explicitly; if the shell is not there (a
       screen outside the dashboard layout) there is nothing to smooth. */
    const wrapper = document.getElementById("page-scroll");
    const content = wrapper?.firstElementChild;
    if (!wrapper || !(content instanceof HTMLElement)) return;

    const lenis = new Lenis({
      wrapper,
      content,
      // Lower = heavier: weight without ever reading as a stuck wheel when
      // the main thread is busy.
      lerp: 0.12,
      wheelMultiplier: 1,
      // Touch devices already have native momentum; leave them alone.
      syncTouch: false,
      // A console is full of regions with their own scroll - menus,
      // popovers, tables. Anything scrollable under the pointer keeps its
      // native wheel instead of the page hijacking it, whether or not it
      // remembered to say data-lenis-prevent.
      allowNestedScroll: true,
      autoRaf: true,
      // Evaluated per event: while any modal surface is up, no wheel
      // anywhere - the dimmed page included - moves the page. Two checks,
      // because they fail differently: the body lock is what the scroll
      // blocker sets, and the open dialog is what Radix itself renders -
      // either one alone has versions and edge cases where it is absent.
      prevent: () =>
        document.body.hasAttribute("data-scroll-locked") ||
        document.querySelector('[role="dialog"][data-state="open"]') !== null,
    });
    lenisRef.current = lenis;

    // A modal surface means the page behind it is closed for scrolling.
    // Radix (via react-remove-scroll) marks that state on the body; Lenis
    // animates the page itself, so CSS overflow locks alone cannot stop it -
    // it has to be told. Watching the attribute covers every sheet, dialog
    // and drawer at once instead of each one remembering to opt out.
    const lockWatcher = new MutationObserver(() => {
      if (document.body.hasAttribute("data-scroll-locked")) lenis.stop();
      else lenis.start();
    });
    lockWatcher.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });

    return () => {
      lockWatcher.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Land every navigation at the top. Next scrolls the window itself, but
  // Lenis keeps its own position, so it has to be reset in step or the next
  // wheel tick snaps back to where the previous page was.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
