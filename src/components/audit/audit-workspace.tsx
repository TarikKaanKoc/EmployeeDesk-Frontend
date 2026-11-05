"use client";

import {
  ChevronDown,
  FileCheck2,
  MessageSquareText,
  ScrollText,
  Search,
  ShieldAlert,
  ShieldOff,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DataPanel, SegmentedFilter } from "@/components/layout/data-panel";
import { EmptyState, Pagination } from "@/components/layout/table-kit";
import { RowList } from "@/components/records/row-list";
import { Button } from "@/components/ui/button";
import { StatTile, StatTileRow } from "@/components/ui/stat-card";
import { useFormat, useScope } from "@/i18n/provider";
import { type AuditEvent, type AuditEventType, type AuditPage, getAuditTrail } from "@/lib/api";
import { cn } from "@/lib/utils";

type Group = "all" | "answers" | "lookups" | "requests" | "blocked";

const GROUP_OF: Record<AuditEventType, Exclude<Group, "all">> = {
  "chat.turn": "answers",
  "tool.called": "lookups",
  "tool.refused": "blocked",
  "action.drafted": "requests",
  "action.confirmed": "requests",
  "action.rejected": "requests",
  "guardrail.triggered": "blocked",
  "assistant.refused": "blocked",
};

const TONE: Record<AuditEventType, string> = {
  "chat.turn": "bg-primary/10 text-primary",
  "tool.called": "bg-muted text-foreground/70",
  "tool.refused": "bg-destructive/10 text-destructive",
  "action.drafted": "bg-warning/15 text-amber-800 dark:text-amber-300",
  "action.confirmed": "bg-success/15 text-success",
  "action.rejected": "bg-muted text-muted-foreground",
  "guardrail.triggered": "bg-destructive/10 text-destructive",
  "assistant.refused": "bg-destructive/10 text-destructive",
};

const ICON: Record<AuditEventType, React.ElementType> = {
  "chat.turn": MessageSquareText,
  "tool.called": Search,
  "tool.refused": ShieldOff,
  "action.drafted": FileCheck2,
  "action.confirmed": FileCheck2,
  "action.rejected": FileCheck2,
  "guardrail.triggered": ShieldAlert,
  "assistant.refused": ShieldAlert,
};

const PAGE_SIZE = 10;

const TOOL_LABEL: Record<string, string> = {
  get_leave_balance: "Leave balance",
  list_leave_requests: "Leave requests",
  draft_leave_request: "Leave request draft",
  get_purchase_request_status: "Purchase request",
  search_policy: "Policy search",
};

function text(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * The activity trail: what the assistant did, newest first, grouped by
 * day. Each line says the event in words and shows its recorded data on
 * demand; the first page comes with the document, later pages are fetched
 * when the reader asks for them.
 */
export function AuditWorkspace({ initial }: { initial: AuditPage }) {
  const t = useScope("records");
  const { fmt, number, date } = useFormat();
  const [events, setEvents] = useState<AuditEvent[]>(initial.events);
  const [nextBefore, setNextBefore] = useState<number | null>(initial.nextBefore);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<Group>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const stats = useMemo(() => {
    const out = { turns: 0, tools: 0, drafts: 0, confirmed: 0, blocked: 0, refusals: 0, injections: 0, last: null as string | null };
    for (const e of events) {
      if (e.eventType === "chat.turn") out.turns += 1;
      if (e.eventType === "tool.called") out.tools += 1;
      if (e.eventType === "action.drafted") out.drafts += 1;
      if (e.eventType === "action.confirmed") out.confirmed += 1;
      if (GROUP_OF[e.eventType] === "blocked") out.blocked += 1;
      if (e.eventType === "assistant.refused" || e.eventType === "tool.refused") out.refusals += 1;
      if (e.eventType === "guardrail.triggered" && String(e.payload.flag ?? "").includes("injection")) out.injections += 1;
    }
    out.last = events[0]?.createdAt ?? null;
    return out;
  }, [events]);

  const visible = useMemo(() => (group === "all" ? events : events.filter((e) => GROUP_OF[e.eventType] === group)), [events, group]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE), [visible, current]);

  const days = useMemo(() => {
    const out: { key: string; label: string; rows: AuditEvent[] }[] = [];
    for (const e of pageRows) {
      const key = e.createdAt.slice(0, 10);
      const last = out[out.length - 1];
      if (last && last.key === key) last.rows.push(e);
      else out.push({ key, label: date(e.createdAt, { weekday: "long", day: "numeric", month: "long" }), rows: [e] });
    }
    return out;
  }, [pageRows, date]);

  function select(next: Group) {
    setGroup(next);
    setPage(0);
    setExpanded(null);
  }

  async function loadMore() {
    if (!nextBefore || loading) return;
    setLoading(true);
    try {
      const page = await getAuditTrail({ before: nextBefore, limit: 50 });
      setEvents((current) => [...current, ...page.events]);
      setNextBefore(page.nextBefore);
    } finally {
      setLoading(false);
    }
  }

  function summary(e: AuditEvent): string {
    const p = e.payload;
    switch (e.eventType) {
      case "chat.turn": {
        const tools = Array.isArray(p.tools) ? (p.tools as string[]).map((n) => TOOL_LABEL[n] ?? n) : [];
        return [String(p.language ?? "").toUpperCase(), tools.join(", "), p.refused ? t.audit.detail.refused : ""].filter(Boolean).join(" · ");
      }
      case "tool.called":
      case "tool.refused":
        return [TOOL_LABEL[String(p.name)] ?? String(p.name ?? ""), text(p.detail)].filter(Boolean).join(" · ");
      case "action.drafted":
      case "action.confirmed":
      case "action.rejected":
        return [text(p.request_id), text(p.summary)].filter(Boolean).join(" · ");
      case "guardrail.triggered":
        return [text(p.flag), text(p.foreign_ids)].filter(Boolean).join(" · ");
      case "assistant.refused":
        return text(p.reason).replaceAll("_", " ");
    }
  }

  const groups: { key: Group; label: string }[] = [
    { key: "all", label: t.shared.all },
    { key: "answers", label: t.audit.events["chat.turn"] },
    { key: "lookups", label: t.audit.events["tool.called"] },
    { key: "requests", label: t.audit.tiles.drafts },
    { key: "blocked", label: t.audit.tiles.guardrails },
  ];

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{t.audit.title}</h2>
        <p className="text-muted-foreground mt-1 line-clamp-2 max-w-3xl text-sm sm:line-clamp-none">{t.audit.description}</p>
      </div>

      <StatTileRow columns={4}>
        <StatTile
          label={t.audit.tiles.turns}
          icon={MessageSquareText}
          value={number(stats.turns)}
          zero={stats.turns === 0}
          figure={stats.last ? { primary: fmt(t.audit.tiles.last, { date: date(stats.last) }), caption: "" } : undefined}
          onClick={() => select(group === "answers" ? "all" : "answers")}
          active={group === "answers"}
        />
        <StatTile
          label={t.audit.tiles.tools}
          icon={Search}
          value={number(stats.tools)}
          zero={stats.tools === 0}
          onClick={() => select(group === "lookups" ? "all" : "lookups")}
          active={group === "lookups"}
        />
        <StatTile
          label={t.audit.tiles.drafts}
          dot="progress"
          value={number(stats.drafts)}
          zero={stats.drafts === 0}
          figure={stats.drafts ? { primary: fmt(t.audit.tiles.confirmed, { count: number(stats.confirmed) }), caption: "" } : undefined}
          onClick={() => select(group === "requests" ? "all" : "requests")}
          active={group === "requests"}
        />
        <StatTile
          label={t.audit.tiles.guardrails}
          dot="danger"
          value={number(stats.blocked)}
          zero={stats.blocked === 0}
          figure={
            stats.blocked
              ? { primary: fmt(t.audit.tiles.refusals, { count: number(stats.refusals) }), caption: fmt(t.audit.tiles.injections, { count: number(stats.injections) }) }
              : { primary: t.audit.tiles.none, caption: "" }
          }
          onClick={() => select(group === "blocked" ? "all" : "blocked")}
          active={group === "blocked"}
        />
      </StatTileRow>

      {events.length === 0 ? (
        <EmptyState icon={ScrollText} scene="inbox" title={t.audit.empty.title} body={t.audit.empty.body} />
      ) : (
        <DataPanel
          filters={<SegmentedFilter options={groups} value={group} onChange={select} />}
          footer={
            <Pagination
              page={current}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              total={visible.length}
              onPage={(next) => {
                setPage(next);
                setExpanded(null);
              }}
              always
              trailing={
                nextBefore ? (
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
                    {t.shared.loadMore}
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-xs">{t.audit.endOfTrail}</span>
                )
              }
            />
          }
        >
          {days.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">{t.shared.all}</p>
          ) : null}
          {days.map((day) => (
            <section key={day.key}>
              <h3 className="bg-muted/40 text-muted-foreground sticky top-0 z-10 border-b px-4 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
                {day.label}
              </h3>
              <ol className="divide-y">
                {day.rows.map((e) => {
                  const Icon = ICON[e.eventType];
                  const isOpen = expanded === e.id;
                  const rows = Object.entries(e.payload).map(([k, v]) => ({ label: k.replaceAll("_", " "), value: text(v) || "–", ltr: true }));
                  return (
                    <li key={e.id} className={cn(isOpen && "bg-muted/20")}>
                      <div className="flex items-start gap-3 px-4 py-3">
                        <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md", TONE[e.eventType])}>
                          <Icon className="size-3.5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <p className="text-sm font-medium">{t.audit.events[e.eventType]}</p>
                            <time dateTime={e.createdAt} className="text-muted-foreground text-xs tabular-nums">
                              {date(e.createdAt, { hour: "2-digit", minute: "2-digit" })}
                            </time>
                          </div>
                          <p className="text-muted-foreground mt-0.5 truncate text-xs">{summary(e) || "–"}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {e.conversationId ? (
                            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              <Link href={`/copilot?c=${encodeURIComponent(e.conversationId)}`}>{t.audit.openConversation}</Link>
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-expanded={isOpen}
                            aria-label={t.shared.details}
                            onClick={() => setExpanded(isOpen ? null : e.id)}
                          >
                            <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      {isOpen ? (
                        <div className="px-4 pb-4 ps-14">
                          <p className="text-muted-foreground mb-1 text-[11px] font-medium tracking-wide uppercase">{t.audit.detail.payload}</p>
                          <RowList rows={rows} className="text-xs" />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </DataPanel>
      )}
    </div>
  );
}
