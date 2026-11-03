import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { DoorOpen, Plus, ExternalLink, Activity, Power, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type Column } from "@/components/common/data-table";
import { GateBadge } from "@/components/common/status-badge";
import { FilterSelect, PageHeader } from "@/components/common/filter-select";
import { ScanSimulatorDialog } from "@/components/attendance/scan-simulator";
import { gateService } from "@/services/gate.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/utils/format";
import type { FactoryFilter, GateStation, GateStatus } from "@/types";

export function GatesPage() {
  const { factoryFilter: globalFactory, version } = useAppState();
  const [q, setQ] = useState("");
  const [factory, setFactory] = useState<FactoryFilter | "ALL">(globalFactory);
  const [status, setStatus] = useState<GateStatus | "ALL">("ALL");

  const gates = useAsync(
    () => gateService.list({ q, factoryId: factory, status }),
    [q, factory, status, version],
  );

  async function handleSetStatus(gateId: string, newStatus: GateStatus) {
    try {
      await gateService.setStatus(gateId, newStatus);
      toast.success(`Gate ${gateId} status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update gate status");
    }
  }

  const columns: Column<GateStation>[] = [
    {
      id: "id",
      header: "Gate ID",
      cell: (g) => (
        <Link
          to="/gates/$gateId"
          params={{ gateId: g.id }}
          className="font-mono font-semibold text-primary hover:underline flex items-center gap-1.5"
        >
          <DoorOpen className="h-4 w-4" />
          {g.id}
        </Link>
      ),
    },
    {
      id: "name",
      header: "Name & Location",
      cell: (g) => (
        <div>
          <div className="font-medium text-foreground">{g.name}</div>
          <div className="text-xs text-muted-foreground">{g.location}</div>
        </div>
      ),
    },
    {
      id: "factoryId",
      header: "Factory",
      cell: (g) => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {g.factoryId === "BD" ? "Bình Dương" : "Long An"}
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (g) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {g.type}
        </span>
      ),
    },
    {
      id: "controllerStatus",
      header: "Controller",
      cell: (g) => <GateBadge status={g.controllerStatus} />,
    },
    {
      id: "scannerStatus",
      header: "Scanner",
      cell: (g) => <GateBadge status={g.scannerStatus} />,
    },
    {
      id: "lastHeartbeat",
      header: "Last Heartbeat",
      cell: (g) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(g.lastHeartbeat)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (g) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Activity className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/gates/$gateId" params={{ gateId: g.id }}>
                <ExternalLink className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSetStatus(g.id, "ONLINE")}>
              <Power className="mr-2 h-4 w-4 text-emerald-600" /> Set Online
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSetStatus(g.id, "MAINTENANCE")}>
              <Wrench className="mr-2 h-4 w-4 text-amber-600" /> Maintenance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSetStatus(g.id, "OFFLINE")}>
              <Power className="mr-2 h-4 w-4 text-rose-600" /> Set Offline
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const total = gates.data?.length ?? 0;
  const onlineCount = gates.data?.filter((g) => g.controllerStatus === "ONLINE").length ?? 0;
  const offlineCount = gates.data?.filter((g) => g.controllerStatus === "OFFLINE").length ?? 0;
  const maintenanceCount =
    gates.data?.filter((g) => g.controllerStatus === "MAINTENANCE").length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Gate Stations"
        description="Monitor physical access gates, turnstiles, and QR barcode scanner telemetry"
        actions={<ScanSimulatorDialog />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Stations</p>
          <p className="mt-1 text-2xl font-bold">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Online & Active</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{onlineCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Offline</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{offlineCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">In Maintenance</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{maintenanceCount}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Search gate ID, name, location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-64"
          />
          <FilterSelect
            value={factory}
            onChange={(v) => setFactory(v as FactoryFilter | "ALL")}
            options={[
              { value: "ALL", label: "All factories" },
              { value: "BD", label: "Bình Dương (BD)" },
              { value: "LA", label: "Long An (LA)" },
            ]}
          />
          <FilterSelect
            value={status}
            onChange={(v) => setStatus(v as GateStatus | "ALL")}
            options={[
              { value: "ALL", label: "All statuses" },
              { value: "ONLINE", label: "Online" },
              { value: "OFFLINE", label: "Offline" },
              { value: "MAINTENANCE", label: "Maintenance" },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={gates.data ?? []}
        loading={gates.loading}
        rowKey={(g) => g.id}
        emptyMessage="No gate stations found matching the filter."
      />
    </div>
  );
}
