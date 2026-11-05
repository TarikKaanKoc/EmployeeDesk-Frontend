"use client";

import { ClipboardList, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { DataPanel, ResultCount, SearchInput, SegmentedFilter } from "@/components/layout/data-panel";
import { EmptyState, NoMatchRow, Pagination, SortableTh } from "@/components/layout/table-kit";
import { RowList } from "@/components/records/row-list";
import { PURCHASE_TONE, StatusBadge } from "@/components/records/status-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatAmount, StatTile, StatTileRow } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTableQuery } from "@/hooks/use-table-query";
import { useFormat, useScope } from "@/i18n/provider";
import type { PurchaseRequest, PurchaseRequestStatus } from "@/lib/api";
import { useMoney } from "@/lib/format-client";

type Column = "number" | "purpose" | "amount" | "status" | "created" | "updated";
type Filter = "all" | PurchaseRequestStatus;

const PAGE_SIZE = 10;
const STATUSES: PurchaseRequestStatus[] = ["under_review", "approved", "returned", "rejected"];
const DOT = { under_review: "progress", approved: "done", returned: "open", rejected: "danger" } as const;

function order(a: PurchaseRequest, b: PurchaseRequest, column: Column): number {
  switch (column) {
    case "number":
      return a.prNumber.localeCompare(b.prNumber);
    case "purpose":
      return a.businessPurpose.localeCompare(b.businessPurpose);
    case "amount":
      return a.amountQar - b.amountQar;
    case "status":
      return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
    case "created":
      return a.createdDate.localeCompare(b.createdDate);
    case "updated":
      return a.lastUpdated.localeCompare(b.lastUpdated);
  }
}

/**
 * Purchase requests, read live from the ERP. One tile per status, each a
 * filter; the list under them; a sheet for the record itself. Nothing
 * here writes: the ERP owns these, and the screen says so in the sheet.
 */
export function ProcurementWorkspace({ requests }: { requests: PurchaseRequest[] }) {
  const t = useScope("records");
  const { fmt, plural, number, date } = useFormat();
  const formatMoney = useMoney();
  /* The shared formatter counts in minor units (it came from a ledger that
     stores halalas); the ERP reports whole riyals with two decimals. */
  const money = (qar: number) => formatMoney(Math.round(qar * 100));
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<PurchaseRequest | null>(null);

  const byStatus = useMemo(() => {
    const out = Object.fromEntries(STATUSES.map((s) => [s, { count: 0, amount: 0 }])) as Record<PurchaseRequestStatus, { count: number; amount: number }>;
    for (const row of requests) {
      out[row.status].count += 1;
      out[row.status].amount += row.amountQar;
    }
    return out;
  }, [requests]);

  const visible = useMemo(() => (filter === "all" ? requests : requests.filter((r) => r.status === filter)), [requests, filter]);
  const filterFn = useCallback(
    (row: PurchaseRequest, needle: string) =>
      !needle ||
      row.prNumber.toLowerCase().includes(needle) ||
      row.businessPurpose.toLowerCase().includes(needle) ||
      row.currentStep.toLowerCase().includes(needle) ||
      row.reference.toLowerCase().includes(needle),
    [],
  );
  const table = useTableQuery<PurchaseRequest, Column>({
    rows: visible,
    pageSize: PAGE_SIZE,
    filter: filterFn,
    order,
    sort: { column: "updated", descending: true },
    firstDirection: { updated: "desc", created: "desc", amount: "desc" },
  });

  const noun = plural(requests.length, t.shared.rows).replace(/^[\d.,٠-٩]+\s*/, "");
  const filters: { key: Filter; label: string; badge: number }[] = [
    { key: "all", label: t.shared.all, badge: requests.length },
    ...STATUSES.map((s) => ({ key: s, label: t.procurement.status[s], badge: byStatus[s].count })),
  ];

  function toggle(status: PurchaseRequestStatus) {
    setFilter((current) => (current === status ? "all" : status));
    table.setPage(0);
  }

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{t.procurement.title}</h2>
        <p className="text-muted-foreground mt-1 line-clamp-2 max-w-3xl text-sm sm:line-clamp-none">{t.procurement.description}</p>
      </div>

      <StatTileRow columns={4}>
        {STATUSES.map((status) => {
          const bucket = byStatus[status];
          const waiting = status === "under_review" ? requests.find((r) => r.status === status)?.currentStep : null;
          return (
            <StatTile
              key={status}
              label={t.procurement.status[status]}
              dot={DOT[status]}
              value={number(bucket.count)}
              zero={bucket.count === 0}
              figure={
                bucket.count === 0
                  ? { primary: t.procurement.tiles.none, caption: "" }
                  : {
                      primary: <StatAmount currency="QAR">{number(bucket.amount, { maximumFractionDigits: 0 })}</StatAmount>,
                      caption: waiting ? fmt(t.procurement.tiles.thisStep, { step: waiting }) : plural(bucket.count, t.procurement.tiles.count),
                    }
              }
              onClick={() => toggle(status)}
              active={filter === status}
            />
          );
        })}
      </StatTileRow>

      {requests.length === 0 ? (
        <EmptyState icon={ClipboardList} scene="orders" title={t.procurement.empty.title} body={t.procurement.empty.body} />
      ) : (
        <DataPanel
          filters={
            <>
              <SearchInput value={table.query} onChange={table.setQuery} placeholder={t.procurement.columns.number} label={t.procurement.columns.number} className="w-full sm:w-64" />
              <SegmentedFilter
                options={filters}
                value={filter}
                onChange={(next) => {
                  setFilter(next);
                  table.setPage(0);
                }}
              />
              <div className="ms-auto">
                <ResultCount showing={table.filtered.length} total={requests.length} noun={noun} />
              </div>
            </>
          }
          footer={<Pagination page={table.page} pageCount={table.pageCount} pageSize={PAGE_SIZE} total={table.filtered.length} onPage={table.setPage} />}
        >
          <ul className="divide-y md:hidden">
            {table.pageRows.map((row) => (
              <li key={row.prNumber}>
                <button type="button" onClick={() => setOpen(row)} className="hover:bg-muted/40 flex w-full items-start justify-between gap-3 px-4 py-3 text-start">
                  <div className="min-w-0">
                    <p className="text-sm font-medium tabular-nums" dir="ltr">{row.prNumber}</p>
                    <p className="mt-0.5 truncate text-sm">{row.businessPurpose}</p>
                    <p className="text-muted-foreground text-xs tabular-nums">{money(row.amountQar)} · {date(row.lastUpdated)}</p>
                  </div>
                  <StatusBadge tone={PURCHASE_TONE[row.status]} label={t.procurement.status[row.status]} />
                </button>
              </li>
            ))}
            {table.pageRows.length === 0 ? <li className="text-muted-foreground px-4 py-10 text-center text-sm">{t.procurement.emptyFiltered}</li> : null}
          </ul>

          <Table className="hidden md:table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTh column="number" sort={table.sort} onSort={table.sortBy}>{t.procurement.columns.number}</SortableTh>
                <SortableTh column="purpose" sort={table.sort} onSort={table.sortBy}>{t.procurement.columns.purpose}</SortableTh>
                <SortableTh column="amount" sort={table.sort} onSort={table.sortBy} className="text-end">{t.procurement.columns.amount}</SortableTh>
                <SortableTh column="status" sort={table.sort} onSort={table.sortBy}>{t.procurement.columns.status}</SortableTh>
                <TableHead>{t.procurement.columns.step}</TableHead>
                <SortableTh column="created" sort={table.sort} onSort={table.sortBy}>{t.procurement.columns.created}</SortableTh>
                <SortableTh column="updated" sort={table.sort} onSort={table.sortBy}>{t.procurement.columns.updated}</SortableTh>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.map((row) => (
                <TableRow key={row.prNumber} onClick={() => setOpen(row)} className="cursor-pointer">
                  <TableCell className="font-medium tabular-nums" dir="ltr">{row.prNumber}</TableCell>
                  <TableCell className="max-w-[28rem] truncate">{row.businessPurpose}</TableCell>
                  <TableCell className="text-end whitespace-nowrap tabular-nums">{money(row.amountQar)}</TableCell>
                  <TableCell><StatusBadge tone={PURCHASE_TONE[row.status]} label={t.procurement.status[row.status]} /></TableCell>
                  <TableCell className="text-muted-foreground">{row.currentStep}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">{date(row.createdDate)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">{date(row.lastUpdated)}</TableCell>
                </TableRow>
              ))}
              {table.pageRows.length === 0 ? (
                <NoMatchRow
                  colSpan={7}
                  title={t.procurement.emptyFiltered}
                  onClear={() => {
                    setFilter("all");
                    table.setQuery("");
                  }}
                  clearLabel={t.shared.all}
                />
              ) : null}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      <Sheet open={open !== null} onOpenChange={(next) => (next ? undefined : setOpen(null))}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-5 text-start">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t.procurement.detail.title}</p>
                <SheetTitle className="flex flex-wrap items-center gap-2">
                  <span className="tabular-nums" dir="ltr">{open.prNumber}</span>
                  <StatusBadge tone={PURCHASE_TONE[open.status]} label={t.procurement.status[open.status]} />
                </SheetTitle>
                <SheetDescription>{open.businessPurpose}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <RowList
                  rows={[
                    { label: t.procurement.detail.amount, value: money(open.amountQar), ltr: true },
                    { label: t.procurement.detail.step, value: open.currentStep },
                    { label: t.procurement.detail.department, value: open.department },
                    { label: t.procurement.detail.requester, value: open.requesterEmployeeId, ltr: true },
                    { label: t.procurement.detail.reference, value: open.reference, ltr: true },
                    { label: t.procurement.detail.created, value: date(open.createdDate), ltr: true },
                    { label: t.procurement.detail.updated, value: date(open.lastUpdated), ltr: true },
                  ]}
                />
                <p className="text-muted-foreground mt-5 text-xs">{t.procurement.detail.source}</p>
              </div>
              <div className="border-t px-6 py-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/copilot?ask=${encodeURIComponent(open.prNumber)}`}>
                    <MessageSquareText className="size-4" aria-hidden="true" />
                    {fmt(t.procurement.detail.ask, { number: open.prNumber })}
                  </Link>
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
