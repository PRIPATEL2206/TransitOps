"use client";

import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  /** Unique key matching a property of T, or a custom identifier */
  key: string;
  /** Column header label */
  header: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom render function for the cell */
  cell?: (row: T) => React.ReactNode;
  /** Additional className for the column header cell */
  headerClassName?: string;
  /** Additional className for body cells in this column */
  cellClassName?: string;
}

interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Row data */
  data: T[];
  /** Key extractor for React reconciliation */
  getRowKey: (row: T) => string | number;
  /** Whether data is loading */
  loading?: boolean;
  /** Whether to show the search input */
  searchable?: boolean;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Total number of rows (for server-side pagination) */
  totalCount?: number;
  /** Current page (1-indexed, for server-side pagination) */
  page?: number;
  /** Rows per page */
  pageSize?: number;
  /** Called when page changes */
  onPageChange?: (page: number) => void;
  /** Called when sort changes */
  onSortChange?: (key: string, direction: SortDirection) => void;
  /** Additional className for the table wrapper */
  className?: string;
  /** Node to render when there are no rows */
  emptyNode?: React.ReactNode;
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc") return <ChevronUp className="w-3 h-3 ml-1 inline" />;
  if (direction === "desc") return <ChevronDown className="w-3 h-3 ml-1 inline" />;
  return <ChevronsUpDown className="w-3 h-3 ml-1 inline opacity-40" />;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  totalCount,
  page = 1,
  pageSize = 10,
  onPageChange,
  onSortChange,
  className,
  emptyNode,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Client-side filtering when no external handler is provided
  const filteredData = useMemo(() => {
    if (!searchable || !search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = (row as Record<string, unknown>)[col.key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchable, columns]);

  // Client-side sorting when no external handler is provided
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir || onSortChange) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir, onSortChange]);

  // Client-side pagination when no external handler is provided
  const { pagedData, totalPages } = useMemo(() => {
    if (onPageChange && totalCount !== undefined) {
      // Server-driven pagination — use data as-is
      const pages = Math.max(1, Math.ceil(totalCount / pageSize));
      return { pagedData: sortedData, totalPages: pages };
    }
    // Client-driven pagination
    const pages = Math.max(1, Math.ceil(sortedData.length / pageSize));
    const start = (page - 1) * pageSize;
    return { pagedData: sortedData.slice(start, start + pageSize), totalPages: pages };
  }, [sortedData, page, pageSize, totalCount, onPageChange]);

  const handleSort = (key: string) => {
    let next: SortDirection;
    if (sortKey !== key) {
      next = "asc";
    } else if (sortDir === "asc") {
      next = "desc";
    } else if (sortDir === "desc") {
      next = null;
    } else {
      next = "asc";
    }
    setSortKey(next ? key : null);
    setSortDir(next);
    onSortChange?.(key, next);
  };

  const effectiveTotalCount = totalCount ?? sortedData.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search */}
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                    col.headerClassName
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable && (
                      <SortIcon direction={sortKey === col.key ? sortDir : null} />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pagedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  {emptyNode ?? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <span className="text-sm">No results found.</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((row) => (
                <TableRow key={getRowKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.cellClassName}>
                      {col.cell
                        ? col.cell(row)
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? "—"
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="text-muted-foreground">
            {effectiveTotalCount > 0
              ? `${Math.min((page - 1) * pageSize + 1, effectiveTotalCount)}–${Math.min(
                  page * pageSize,
                  effectiveTotalCount
                )} of ${effectiveTotalCount}`
              : "0 results"}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange ? onPageChange(page - 1) : undefined}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page number buttons — show up to 5 pages around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 1 && p <= page + 1)
              )
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={page === item ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange ? onPageChange(item) : undefined}
                    aria-label={`Page ${item}`}
                    aria-current={page === item ? "page" : undefined}
                  >
                    {item}
                  </Button>
                )
              )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange ? onPageChange(page + 1) : undefined}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
