import { useMemo, useState } from "react";
import { toast } from "sonner";
import QRCodeReact from "react-qr-code";
import { ScanLine, WifiOff, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrBadge, TransactionBadge, EventTypeBadge } from "@/components/common/status-badge";
import { EmployeeAvatar } from "@/components/common/employee-avatar";
import { attendanceService } from "@/services/attendance.service";
import { qrCodeService } from "@/services/qr-code.service";
import { GATES } from "@/mocks/gates";
import { useAppState } from "@/store/app-state";
import { formatDateTime, EVENT_TYPE_LABEL, DENIAL_REASON_LABEL } from "@/utils/format";
import type { AttendanceTransaction, EventType, GateStation, ScanResult } from "@/types";
import { useEmployee } from "@/hooks/use-employee";

/**
 * Simulates a security scanner at a gate: pick a person + gate + event and the
 * service validates the QR exactly like the future backend will. Includes
 * one-click bad-scenario chips (expired/revoked/unknown/inactive employee).
 */
export function ScanSimulatorDialog({ children, gates, defaultGateId, }: { children?: React.ReactNode, defaultGateId?: string, gates: GateStation[] }) {
  const { network, version } = useAppState();
  const [open, setOpen] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [gateId, setGateId] = useState<string>(defaultGateId || "");
  const [eventType, setEventType] = useState<EventType>("CHECK_IN");
  const [payloadOverride, setPayloadOverride] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const { employees } = useEmployee();

  const matches = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return [];
    return (employees?.results ?? [])
      .filter((e) => e.code.toLowerCase().includes(q) || e.fullName.toLowerCase().includes(q))
      .slice(0, 5);
  }, [employeeQuery, employees?.results]);

  const selected = (employees?.results ?? []).find((e) => e.id === selectedEmployeeId);

  const scenarioChips: { label: string; employeeId: string | null; payload: string | null }[] = [
    { label: "Expired QR", employeeId: null, payload: "tmc://v1/bd/token-expired-sample" },
    { label: "Revoked QR", employeeId: null, payload: "tmc://v1/bd/token-revoked-sample" },
    {
      label: "Inactive employee",
      employeeId:
        (employees?.results ?? []).find(
          (e) => e.employmentStatus === "SUSPENDED" || e.employmentStatus === "TERMINATED",
        )?.id ?? null,
      payload: null,
    },
    { label: "Unknown QR", employeeId: null, payload: "TMCQR2|UNKNOWNFAKEPAYLOAD123456" },
    { label: "Unauthorized gate", employeeId: null, payload: null },
  ].filter((c) => c.employeeId || c.payload || c.label === "Unauthorized gate") as {
    label: string;
    employeeId: string | null;
    payload: string | null;
  }[];

  async function simulate() {
    if (!selectedEmployeeId && !payloadOverride) {
      toast.error("Select an employee or a failure scenario first.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      let payload = payloadOverride;
      if (!payload) {
        if (selectedEmployeeId) {
          const qr = await qrCodeService.getByEmployee(selectedEmployeeId);
          payload = qr?.payload ?? "tmc://v1/bd/no-qr-assigned";
        } else {
          payload = "tmc://v1/bd/no-qr-assigned";
        }
      }
      const res = await attendanceService.processScan({
        qrPayload: payload,
        gateId,
        eventType,
        offline: network === "OFFLINE",
      });
      setResult(res);
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.transaction) {
        setResult(errData);
      } else {
        toast.error(errData?.message || err?.message || "Failed to process scan");
      }
    } finally {
      setBusy(false);
    }
  }

  function pickScenario(chip: (typeof scenarioChips)[number]) {
    setPayloadOverride(chip.payload);
    setEmployeeQuery("");
    setSelectedEmployeeId(chip.employeeId);
    setResult(null);
    if (chip.label === "Unauthorized gate") {
      // Choose an EXIT-only gate with a CHECK_IN to trigger the gate rule denial.
      const exitGate = gates.find((g) => g.type === "EXIT");
      if (exitGate) {
        setGateId(exitGate.id);
        setEventType("CHECK_IN");
      }
      const activeEmp = (employees?.results ?? []).find(
        (e) => e.employmentStatus === "ACTIVE" || e.employmentStatus === "PROBATION",
      );
      if (activeEmp) {
        setSelectedEmployeeId(activeEmp.id);
      }
    }
  }

  const tx: AttendanceTransaction | null = result?.transaction ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setResult(null);
          setSelectedEmployeeId(null);
          setEmployeeQuery("");
          setPayloadOverride(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <ScanLine className="h-4 w-4" /> Simulate Gate Scan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Simulate access transaction</DialogTitle>
          <DialogDescription>
            Runs the full validation chain: QR validity → employee status → gate rules.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Employee (or bad-scenario chip)</Label>
            <div className="flex flex-wrap gap-1.5">
              {scenarioChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => pickScenario(chip)}
                  className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning transition-colors hover:bg-warning/20"
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="Search employee by ID or name…"
              value={selected ? `${selected.code} — ${selected.fullName}` : employeeQuery}
              onChange={(e) => {
                setEmployeeQuery(e.target.value);
                setSelectedEmployeeId(null);
                setPayloadOverride(null);
              }}
            />
            {matches.length > 0 && !selected && (
              <div className="rounded-md border bg-popover p-1">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedEmployeeId(m.id);
                      setEmployeeQuery("");
                      setPayloadOverride(null);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <EmployeeAvatar name={m.fullName} className="h-6 w-6" />
                    <span className="truncate">{m.fullName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{m.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5 min-w-0">
              <Label>Gate station</Label>
              <Select value={gateId} onValueChange={setGateId}>
                <SelectTrigger className="w-full min-w-0 [&>span]:truncate">
                  <SelectValue placeholder="Select gate" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                  {(gates ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id} className="cursor-pointer">
                      <span className="truncate">{g.code ? `${g.code} · ${g.name}` : `${g.id} · ${g.name}`}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 min-w-0">
              <Label>Event type</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECK_IN">Check-in</SelectItem>
                  <SelectItem value="CHECK_OUT">Check-out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {network === "OFFLINE" && (
            <p className="flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
              <WifiOff className="h-3.5 w-3.5" /> Gate network is offline — successful transactions
              will queue as PENDING for synchronization.
            </p>
          )}

          {tx && (
            <div
              className={`rounded-lg border p-3 ${tx.status === "SUCCESS" || tx.status === "PENDING"
                ? "border-success/30 bg-success/5"
                : "border-destructive/30 bg-destructive/5"
                }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                {tx.status === "SUCCESS" || tx.status === "PENDING" ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : tx.status === "FAILED" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                {result!.message}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Transaction</span>
                <span className="font-medium text-foreground">{tx.id}</span>
                <span>Employee</span>
                <span className="font-medium text-foreground">
                  {tx.employeeName}{" "}
                  {tx.employeeCode ? `(${tx.employeeCode})` : tx.employeeId ? `(${tx.employeeId})` : ""}
                </span>
                <span>Gate</span>
                <span className="font-medium text-foreground">{tx.gateName}</span>
                <span>Event</span>
                <span className="font-medium text-foreground">
                  {EVENT_TYPE_LABEL[tx.eventType]}
                </span>
                <span>Time</span>
                <span className="font-medium text-foreground">{formatDateTime(tx.timestamp)}</span>
                <span>QR validation</span>
                <span className="font-medium text-foreground">{tx.qrValidation}</span>
                <span>Status</span>
                <span className="mt-0.5">
                  <TransactionBadge status={tx.status} />
                </span>
                {tx.denialReason && (
                  <>
                    <span>Reason</span>
                    <span className="font-medium text-foreground">
                      {(DENIAL_REASON_LABEL as Record<string, string>)[tx.denialReason] || tx.denialReason}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={simulate} disabled={busy}>
            <ScanLine className="h-4 w-4" />
            {busy ? "Validating…" : "Scan QR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
