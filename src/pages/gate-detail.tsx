import { useParams, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  DoorOpen,
  Power,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GateBadge, EventTypeBadge, TransactionBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/common/filter-select";
import { ScanSimulatorDialog } from "@/components/attendance/scan-simulator";
import { gateService } from "@/services/gate.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/utils/format";
import type { GateStatus } from "@/types";

export function GateDetailPage() {
  const { gateId } = useParams({ strict: false }) as { gateId: string };
  const { version } = useAppState();

  const detail = useAsync(() => gateService.getById(gateId), [gateId, version]);

  async function handleSetStatus(newStatus: GateStatus) {
    try {
      await gateService.setStatus(gateId, newStatus);
      toast.success(`Gate ${gateId} status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  if (detail.loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading gate details...</p>
      </div>
    );
  }

  const gate = detail.data?.gate;
  if (!gate) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Gate Station Not Found</h2>
        <p className="text-sm text-muted-foreground">The station "{gateId}" does not exist.</p>
        <Button asChild variant="outline">
          <Link to="/gates">Back to Gates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/gates">
            <ArrowLeft className="h-4 w-4" /> Back to Gates
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${gate.name} (${gate.id})`}
        description={`Location: ${gate.location} · Factory: ${gate.factoryId === "BD" ? "Bình Dương" : "Long An"}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={gate.controllerStatus === "ONLINE" ? "outline" : "default"}
              size="sm"
              onClick={() =>
                handleSetStatus(gate.controllerStatus === "ONLINE" ? "OFFLINE" : "ONLINE")
              }
            >
              <Power className="mr-1.5 h-4 w-4" />
              {gate.controllerStatus === "ONLINE" ? "Take Offline" : "Turn Online"}
            </Button>
            <ScanSimulatorDialog defaultGateId={gate.id} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gate Type</CardDescription>
            <CardTitle className="text-xl">{gate.type}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Direction control mode
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Controller Status</CardDescription>
            <div className="pt-1">
              <GateBadge status={gate.controllerStatus} />
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Hardware PLC / IoT relay unit
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>QR Scanner Status</CardDescription>
            <div className="pt-1">
              <GateBadge status={gate.scannerStatus} />
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Barcode / optical scan head
          </CardContent>
        </Card>
      </div>

      {/* 7-day stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">7-Day Activity Summary</CardTitle>
          <CardDescription>Scan volume and denial counts over the last week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
            {detail.data?.dailyStats.map((s) => (
              <div key={s.date} className="flex flex-col rounded-md border p-3 text-center">
                <span className="text-xs font-medium text-muted-foreground">{s.date.slice(5)}</span>
                <span className="mt-1 text-lg font-bold">{s.transactions}</span>
                <span className="text-[11px] text-muted-foreground">
                  {s.denied > 0 ? (
                    <span className="text-rose-600 font-medium">{s.denied} denied</span>
                  ) : (
                    <span className="text-emerald-600">All clear</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent events at this gate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Events at this Station</CardTitle>
          <CardDescription>Latest access transactions passing through {gate.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {detail.data?.recentEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-3">
                  {e.status === "SUCCESS" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  )}
                  <div>
                    <span className="font-medium text-foreground">{e.employeeName}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {e.employeeId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EventTypeBadge type={e.eventType} />
                  <TransactionBadge status={e.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(e.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {detail.data?.recentEvents.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No recent events recorded at this gate.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
