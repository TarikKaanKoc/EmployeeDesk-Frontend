"use client";

import { CalendarDays, ClipboardList, Receipt } from "lucide-react";

import { useFormat, useLocale, useScope } from "@/i18n/provider";
import type { ToolCall } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BalanceRow {
  leave_type: "annual" | "sick";
  entitled_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
  as_of: string;
}

interface RequestRow {
  request_id: string;
  leave_type: "annual" | "sick";
  start_date: string;
  end_date: string;
  days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
}

interface PurchaseResult {
  pr_number: string;
  status: "under_review" | "approved" | "returned" | "rejected";
  current_step: string;
  business_purpose: string;
  amount_qar: number;
  created_date: string;
  last_updated: string;
}

function useDates() {
  const locale = useLocale();
  const tag = locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB";
  return {
    short: new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", year: "numeric" }),
    money: new Intl.NumberFormat(tag, { style: "currency", currency: "QAR", maximumFractionDigits: 2 }),
    number: new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }),
  };
}

function CardFrame({ icon: Icon, title, meta, children }: { icon: React.ElementType; title: string; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-background/70 overflow-hidden rounded-xl border">
      <header className="flex items-center gap-2.5 border-b px-4 py-2.5">
        <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-md">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {meta ? <span className="text-muted-foreground ms-auto text-[11px] tabular-nums">{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}

/** Two rows, one per leave type: the available figure large, a bar for used / pending / available. */
export function LeaveBalanceCard({ rows }: { rows: BalanceRow[] }) {
  const t = useScope("copilot");
  const { fmt, plural } = useFormat();
  const { short, number } = useDates();
  const asOf = rows[0]?.as_of ? fmt(t.cards.balance.asOf, { date: short.format(new Date(rows[0].as_of)) }) : null;
  return (
    <CardFrame icon={CalendarDays} title={t.cards.balance.title} meta={asOf}>
      <div className="divide-border/60 grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
        {rows.map((row) => {
          const used = (row.used_days / row.entitled_days) * 100;
          const pending = (row.pending_days / row.entitled_days) * 100;
          return (
            <div key={row.leave_type} className="px-4 py-3.5">
              <p className="text-muted-foreground text-[12px] font-medium">{t.cards.balance.types[row.leave_type]}</p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[26px] leading-none font-semibold tracking-tight tabular-nums">{number.format(row.available_days)}</span>
                <span className="text-muted-foreground text-[12px]">{plural(row.available_days, t.cards.balance.days).replace(/^[\d.,]+\s*/, "")} {t.cards.balance.available}</span>
              </p>
              <div className="bg-muted mt-3 flex h-1.5 w-full overflow-hidden rounded-full" aria-hidden="true">
                <span className="bg-foreground/55 h-full" style={{ width: `${used}%` }} />
                <span className="bg-primary/45 h-full" style={{ width: `${pending}%` }} />
              </div>
              <dl className="text-muted-foreground mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
                {([
                  [t.cards.balance.entitled, row.entitled_days, "bg-muted-foreground/30"],
                  [t.cards.balance.used, row.used_days, "bg-foreground/55"],
                  [t.cards.balance.pending, row.pending_days, "bg-primary/45"],
                ] as const).map(([label, value, swatch]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={cn("size-2 shrink-0 rounded-full", swatch)} aria-hidden="true" />
                    <dt>{label}</dt>
                    <dd className="text-foreground ms-auto font-medium tabular-nums">{number.format(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </CardFrame>
  );
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warning/15 text-amber-800 dark:text-amber-300",
  under_review: "bg-warning/15 text-amber-800 dark:text-amber-300",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  returned: "bg-primary/10 text-primary",
};

function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", STATUS_TONE[status] ?? "bg-muted")}>
      {label}
    </span>
  );
}

export function LeaveRequestsCard({ rows }: { rows: RequestRow[] }) {
  const t = useScope("copilot");
  const { short } = useDates();
  const c = t.cards.requests.columns;
  return (
    <CardFrame icon={ClipboardList} title={t.cards.requests.title} meta={rows.length}>
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-4 py-4 text-[13px]">{t.cards.requests.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-muted-foreground text-[11px] font-medium">
              <tr className="border-b">
                <th className="px-4 py-2 text-start font-medium">{c.id}</th>
                <th className="px-3 py-2 text-start font-medium">{c.type}</th>
                <th className="px-3 py-2 text-start font-medium">{c.dates}</th>
                <th className="px-3 py-2 text-end font-medium">{c.days}</th>
                <th className="px-4 py-2 text-end font-medium">{c.status}</th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {rows.map((r) => (
                <tr key={r.request_id}>
                  <td className="px-4 py-2 font-mono text-[12px]" dir="ltr">{r.request_id}</td>
                  <td className="px-3 py-2">{t.cards.balance.types[r.leave_type]}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">{short.format(new Date(r.start_date))} – {short.format(new Date(r.end_date))}</td>
                  <td className="px-3 py-2 text-end tabular-nums">{r.days}</td>
                  <td className="px-4 py-2 text-end"><StatusPill status={r.status} label={t.cards.requests.status[r.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardFrame>
  );
}

export function PurchaseRequestCard({ data }: { data: PurchaseResult }) {
  const t = useScope("copilot");
  const { short, money } = useDates();
  return (
    <CardFrame icon={Receipt} title={t.cards.purchase.title} meta={<span dir="ltr" className="font-mono">{data.pr_number}</span>}>
      <div className="px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="min-w-0 text-[15px] font-medium">{data.business_purpose}</p>
          <StatusPill status={data.status} label={t.cards.purchase.status[data.status]} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-4">
          {([
            [t.cards.purchase.step, data.current_step],
            [t.cards.purchase.amount, money.format(data.amount_qar)],
            [t.cards.purchase.created, short.format(new Date(data.created_date))],
            [t.cards.purchase.updated, short.format(new Date(data.last_updated))],
          ] as const).map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground text-[11px]">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </CardFrame>
  );
}

/** Every tool result that has a drawing, in the order the tools ran. */
export function ToolResultCards({ calls }: { calls: ToolCall[] }) {
  const cards = calls.flatMap((call, index) => {
    const result = call.result as Record<string, unknown> | null | undefined;
    if (!result || call.status !== "ok") return [];
    if (call.name === "get_leave_balance" && Array.isArray(result.balances)) {
      return [<LeaveBalanceCard key={`bal-${index}`} rows={result.balances as BalanceRow[]} />];
    }
    if (call.name === "list_leave_requests" && Array.isArray(result.requests)) {
      return [<LeaveRequestsCard key={`req-${index}`} rows={result.requests as RequestRow[]} />];
    }
    if (call.name === "get_purchase_request_status" && typeof result.pr_number === "string") {
      return [<PurchaseRequestCard key={`pr-${index}`} data={result as unknown as PurchaseResult} />];
    }
    return [];
  });
  if (cards.length === 0) return null;
  return <div className="space-y-3">{cards}</div>;
}
