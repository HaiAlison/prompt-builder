import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsUpDown, SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sort?: (row: T) => string | number;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  emptyHint?: string;
  toolbar?: ReactNode;
  initialSort?: { id: string; dir: "asc" | "desc" };
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  pageSize = 10,
  loading = false,
  emptyMessage = "No records found",
  emptyHint = "Try adjusting your search or filters.",
  toolbar,
  initialSort,
}: DataTableProps<T>) {
  const [sortId, setSortId] = useState<string | null>(initialSort?.id ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSort?.dir ?? "asc");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);

  useEffect(() => {
    setPage(1);
  }, [data, size]);

  const sorted = useMemo(() => {
    if (!sortId) return data;
    const col = columns.find((c) => c.id === sortId);
    if (!col?.sort) return data;
    const out = [...data].sort((a, b) => {
      const va = col.sort!(a);
      const vb = col.sort!(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [data, columns, sortId, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / size));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * size, safePage * size);

  function toggleSort(col: Column<T>) {
    if (!col.sort) return;
    if (sortId === col.id) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortId(col.id);
      setSortDir("asc");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.id} className={col.className}>
                  {col.sort ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {col.header}
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  ) : (
                    <span className="font-medium text-muted-foreground">{col.header}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-4 w-[72%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <SearchX className="h-8 w-8 opacity-50" />
                    <p className="font-medium text-foreground">{emptyMessage}</p>
                    <p className="text-sm">{emptyHint}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.id} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!loading && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {(safePage - 1) * size + 1}–{Math.min(safePage * size, sorted.length)} of{" "}
              {sorted.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
