"use client";

import { AlertTriangle, Check, Clock, FileCheck2, FileText, ShieldCheck, ShieldOff, UserRoundCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CopilotMark } from "@/components/assistant/copilot-mark";
import { useRtl, useScope } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const SCENES = ["balance", "draft", "purchase", "policyAr", "scope", "injection"] as const;
type Scene = (typeof SCENES)[number];
const DWELL_MS = 5200;

/** Which guarantee row lights up for each scene. */
const FEATURE_OF: Record<Scene, number | null> = {
  balance: 0,
  draft: 1,
  purchase: null,
  policyAr: 2,
  scope: 0,
  injection: 3,
};
const FEATURE_ICONS = [UserRoundCheck, ShieldCheck, FileCheck2, ShieldOff];

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <p dir="auto" className="bg-sidebar-primary text-sidebar-primary-foreground max-w-[80%] rounded-2xl rounded-ee-md px-4 py-2 text-start text-[13px] font-medium">
        {children}
      </p>
    </div>
  );
}

function Answer({ step, tone = "ok", children }: { step?: string; tone?: "ok" | "warn" | "deny"; children: React.ReactNode }) {
  const Icon = tone === "ok" ? Check : tone === "warn" ? Clock : AlertTriangle;
  return (
    <div className="bg-card text-card-foreground flex gap-3 rounded-2xl rounded-es-md p-4 shadow-xl shadow-black/20">
      <CopilotMark className="text-primary mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1" dir="auto">
        {step ? (
          <p className={cn("inline-flex items-center gap-1.5 text-[12px]", tone === "ok" ? "text-muted-foreground" : tone === "warn" ? "text-amber-700" : "text-destructive")}>
            <Icon className="size-3.5" />
            {step}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-background/70 mt-2.5 rounded-lg border", className)}>{children}</div>;
}

export function AuthShowcase() {
  const t = useScope("auth");
  const s = t.panel.scenes;
  const [index, setIndex] = useState(0);
  const rtl = useRtl();

  // One timeout per scene rather than an interval: choosing a scene by hand
  // restarts the clock, so the next one does not arrive a moment later.
  useEffect(() => {
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % SCENES.length), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [index]);

  const scene = SCENES[index];
  const active = FEATURE_OF[scene];

  const body: Record<Scene, React.ReactNode> = {
    balance: (
      <>
        <Bubble>{s.balance.question}</Bubble>
        <Answer step={s.balance.step}>
          <Panel className="px-3.5 py-3">
            <p className="text-muted-foreground text-[11px] font-medium">{s.balance.stat}</p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-[22px] leading-none font-semibold tabular-nums">18</span>
              <span className="text-muted-foreground text-[11px]">{s.balance.available}</span>
            </p>
            <div className="bg-muted mt-2.5 flex h-1.5 overflow-hidden rounded-full">
              <span className="bg-foreground/55 h-full w-[21%]" />
              <span className="bg-primary/45 h-full w-[4%]" />
            </div>
            <dl className="text-muted-foreground mt-2 flex gap-4 text-[11px]">
              <div className="flex gap-1"><dt>{s.balance.entitled}</dt><dd className="text-foreground font-medium">24</dd></div>
              <div className="flex gap-1"><dt>{s.balance.used}</dt><dd className="text-foreground font-medium">5</dd></div>
              <div className="flex gap-1"><dt>{s.balance.pending}</dt><dd className="text-foreground font-medium">1</dd></div>
            </dl>
          </Panel>
          <p className="mt-2.5 text-[13px] leading-5">{s.balance.answer}</p>
        </Answer>
      </>
    ),
    draft: (
      <>
        <Bubble>{s.draft.question}</Bubble>
        <Answer step={s.draft.step} tone="warn">
          <p className="mt-1.5 text-[13px] leading-5">{s.draft.lead}</p>
          <Panel>
            <p className="px-3.5 pt-2.5 text-[12px] font-semibold">{s.draft.title}</p>
            <dl className="divide-border/60 mt-1.5 divide-y border-t text-[12px]">
              {s.draft.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-3.5 py-1.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="bg-muted/40 flex items-center gap-2 border-t px-3.5 py-2">
              <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium">
                <Check className="size-3" />
                {s.draft.confirm}
              </span>
              <span className="text-muted-foreground inline-flex items-center gap-1 px-1.5 text-[11px] font-medium">
                <X className="size-3" />
                {s.draft.reject}
              </span>
            </div>
          </Panel>
        </Answer>
      </>
    ),
    purchase: (
      <>
        <Bubble>{s.purchase.question}</Bubble>
        <Answer step={s.purchase.step}>
          <Panel className="px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-medium">{s.purchase.purpose}</p>
              <span className="bg-warning/15 rounded-full px-2 py-0.5 text-[10px] font-medium text-amber-800">{s.purchase.status}</span>
            </div>
            <dl className="mt-2.5 grid grid-cols-2 gap-4 text-[12px]">
              <div><dt className="text-muted-foreground text-[11px]">{s.purchase.stepLabel}</dt><dd className="font-medium">{s.purchase.stepValue}</dd></div>
              <div><dt className="text-muted-foreground text-[11px]">{s.purchase.amountLabel}</dt><dd className="font-medium tabular-nums">{s.purchase.amount}</dd></div>
            </dl>
          </Panel>
          <p className="mt-2.5 text-[13px] leading-5">{s.purchase.answer}</p>
        </Answer>
      </>
    ),
    policyAr: (
      <>
        <Bubble>{s.policyAr.question}</Bubble>
        <Answer step={s.policyAr.step}>
          <p className="mt-1.5 text-[13px] leading-5">
            {s.policyAr.answer.replace(/\s\S+$/, "")}{" "}
            <span className="whitespace-nowrap">
              {s.policyAr.answer.match(/\S+$/)?.[0]}
              <sup className="border-primary/30 bg-primary/5 text-primary ms-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border px-1 relative -top-[0.35em] align-baseline text-[10px] leading-none font-semibold">1</sup>
            </span>
          </p>
          <p className="text-muted-foreground mt-2.5 flex items-center gap-2 border-t pt-2 text-[11px]">
            <span className="border-primary/30 bg-primary/5 text-primary inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold">1</span>
            {s.policyAr.source}
          </p>
        </Answer>
      </>
    ),
    scope: (
      <>
        <Bubble>{s.scope.question}</Bubble>
        <Answer>
          <p className="text-[13px] leading-5">{s.scope.answer}</p>
          <p className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="size-3.5" />
            {s.scope.note}
          </p>
        </Answer>
      </>
    ),
    injection: (
      <>
        <div className="flex justify-end">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground max-w-[85%] space-y-1.5 rounded-2xl rounded-ee-md px-4 py-2 text-start text-[13px] font-medium" dir="auto">
            <p>{s.injection.question}</p>
            <div className="bg-black/10 rounded-md px-2.5 py-1.5 text-[11px] font-normal">
              <p className="flex items-center gap-1.5 font-medium">
                <FileText className="size-3 shrink-0" />
                {s.injection.attachment}
              </p>
              <p className="mt-1 leading-4 opacity-70" dir="auto">“{s.injection.hidden}”</p>
            </div>
          </div>
        </div>
        <Answer>
          <p className="text-[13px] leading-5">{s.injection.answer}</p>
          <p className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="size-3.5" />
            {s.injection.note}
          </p>
        </Answer>
      </>
    ),
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="my-auto max-w-[32rem] py-8">
        <h2 className="text-[2rem] leading-tight font-semibold tracking-[-0.02em] xl:text-[2.25rem]">{t.panel.title}</h2>
        <p className="mt-3 max-w-[26rem] text-[15px] leading-relaxed opacity-70">{t.panel.body}</p>

        <div className="relative mt-9 h-[19rem] overflow-hidden" aria-live="off">
          <div
            className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${rtl ? index * 100 : -index * 100}%)` }}
          >
            {SCENES.map((name, i) => (
              <div
                key={name}
                className={cn("w-full shrink-0 space-y-3 px-0.5 transition-opacity duration-500", i === index ? "opacity-100" : "opacity-0")}
                aria-hidden={i !== index}
              >
                {body[name]}
              </div>
            ))}
          </div>
        </div>

      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px]">
        {t.panel.features.map((feature, i) => {
          const Icon = FEATURE_ICONS[i] ?? Check;
          const on = active === i;
          return (
            <li key={feature} className={cn("flex items-center gap-2.5 transition-opacity duration-500", on ? "opacity-100" : "opacity-60")}>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-md transition-colors duration-500", on ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-sidebar-accent text-sidebar-primary")}>
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              {feature}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
