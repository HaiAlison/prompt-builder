import { useMemo, useState } from "react";
import { MoreHorizontal, QrCode as QR, RefreshCw, Ban, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/common/data-table";
import { QrBadge } from "@/components/common/status-badge";
import { FilterSelect, PageHeader } from "@/components/common/filter-select";
import { QrDetailDialog } from "@/components/qr/qr-detail-dialog";
import { qrCodeService } from "@/services/qr-code.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import { QR_STATUS_LABEL, formatDate } from "@/utils/format";
import type { FactoryFilter, QrCode, QrStatus } from "@/types";

export function QrCodesPage() {
  const { factoryFilter: globalFactory, version } = useAppState();
  const [q, setQ] = useState("");
  const [factory, setFactory] = useState<FactoryFilter | "ALL">(globalFactory);
  const [status, setStatus] = useState("ALL");
  const [detail, setDetail] = useState<QrCode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [genQuery, setGenQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const codes = useAsync(
    () => qrCodeService.list({ q, factoryId: factory, status: status as QrStatus | "ALL" }),
    [q, factory, status, version],
  );

  const genMatches = useMemo(() => {
    const query = genQuery.trim().toLowerCase();
    if (!query) return [];
    return (codes.data ?? [])
      .filter(
        (c) =>
          c.employeeId.toLowerCase().includes(query) ||
          c.employeeName.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [genQuery, codes.data]);

  async function generateFor(employeeId: string) {
    setBusy(true);
    try {
      const created = await qrCodeService.generateForEmployee(employeeId);
      toast.success(`QR code ${created.id} generated — previous active code was revoked`);
      setGenOpen(false);
      setGenQuery("");
      codes.reload();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(code: QrCode) {
    await qrCodeService.revoke(code.id);
    toast.success(`QR code ${code.id} revoked`);
    codes.reload();
  }

  async function regenerate(code: QrCode) {
    const fresh = await qrCodeService.regenerate(code.id);
    toast.success(`New QR code ${fresh.id} issued`);
    codes.reload();
  }

  const columns: Column<QrCode>[] = [
    {
      id: "empId",
      header: "Employee ID",
      cell: (r) => <span className="font-mono text-xs">{r.employeeId}</span>,
      sort: (r) => r.employeeId,
    },
    {
      id: "name",
      header: "Employee Name",
      cell: (r) => <span className="font-medium">{r.employeeName}</span>,
      sort: (r) => r.employeeName,
    },
    {
      id: "qrId",
      header: "QR Code ID",
      cell: (r) => <span className="font-mono text-xs">{r.id}</span>,
      sort: (r) => r.id,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <QrBadge status={r.status} />,
      sort: (r) => r.status,
    },
    {
      id: "created",
      header: "Created At",
      cell: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span>,
      sort: (r) => r.createdAt,
    },
    {
      id: "expires",
      header: "Expiration Date",
      cell: (r) => <span className="text-xs">{formatDate(r.expiresAt)}</span>,
      sort: (r) => r.expiresAt,
    },
    {
      id: "used",
      header: "Last Used At",
      cell: (r) => (
        <span className="text-xs">{r.lastUsedAt ? formatDate(r.lastUsedAt) : "Never"}</span>
      ),
      sort: (r) => r.lastUsedAt ?? "",
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`Actions for ${r.id}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setDetail(r);
                setDetailOpen(true);
              }}
            >
              <QR className="mr-2 h-4 w-4" /> View QR code
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => regenerate(r)} disabled={busy}>
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => revoke(r)}
              disabled={r.status === "REVOKED"}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" /> Revoke
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="QR Code Management"
        description="Employee access codes — payloads are opaque rotating tokens, ready for time-limited QR codes"
        actions={
          <Button onClick={() => setGenOpen(true)}>
            <Plus className="h-4 w-4" /> Generate QR Code
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={codes.data ?? []}
        rowKey={(r) => r.id}
        loading={codes.loading}
        pageSize={10}
        toolbar={
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Search</p>
              <Input
                placeholder="Employee, name or QR ID…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 w-60"
              />
            </div>
            <FilterSelect
              label="Factory"
              value={factory}
              onChange={(v) => setFactory(v as FactoryFilter)}
              options={[
                { value: "ALL", label: "All factories" },
                { value: "BD", label: "Binh Duong" },
                { value: "LA", label: "Long An" },
              ]}
            />
            <FilterSelect
              label="QR status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "ALL", label: "All statuses" },
                ...(["ACTIVE", "EXPIRED", "REVOKED", "SUSPENDED"] as const).map((s) => ({
                  value: s,
                  label: QR_STATUS_LABEL[s],
                })),
              ]}
            />
          </div>
        }
      />

      <QrDetailDialog code={detail} open={detailOpen} onOpenChange={setDetailOpen} />

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate QR Code</DialogTitle>
            <DialogDescription>
              Issues a fresh code for an employee. Any previously active code is revoked
              automatically.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search employee by ID or name…"
            value={genQuery}
            onChange={(e) => setGenQuery(e.target.value)}
          />
          <div className="rounded-md border">
            {genQuery && genMatches.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                No employee matches “{genQuery}”.
              </p>
            )}
            {genMatches.map((m) => (
              <div
                key={m.employeeId}
                className="flex items-center gap-2 border-b px-3 py-2 text-sm last:border-0"
              >
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{m.employeeName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.employeeId}</span>
                </span>
                <Button size="sm" disabled={busy} onClick={() => generateFor(m.employeeId)}>
                  Generate
                </Button>
              </div>
            ))}
            {!genQuery && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                Start typing to find an employee.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
