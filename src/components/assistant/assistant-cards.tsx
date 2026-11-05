"use client";

import {
  AlertCircle,
  CalendarCheck2,
  Check,
  Clock,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFormat, useLocale, useScope } from "@/i18n/provider";
import type { Citation, PendingAction, ToolCall } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * What the assistant did before it answered, as one quiet line above the
 * text: "Searched the policies · Checked your leave balance". A refusal or
 * a failure is named in the same breath, in its own colour, so the reader
 * learns it from the preface rather than from the absence of a figure.
 */
export function ProcessLine({ calls }: { calls: ToolCall[] }) {
  const t = useScope("copilot");
  if (calls.length === 0) return null;
  return (
    <ol className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-5">
      {calls.map((call, index) => {
        const done = (t.tools.done as Record<string, string>)[call.name] ?? call.name;
        const tone =
          call.status === "refused" || call.status === "error"
            ? "text-destructive"
            : call.status === "confirmation_required"
              ? "text-amber-700 dark:text-amber-300"
              : "";
        const Icon =
          call.status === "refused" || call.status === "error"
            ? AlertCircle
            : call.status === "confirmation_required"
              ? Clock
              : Check;
        const label = call.status === "ok" ? done : `${done} · ${t.tools.status[call.status]}`;
        return (
          <li key={`${call.name}-${index}`} className={cn("inline-flex items-center gap-1.5", tone)}>
            {index > 0 ? <span aria-hidden="true" className="text-border me-0.5">·</span> : null}
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Before the first word: one line that moves. Steps already taken sit on
 * the left with a tick; the step under way carries the orb. When no tool is
 * running the orb says "thinking". Replaced by `ProcessLine` the moment the
 * answer starts, so the two never show together.
 */
export function LiveStatus({ calls, activeTool }: { calls: ToolCall[]; activeTool: string | null }) {
  const t = useScope("copilot");
  // Once a tool has finished, only its tick stays on screen; the orb comes
  // back for the next tool. The pause while the model composes is not a
  // step and is not announced as one: the text itself is what arrives next.
  const current = activeTool
    ? ((t.tools.running as Record<string, string>)[activeTool] ?? activeTool)
    : calls.length === 0
      ? t.thread.thinking
      : null;
  return (
    <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-5" aria-live="polite">
      {calls.map((call, index) => (
        <span key={`${call.name}-${index}`} className="text-muted-foreground inline-flex items-center gap-1.5">
          <Check className="size-3.5 shrink-0" aria-hidden="true" />
          {(t.tools.done as Record<string, string>)[call.name] ?? call.name}
        </span>
      ))}
      {current ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="copilot-orb size-3.5 shrink-0" />
          <span className="copilot-thinking font-medium" dir="auto">{current}</span>
        </span>
      ) : null}
    </div>
  );
}

/** The footnote marker in running text: a number, hover for the clause. */
export function CitationMarker({ index, citation }: { index: number; citation: Citation | null }) {
  const t = useScope("copilot");
  const { fmt } = useFormat();
  const marker = (
    <sup
      className={cn(
        "ms-0.5 inline-flex h-4 min-w-4 cursor-default items-center justify-center rounded-full border px-1 align-super text-[10px] leading-none font-semibold tabular-nums transition-colors",
        citation
          ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
          : "text-muted-foreground",
      )}
    >
      {index}
    </sup>
  );
  if (!citation) return marker;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{marker}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-3 text-start" dir={citation.language === "ar" ? "rtl" : "ltr"}>
        <p className="mb-1 text-[11px] font-semibold tracking-wide uppercase opacity-70">
          {t.documents[citation.documentId]} · {fmt(t.citations.section, { section: citation.section })}
        </p>
        <p className="text-[13px] leading-5">{citation.text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The clauses behind the answer, as a section of the answer card rather
 * than a card of their own. Numbered to match the markers in the text.
 */
export function Sources({ citations }: { citations: Citation[] }) {
  const t = useScope("copilot");
  const { fmt } = useFormat();
  const locale = useLocale();
  if (citations.length === 0) return null;
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <section className="border-border/70 mt-4 border-t pt-3">
      <header className="mb-1 flex items-baseline justify-between">
        <h3 className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          {t.citations.title}
        </h3>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {fmt(t.citations.count, { count: citations.length })}
        </span>
      </header>
      <ol className="divide-border/60 divide-y">
        {citations.map((c, index) => (
          <li key={c.policyId} className="grid grid-cols-[1.25rem_1fr] gap-x-3 py-2.5">
            <span className="border-primary/30 bg-primary/5 text-primary mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 text-[12px] leading-5">
                <span className="text-foreground font-medium">{t.documents[c.documentId]}</span>
                <span>{fmt(t.citations.section, { section: c.section })}</span>
                <span>· {c.theme}</span>
                <span className="ms-auto font-mono text-[11px] tracking-tight" dir="ltr">{c.policyId}</span>
              </p>
              <p className="mt-0.5 text-[13px] leading-5" dir={c.language === "ar" ? "rtl" : "ltr"}>
                {c.text}
              </p>
              <p className="text-muted-foreground/80 mt-0.5 text-[11px]">
                {fmt(t.citations.effective, { date: dateFormat.format(new Date(c.effectiveFrom)) })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Guardrail outcomes the reader should know about, as one quiet line. */
export function GuardrailNotes({ flags, refused }: { flags: string[]; refused: boolean }) {
  const t = useScope("copilot");
  const known = flags.filter((f) => f in t.flags) as (keyof typeof t.flags)[];
  const notes = known.map((flag) => t.flags[flag]);
  if (refused && known.length === 0) notes.push(t.flags.refused);
  if (notes.length === 0) return null;
  return (
    <p className="text-muted-foreground inline-flex flex-wrap items-center gap-x-2 text-[12px] leading-5">
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
      {notes.join(" · ")}
    </p>
  );
}

/**
 * The write gate. The draft as a small record, and the two buttons that are
 * the only way it gets submitted; a "yes" typed into the composer is not one
 * of them.
 */
export function ConfirmCard({
  action,
  onDecide,
}: {
  action: PendingAction;
  onDecide: (decision: "confirm" | "reject") => Promise<string>;
}) {
  const t = useScope("copilot");
  const { fmt } = useFormat();
  const locale = useLocale();
  const [busy, setBusy] = useState<"confirm" | "reject" | null>(null);
  const [outcome, setOutcome] = useState<{ text: string; ok: boolean } | null>(null);

  async function decide(decision: "confirm" | "reject") {
    setBusy(decision);
    try {
      setOutcome({ text: await onDecide(decision), ok: decision === "confirm" });
    } finally {
      setBusy(null);
    }
  }

  const payload = action.payload as { leaveType?: string; startDate?: string; endDate?: string; reasonCategory?: string };
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const start = payload.startDate ? new Date(payload.startDate) : null;
  const end = payload.endDate ? new Date(payload.endDate) : null;
  const days = start && end ? Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1 : null;
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  const leaveType = payload.leaveType ? t.confirm.leaveTypes[payload.leaveType as keyof typeof t.confirm.leaveTypes] : null;
  const reason = payload.reasonCategory ? t.confirm.reasons[payload.reasonCategory as keyof typeof t.confirm.reasons] : null;

  const rows: [string, React.ReactNode][] = [
    [t.confirm.fields.type, leaveType ?? payload.leaveType ?? "-"],
    [t.confirm.fields.dates, start && end ? fmt(t.confirm.fields.range, { start: dateFormat.format(start), end: dateFormat.format(end) }) : "-"],
    [t.confirm.fields.days, days ?? "-"],
    [t.confirm.fields.reason, reason ?? payload.reasonCategory ?? "-"],
  ];

  return (
    <section className="bg-background/60 mt-4 overflow-hidden rounded-xl border">
      <header className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
          <CalendarCheck2 className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{t.confirm.title}</h3>
          <p className="text-muted-foreground text-xs leading-5">{t.confirm.body}</p>
        </div>
      </header>
      <dl className="divide-border/60 grid grid-cols-[auto_1fr] divide-y border-t text-[13px]">
        {rows.map(([label, value]) => (
          <div key={label} className="col-span-2 grid grid-cols-subgrid items-baseline gap-x-6 px-4 py-2">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <footer className="bg-muted/40 flex flex-wrap items-center gap-2 border-t px-4 py-3">
        {outcome ? (
          <p className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", outcome.ok ? "text-success" : "text-muted-foreground")}>
            {outcome.ok ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
            {outcome.text}
          </p>
        ) : (
          <>
            <Button size="sm" onClick={() => void decide("confirm")} disabled={busy !== null}>
              {busy === "confirm" ? <Loader2 className="animate-spin" /> : <Check />}
              {busy === "confirm" ? t.confirm.submitting : t.confirm.confirm}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void decide("reject")} disabled={busy !== null}>
              {t.confirm.reject}
            </Button>
            <span className="text-muted-foreground ms-auto inline-flex items-center gap-1 text-[11px] tabular-nums">
              <Clock className="size-3" aria-hidden="true" />
              {fmt(t.confirm.expiresAt, { time: time.format(new Date(action.expiresAt)) })}
            </span>
          </>
        )}
      </footer>
    </section>
  );
}
