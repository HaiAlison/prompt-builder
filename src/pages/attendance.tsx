import { useMemo, useState } from "react";
import { Download, RefreshCcw, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/common/data-table";
import { DenialBadge, EventTypeBadge, TransactionBadge } from "@/components/common/status-badge";
import { FilterSelect, PageHeader } from "@/components/common/filter-select";
import { ScanSimulatorDialog } from "@/components/attendance/scan-simulator";
import { attendanceService } from "@/services/attendance.service";
import { gateService } from "@/services/gate.service";
import { systemService } from "@/services/system.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import { downloadCsv } from "@/utils/csv";
import {
  ATTENDANCE_STATUS_LABEL,
  TRANSACTION_STATUS_LABEL,
  formatDateTime,
  formatDate,
  formatDuration,
  formatTime,
  formatNumber,
} from "@/utils/format";
import type { AttendanceTransaction, DailySummary, EventType, TransactionStatus } from "@/types";

export function AttendancePage() {
  const { factoryFilter: globalFactory, version } = useAppState();
  const [tab, setTab] = useState("transactions");
  const [q, setQ] = useState("");
  const [factory, setFactory] = useState(globalFactory);
  const [department, setDepartment] = useState("ALL");
  const [gateId, setGateId] = useState("ALL");
  const [eventType, setEventType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<AttendanceTransaction | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const gates = useAsync(() => gateService.list(), []);
  const departments = useAsync(() => systemService.listDepartments(), [version]);
  const transactions = useAsync(
    () =>
      attendanceService.listTransactions({
        q,
        factoryId: factory,
        departmentId: department,
        gateId,
        eventType: eventType as EventType | "ALL",
        status: status as TransactionStatus | "ALL",
        from: from || undefined,
        to: to || undefined,
      }),
    [q, factory, department, gateId, eventType, status, from, to, version],
  );
  const summaries = useAsync(
    () =>
      attendanceService.listDailySummaries({
        date,
        factoryId: factory,
        departmentId: department,
        q,
      }),
    [date, factory, department, q, version],
  );
  const sync = useAsync(
    () => Promise.all([attendanceService.listPendingSync(), attendanceService.syncStats()]),
    [version],
  );

  const gateOptions = useMemo(
    () => [
      { value: "ALL", label: "All gates" },
      ...(gates.data ?? []).map((g) => ({ value: g.id, label: `${g.id} · ${g.name}` })),
    ],
    [gates.data],
  );

  function exportTransactions() {
    const rows = transactions.data ?? [];
    downloadCsv(
      `tmc-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Transaction ID",
        "Employee ID",
        "Employee Name",
        "Factory",
        "Gate",
        "Event Type",
        "Timestamp",
        "QR Validation",
        "Status",
        "Error",
      ],
      rows.map((t) => [
        t.id,
        t.employeeId,
        t.employeeName,
        t.factoryId,
        t.gateName,
        t.eventType,
        t.timestamp,
        t.qrValidation,
        t.status,
        t.errorMessage ?? "",
      ]),
    );
    toast.success(`Exported ${rows.length} transactions to CSV`);
  }

  const txColumns: Column<AttendanceTransaction>[] = [
    {
      key: "id",
      header: "Transaction ID",
      render: (t) => <span className="font-mono text-xs">{t.id}</span>,
      sort: (t) => t.id,
    },
    {
      key: "emp",
      header: "Employee",
      render: (t) => (
        <span>
          <span className="font-medium">{t.employeeName}</span>
          <span className="ml-2 text-xs text-muted-foreground">{t.employeeId}</span>
        </span>
      ),
      sort: (t) => t.employeeName,
    },
    {
      key: "factory",
      header: "Factory",
      render: (t) => (t.factoryId === "BD" ? "Binh Duong" : "Long An"),
    },
    {
      key: "gate",
      header: "Gate Station",
      render: (t) => <span className="text-xs">{t.gateName}</span>,
    },
    { key: "event", header: "Event Type", render: (t) => <EventTypeBadge type={t.eventType} /> },
    {
      key: "time",
      header: "Timestamp",
      render: (t) => <span className="text-xs tabular-nums">{formatDateTime(t.timestamp)}</span>,
      sort: (t) => t.timestamp,
    },
    {
      key: "qr",
      header: "QR Validation",
      render: (t) => <span className="text-xs">{t.qrValidation}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <TransactionBadge status={t.status} />,
      sort: (t) => t.status,
    },
    {
      key: "view",
      header: "",
      render: (t) => (
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetail(t)}>
          View
        </Button>
      ),
    },
  ];

  const sumColumns: Column<DailySummary>[] = [
    {
      key: "emp",
      header: "Employee",
      render: (s) => (
        <span>
          <span className="font-medium">{s.employeeName}</span>
          <span className="ml-2 text-xs text-muted-foreground">{s.employeeId}</span>
        </span>
      ),
      sort: (s) => s.employeeName,
    },
    {
      key: "in",
      header: "First Check-in",
      render: (s) => (
        <span className="tabular-nums">{s.firstCheckIn ? formatTime(s.firstCheckIn) : "—"}</span>
      ),
    },
    {
      key: "out",
      header: "Last Check-out",
      render: (s) => (
        <span className="tabular-nums">{s.lastCheckOut ? formatTime(s.lastCheckOut) : "—"}</span>
      ),
    },
    {
      key: "dur",
      header: "Working Duration",
      render: (s) => <span className="tabular-nums">{formatDuration(s.workedMinutes)}</span>,
      sort: (s) => s.workedMinutes,
    },
    {
      key: "status",
      header: "Attendance Status",
      render: (s) => (<TransactionBadge status={s.status} />) as never,
    },
    {
      key: "late",
      header: "Late Duration",
      render: (s) => <span className="tabular-nums">{formatDuration(s.lateMinutes)}</span>,
      sort: (s) => s.lateMinutes,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Attendance Management"
        description="Gate transactions, daily summaries and offline synchronization"
        actions={
          <>
            <Button variant="outline" onClick={exportTransactions}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <ScanSimulatorDialog />
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="summary">Daily Summary</TabsTrigger>
          <TabsTrigger value="sync">Sync Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <DataTable
            columns={txColumns}
            rows={transactions.data ?? []}
            rowKey={(t) => t.id}
            loading={transactions.loading}
            pageSize={15}
            toolbar={
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Search employee
                  </p>
                  <Input
                    placeholder="ID, name, transaction…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="h-9 w-56"
                  />
                </div>
                <FilterSelect
                  label="Factory"
                  value={factory}
                  onChange={(v) => setFactory(v as typeof factory)}
                  options={[
                    { value: "ALL", label: "All factories" },
                    { value: "BD", label: "Binh Duong" },
                    { value: "LA", label: "Long An" },
                  ]}
                />
                <FilterSelect
                  label="Department"
                  value={department}
                  onChange={setDepartment}
                  options={[
                    { value: "ALL", label: "All departments" },
                    ...(departments.data ?? [])
                      .filter((d) => factory === "ALL" || d.factoryId === factory)
                      .map((d) => ({ value: d.id, label: d.name })),
                  ]}
                />
                <FilterSelect
                  label="Gate station"
                  value={gateId}
                  onChange={setGateId}
                  options={gateOptions}
                />
                <FilterSelect
                  label="Event type"
                  value={eventType}
                  onChange={setEventType}
                  options={[
                    { value: "ALL", label: "All events" },
                    { value: "CHECK_IN", label: "Check-in" },
                    { value: "CHECK_OUT", label: "Check-out" },
                  ]}
                />
                <FilterSelect
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "ALL", label: "All statuses" },
                    ...(["SUCCESS", "DENIED", "PENDING", "FAILED"] as const).map((s) => ({
                      value: s,
                      label: TRANSACTION_STATUS_LABEL[s],
                    })),
                  ]}
                />
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">From</p>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-9 w-36"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">To</p>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-9 w-36"
                  />
                </div>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Date</p>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <FilterSelect
              label="Factory"
              value={factory}
              onChange={(v) => setFactory(v as typeof factory)}
              options={[
                { value: "ALL", label: "All factories" },
                { value: "BD", label: "Binh Duong" },
                { value: "LA", label: "Long An" },
              ]}
            />
            <FilterSelect
              label="Department"
              value={department}
              onChange={setDepartment}
              options={[
                { value: "ALL", label: "All departments" },
                ...(departments.data ?? [])
                  .filter((d) => factory === "ALL" || d.factoryId === factory)
                  .map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Search</p>
              <Input
                placeholder="Employee…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 w-56"
              />
            </div>
          </div>
          <DataTable
            columns={sumColumns}
            rows={summaries.data ?? []}
            rowKey={(s) => s.employeeId}
            loading={summaries.loading}
            pageSize={15}
            emptyMessage="No attendance data for this date"
          />
        </TabsContent>

        <TabsContent value="sync" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <SyncCard
              label="Pending transactions"
              value={sync.data?.[1].pending ?? 0}
              tone="warning"
            />
            <SyncCard
              label="Synchronized"
              value={formatNumber(sync.data?.[1].synced ?? 0)}
              tone="success"
            />
            <SyncCard
              label="Failed synchronization"
              value={sync.data?.[1].failed ?? 0}
              tone="destructive"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Transactions captured while gates are offline wait here until connectivity returns.
            </p>
            <Button
              size="sm"
              onClick={async () => {
                const n = await attendanceService.syncAllPending();
                toast.success(`${n} transactions synchronized`);
                sync.reload();
              }}
            >
              <RefreshCw className="h-4 w-4" /> Sync all
            </Button>
          </div>
          <div className="mt-3 divide-y rounded-lg border bg-card">
            {(sync.data?.[0] ?? []).map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                <span className="min-w-0 flex-1 truncate">
                  {t.employeeName}{" "}
                  <span className="text-xs text-muted-foreground">· {t.gateName}</span>
                </span>
                <EventTypeBadge type={t.eventType} />
                <span className="hidden text-xs text-muted-foreground md:block">
                  {formatDateTime(t.timestamp)}
                </span>
                <TransactionBadge status={t.status} />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={async () => {
                    await attendanceService.retrySync(t.id);
                    toast.success(
                      t.status === "PENDING"
                        ? `${t.id} synchronized`
                        : `${t.id} marked for manual review`,
                    );
                    sync.reload();
                  }}
                >
                  <RefreshCcw className="h-3 w-3" /> Retry
                </Button>
              </div>
            ))}
            {(sync.data?.[0] ?? []).length === 0 && !sync.loading && (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Info className="h-4 w-4" /> Queue is empty — everything is synchronized.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <TransactionDetailDialog tx={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function SyncCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "success" | "destructive";
}) {
  const color =
    tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-destructive";
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function TransactionDetailDialog({
  tx,
  onClose,
}: {
  tx: AttendanceTransaction | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!tx} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{tx?.id}</DialogTitle>
          <DialogDescription>Transaction detail</DialogDescription>
        </DialogHeader>
        {tx && (
          <div className="grid gap-x-6 gap-y-2 text-sm">
            <Row label="Employee" value={`${tx.employeeName} (${tx.employeeId})`} />
            <Row label="Factory" value={tx.factoryId === "BD" ? "Binh Duong" : "Long An"} />
            <Row label="Gate station" value={`${tx.gateId} · ${tx.gateName}`} />
            <Row label="Event type" value={<EventTypeBadge type={tx.eventType} />} />
            <Row label="Timestamp" value={formatDateTime(tx.timestamp)} />
            <Row label="QR validation" value={tx.qrValidation} />
            <Row label="Access decision" value={<TransactionBadge status={tx.status} />} />
            {tx.denialReason && (
              <Row label="Denial reason" value={<DenialBadge reason={tx.denialReason} />} />
            )}
            {tx.errorMessage && <Row label="Error message" value={tx.errorMessage} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
