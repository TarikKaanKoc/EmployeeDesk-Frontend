"use client";

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState<Column extends string> {
  column: Column;
  descending: boolean;
}

interface Options<Row, Column extends string> {
  rows: Row[];
  pageSize: number;
  /**
   * Which rows survive. `needle` is the trimmed, lower-cased search box so
   * each table does not have to normalise it again.
   */
  filter: (row: Row, needle: string) => boolean;
  /**
   * Ascending comparison for one column; the hook applies the direction. A
   * comparator that ignores `column` gives a table a fixed order with the
   * paging still handled here.
   */
  order: (a: Row, b: Row, column: Column) => number;
  /** How the list opens. Also where the sort cycle returns to. */
  sort: SortState<Column>;
  /**
   * The direction a column is useful in when first clicked. Sorting by amount
   * ascending shows the smallest amount first, which nobody has ever
   * wanted; sorting by due date descending buries the overdue ones. Per column
   * rather than a global default; unspecified columns open ascending.
   */
  firstDirection?: Partial<Record<Column, SortDirection>>;
}

/**
 * Search, sort and paging for a client-side list - the three pieces every
 * table on the console has, written once.
 *
 * Every filter setter goes back to the first page. A filter that narrows the
 * list from forty pages to two while the reader sits on page nine shows them
 * nothing, and "nothing" reads as "no results", not "wrong page".
 *
 * The sort cycle is three steps: the direction the column is useful in, its
 * reverse, then back to the list's own default. A reader who clicks around can
 * always get home without hunting for which header they started on.
 */
export function useTableQuery<Row, Column extends string>({
  rows,
  pageSize,
  filter,
  order,
  sort: initialSort,
  firstDirection = {},
}: Options<Row, Column>) {
  const [query, setQueryState] = useState("");
  const [sort, setSortState] = useState<SortState<Column>>(initialSort);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => filter(row, needle));
  }, [rows, query, filter]);

  const sorted = useMemo(() => {
    const direction = sort.descending ? -1 : 1;
    return [...filtered].sort((a, b) => order(a, b, sort.column) * direction);
  }, [filtered, order, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Clamped rather than corrected in an effect: a shrinking list would
  // otherwise render an empty page for one frame before snapping back.
  const current = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(
    current * pageSize,
    current * pageSize + pageSize,
  );

  const opens = (column: Column): boolean =>
    (firstDirection[column] ?? "asc") === "desc";

  function setQuery(value: string) {
    setQueryState(value);
    setPage(0);
  }

  /** Wraps a filter setter so changing it also returns to the first page. */
  function resetting<Args extends unknown[]>(setter: (...args: Args) => void) {
    return (...args: Args) => {
      setter(...args);
      setPage(0);
    };
  }

  function sortBy(column: Column) {
    const preferred = opens(column);
    setSortState((currentSort) => {
      if (currentSort.column !== column) {
        return { column, descending: preferred };
      }
      if (currentSort.descending === preferred) {
        return { column, descending: !preferred };
      }
      return initialSort;
    });
  }

  /** Jump straight to a column in its useful direction, for a sort picker. */
  function setSortColumn(column: Column) {
    setSortState({ column, descending: opens(column) });
    setPage(0);
  }

  return {
    query,
    setQuery,
    resetting,
    filtered,
    sorted,
    pageRows,
    page: current,
    pageCount,
    setPage,
    sort,
    sortBy,
    setSortColumn,
  };
}
