import { useState } from "react";
import { ScrollText, Search, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/common/data-table";
import { FilterSelect, PageHeader } from "@/components/common/filter-select";
import { auditLogService } from "@/services/audit-log.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime } from "@/utils/format";
import type { AuditAction, AuditLog, AuditModule } from "@/types";

export function AuditLogsPage() {
  const { version } = useAppState();
  const [q, setQ] = useState("");
  const [module, setModule] = useState<AuditModule | "ALL">("ALL");
  const [action, setAction] = useState<AuditAction | "ALL">("ALL");

  const logs = useAsync(
    () => auditLogService.list({ q, module, action }),
    [q, module, action, version],
  );

  const columns: Column<AuditLog>[] = [
    {
      id: "timestamp",
      header: "Timestamp",
      cell: (l) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDateTime(l.timestamp)}
        </span>
      ),
    },
    {
      id: "userName",
      header: "Actor",
      cell: (l) => (
        <div>
          <div className="font-medium text-foreground">{l.userName}</div>
          <div className="text-xs text-muted-foreground">{l.userRole}</div>
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (l) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground font-mono">
          {l.action}
        </span>
      ),
    },
    {
      id: "module",
      header: "Module",
      cell: (l) => <span className="text-xs font-medium text-muted-foreground">{l.module}</span>,
    },
    {
      id: "resourceId",
      header: "Resource ID",
      cell: (l) => <span className="font-mono text-xs">{l.resourceId}</span>,
    },
    {
      id: "result",
      header: "Result",
      cell: (l) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            l.result === "SUCCESS" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {l.result === "SUCCESS" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {l.result}
        </span>
      ),
    },
    {
      id: "details",
      header: "Details",
      cell: (l) => (
        <span className="text-xs text-muted-foreground truncate max-w-xs block">{l.details}</span>
      ),
    },
    {
      id: "ipAddress",
      header: "IP Address",
      cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.ipAddress}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Audit Logs"
        description="Immutable administrative and operational trail for security compliance and incident reviews"
      />

      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Search actor, resource ID, details..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-72"
          />
          <FilterSelect
            value={module}
            onChange={(v) => setModule(v as AuditModule | "ALL")}
            options={[
              { value: "ALL", label: "All modules" },
              { value: "EMPLOYEES", label: "Employees" },
              { value: "QR_CODES", label: "QR Codes" },
              { value: "ATTENDANCE", label: "Attendance" },
              { value: "GATES", label: "Gates" },
              { value: "REPORTS", label: "Reports" },
              { value: "SETTINGS", label: "Settings" },
              { value: "AUTH", label: "Auth" },
            ]}
          />
          <FilterSelect
            value={action}
            onChange={(v) => setAction(v as AuditAction | "ALL")}
            options={[
              { value: "ALL", label: "All actions" },
              { value: "CREATE", label: "Create" },
              { value: "UPDATE", label: "Update" },
              { value: "DELETE", label: "Delete" },
              { value: "LOGIN", label: "Login" },
              { value: "EXPORT", label: "Export" },
              { value: "GENERATE", label: "Generate" },
              { value: "REVOKE", label: "Revoke" },
              { value: "CONFIG_CHANGE", label: "Config Change" },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs.data ?? []}
        loading={logs.loading}
        rowKey={(l) => l.id}
        emptyMessage="No audit logs found matching criteria."
      />
    </div>
  );
}
