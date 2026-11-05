"use client";

import { CalendarDays, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { LeaveRequestSheet } from "@/components/leave/leave-request-sheet";
import { DataPanel, ResultCount, SegmentedFilter } from "@/components/layout/data-panel";
import { EmptyState, NoMatchRow, Pagination, SortableTh } from "@/components/layout/table-kit";
import { LEAVE_TONE, StatusBadge } from "@/components/records/status-badge";
import { Button } from "@/components/ui/button";
import { StatTile, StatTileRow } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTableQuery } from "@/hooks/use-table-query";
import { useFormat, useScope } from "@/i18n/provider";
import type { LeaveBalance, LeaveRequest, LeaveRequestStatus } from "@/lib/api";

type Column = "request" | "type" | "dates" | "days" | "status" | "submitted";
type Filter = "all" | LeaveRequestStatus;

const PAGE_SIZE = 10;
const STATUSES: LeaveRequestStatus[] = ["pending", "approved", "rejected", "cancelled"];

function order(a: LeaveRequest, b: LeaveRequest, column: Column): number {
  switch (column) {
    case "request":
      return a.requestId.localeCompare(b.requestId);
    case "type":
      return a.leaveType.localeCompare(b.leaveType);
    case "dates":
      return a.startDate.localeCompare(b.startDate);
    case "days":
      return a.days - b.days;
    case "status":
      return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
    case "submitted":
      return a.createdAt.localeCompare(b.createdAt);
  }
}

/**
 * The leave screen: two balances and the pending count as tiles, then the
 * request list. The pending tile is a filter; the balances report.
 */
export function LeaveWorkspace({ balances, requests }: { balances: LeaveBalance[]; requests: LeaveRequest[] }) {
  const t = useScope("records");
  const { fmt, plural, number, date } = useFormat();
  const [filter, setFilter] = useState<Filter>("all");
  const [composing, setComposing] = useState(false);

  const counts = useMemo(() => {
    const out: Record<Filter, number> = { all: requests.length, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    for (const row of requests) out[row.status] += 1;
    return out;
  }, [requests]);

  const visible = useMemo(() => (filter === "all" ? requests : requests.filter((r) => r.status === filter)), [requests, filter]);
  const filterFn = useCallback(() => true, []);
  const table = useTableQuery<LeaveRequest, Column>({
    rows: visible,
    pageSize: PAGE_SIZE,
    filter: filterFn,
    order,
    sort: { column: "submitted", descending: true },
    firstDirection: { submitted: "desc", dates: "desc", days: "desc" },
  });

  const annual = balances.find((b) => b.leaveType === "annual");
  const sick = balances.find((b) => b.leaveType === "sick");
  const pendingDays = requests.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.days, 0);
  const asOf = annual ?? sick;

  const filters: { key: Filter; label: string; badge: number }[] = [
    { key: "all", label: t.shared.all, badge: counts.all },
    ...STATUSES.map((status) => ({ key: status, label: t.leave.status[status], badge: counts[status] })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{t.leave.title}</h2>
          <p className="text-muted-foreground mt-1 line-clamp-2 max-w-3xl text-sm sm:line-clamp-none">{t.leave.description}</p>
        </div>
        <Button onClick={() => setComposing(true)}>
          <Plus className="size-4" aria-hidden="true" />
          {t.leave.newRequest}
        </Button>
      </div>

      <StatTileRow>
        {([
          [annual, t.leave.tiles.annual],
          [sick, t.leave.tiles.sick],
        ] as const).map(([balance, label]) => (
          <StatTile
            key={label}
            label={label}
            icon={CalendarDays}
            value={balance ? number(balance.availableDays) : "0"}
            unit={t.leave.tiles.available}
            zero={!balance || balance.availableDays === 0}
            info={asOf ? fmt(t.leave.tiles.asOf, { date: date(asOf.asOfDate) }) : undefined}
            figure={
              balance
                ? {
                    primary: fmt(t.leave.tiles.ofEntitled, { count: number(balance.entitledDays) }),
                    caption: fmt(t.leave.tiles.used, { count: number(balance.usedDays) }),
                  }
                : undefined
            }
          />
        ))}
        <StatTile
          label={t.leave.tiles.pending}
          dot="progress"
          value={number(counts.pending)}
          zero={counts.pending === 0}
          figure={
            counts.pending === 0
              ? { primary: t.leave.tiles.none, caption: "" }
              : { primary: fmt(t.leave.tiles.pendingDays, { count: number(pendingDays) }), caption: plural(counts.pending, t.shared.rows) }
          }
          onClick={() => {
            setFilter((current) => (current === "pending" ? "all" : "pending"));
            table.setPage(0);
          }}
          active={filter === "pending"}
        />
      </StatTileRow>

      {requests.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          scene="inbox"
          title={t.leave.empty.title}
          body={t.leave.empty.body}
          action={
            <Button onClick={() => setComposing(true)}>
              <Plus className="size-4" aria-hidden="true" />
              {t.leave.newRequest}
            </Button>
          }
        />
      ) : (
        <DataPanel
          filters={
            <>
              <SegmentedFilter
                options={filters}
                value={filter}
                onChange={(next) => {
                  setFilter(next);
                  table.setPage(0);
                }}
              />
              <div className="ms-auto">
                <ResultCount showing={table.filtered.length} total={requests.length} noun={plural(requests.length, t.shared.rows).replace(/^[\d.,٠-٩]+\s*/, "")} />
              </div>
            </>
          }
          footer={
            <Pagination
              page={table.page}
              pageCount={table.pageCount}
              pageSize={PAGE_SIZE}
              total={table.filtered.length}
              onPage={table.setPage}
            />
          }
        >
          {/* Phones get a card per request; the table needs the width. */}
          <ul className="divide-y md:hidden">
            {table.pageRows.map((row) => (
              <li key={row.requestId} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium tabular-nums" dir="ltr">{row.requestId}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {t.leave.types[row.leaveType]} · {date(row.startDate)} – {date(row.endDate)}
                  </p>
                  <p className="text-muted-foreground text-xs">{plural(row.days, t.shared.days)} · {t.leave.reasons[row.reasonCategory]}</p>
                </div>
                <StatusBadge tone={LEAVE_TONE[row.status]} label={t.leave.status[row.status]} />
              </li>
            ))}
            {table.pageRows.length === 0 ? (
              <li className="text-muted-foreground px-4 py-10 text-center text-sm">{t.leave.emptyFiltered}</li>
            ) : null}
          </ul>

          <Table className="hidden md:table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTh column="request" sort={table.sort} onSort={table.sortBy}>{t.leave.columns.request}</SortableTh>
                <SortableTh column="type" sort={table.sort} onSort={table.sortBy}>{t.leave.columns.type}</SortableTh>
                <SortableTh column="dates" sort={table.sort} onSort={table.sortBy}>{t.leave.columns.dates}</SortableTh>
                <SortableTh column="days" sort={table.sort} onSort={table.sortBy} className="text-end">{t.leave.columns.days}</SortableTh>
                <TableHead>{t.leave.columns.reason}</TableHead>
                <SortableTh column="status" sort={table.sort} onSort={table.sortBy}>{t.leave.columns.status}</SortableTh>
                <SortableTh column="submitted" sort={table.sort} onSort={table.sortBy}>{t.leave.columns.submitted}</SortableTh>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.map((row) => (
                <TableRow key={row.requestId}>
                  <TableCell className="font-medium tabular-nums" dir="ltr">{row.requestId}</TableCell>
                  <TableCell>{t.leave.types[row.leaveType]}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {date(row.startDate)}
                    <span className="text-muted-foreground"> – </span>
                    {date(row.endDate)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">{number(row.days)}</TableCell>
                  <TableCell className="text-muted-foreground">{t.leave.reasons[row.reasonCategory]}</TableCell>
                  <TableCell><StatusBadge tone={LEAVE_TONE[row.status]} label={t.leave.status[row.status]} /></TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">{date(row.createdAt)}</TableCell>
                </TableRow>
              ))}
              {table.pageRows.length === 0 ? (
                <NoMatchRow colSpan={7} title={t.leave.emptyFiltered} onClear={() => setFilter("all")} clearLabel={t.shared.all} />
              ) : null}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      <LeaveRequestSheet open={composing} onOpenChange={setComposing} balances={balances} />
    </div>
  );
}
