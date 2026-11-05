"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { LogoMark } from "@/components/logo";
import { endIntro, getIntroServerSnapshot, getIntroSnapshot, subscribeIntro } from "@/lib/intro-store";
import { cn } from "@/lib/utils";

/** How long the reveal holds before it dissolves into the workspace. */
const HOLD_MS = 1150;

/**
 * The hand-off from sign-in to the workspace: the mark resolves out of a
 * blur, the name settles beside it, a dot field behind them lights up in
 * one wave travelling out from the mark, and the whole layer dissolves.
 * No gradient wash, no bar, no spinner, no words.
 */
export function IntroLoader() {
  const state = useSyncExternalStore(subscribeIntro, getIntroSnapshot, getIntroServerSnapshot);
  if (!state) return null;
  return <IntroScene />;
}

function IntroScene() {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving(true), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "intro-loader bg-background fixed inset-0 z-100 flex items-center justify-center overflow-hidden transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        leaving && "pointer-events-none scale-[1.03] opacity-0",
      )}
      onTransitionEnd={(event) => {
        if (leaving && event.propertyName === "opacity") endIntro();
      }}
      aria-hidden="true"
    >
      <div className="intro-field" />
      <div className="intro-wave" />
      <div className="relative flex items-center gap-3" dir="ltr">
        <LogoMark className="intro-mark size-12" style={{ ["--logo-accent" as string]: "#2DA394" }} />
        <span className="intro-word text-foreground text-[2rem] leading-none font-semibold tracking-[-0.03em]">
          Employee<span className="text-primary">Desk</span>
        </span>
      </div>
    </div>
  );
}
