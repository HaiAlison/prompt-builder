import { useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { MoreHorizontal, UserPlus, Download, Eye, Pencil, Power } from "lucide-react";
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
import { DataTable, type Column } from "@/components/common/data-table";
import { EmployeeAvatar } from "@/components/common/employee-avatar";
import { EmploymentBadge, QrBadge } from "@/components/common/status-badge";
import { FilterSelect, PageHeader } from "@/components/common/filter-select";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { EmployeeDetailDrawer } from "@/components/employees/employee-detail-drawer";
import { employeeService, type EmployeeRow } from "@/services/employee.service";
import { systemService } from "@/services/system.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import { downloadCsv } from "@/utils/csv";
import { EMPLOYMENT_STATUS_LABEL } from "@/utils/format";
import type { EmploymentStatus, FactoryFilter } from "@/types";

export function EmployeesPage() {
  const search = useSearch({ strict: false }) as { q?: string };
  const { factoryFilter: globalFactory, version } = useAppState();
  const [q, setQ] = useState(search.q ?? "");
  const [factory, setFactory] = useState<FactoryFilter | "ALL">(globalFactory);
  const [department, setDepartment] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [detail, setDetail] = useState<EmployeeRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const departments = useAsync(() => systemService.listDepartments(), [version]);
  const employees = useAsync(
    () => employeeService.list({ q, factoryId: factory, departmentId: department, employmentStatus: status as EmploymentStatus | "ALL" }),
    [q, factory, department, status, version],
  );

  const depOptions = useMemo(
    () => [
      { value: "ALL", label: "All departments" },
      ...(departments.data ?? [])
        .filter((d) => factory === "ALL" || d.factoryId === factory)
        .map((d) => ({ value: d.id, label: `${d.name}${factory === "ALL" ? ` (${d.factoryId})` : ""}` })),
    ],
    [departments.data, factory],
  );

  async function toggleActive(row: EmployeeRow) {
    const next: EmploymentStatus = row.employmentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await employeeService.setStatus(row.id, next);
    toast.success(`${row.fullName} is now ${EMPLOYMENT_STATUS_LABEL[next]}`);
  }

  function exportCsv() {
    const rows = employees.data ?? [];
    downloadCsv(
      `tmc-employees-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Employee ID", "Full Name", "Department", "Position", "Factory", "Email", "Phone", "Employment Status", "QR Status"],
      rows.map((r) => [r.id, r.fullName, r.departmentName, r.position, r.factoryId, r.email, r.phone, r.employmentStatus, r.qrStatus ?? ""]),
    );
    toast.success(`Exported ${rows.length} employees to CSV`);
  }

  const columns: Column<EmployeeRow>[] = [
    { key: "id", header: "Employee ID", render: (r) => <span className="font-mono text-xs">{r.id}</span>, sort: (r) => r.id },
    {
      key: "name",
      header: "Full Name",
      render: (r) => (
        <span className="flex items-center gap-2">
          <EmployeeAvatar name={r.fullName} />
          <span className="font-medium">{r.fullName}</span>
        </span>
      ),
      sort: (r) => r.fullName,
    },
    { key: "dept", header: "Department", render: (r) => r.departmentName, sort: (r) => r.departmentName },
    { key: "pos", header: "Position", render: (r) => r.position },
    { key: "factory", header: "Factory", render: (r) => (r.factoryId === "BD" ? "Binh Duong" : "Long An"), sort: (r) => r.factoryId },
    { key: "email", header: "Email", render: (r) => <span className="text-xs">{r.email}</span> },
    { key: "phone", header: "Phone", render: (r) => <span className="text-xs tabular-nums">{r.phone}</span> },
    { key: "status", header: "Status", render: (r) => <EmploymentBadge status={r.employmentStatus} />, sort: (r) => r.employmentStatus },
    { key: "qr", header: "QR Status", render: (r) => (r.qrStatus ? <QrBadge status={r.qrStatus} /> : <span className="text-xs text-muted-foreground">—</span>) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${r.fullName}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setDetail(r); setDetailOpen(true); }}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditing(r); setFormOpen(true); }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toggleActive(r)}>
              <Power className="mr-2 h-4 w-4" />
              {r.employmentStatus === "ACTIVE" ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Employee Management"
        description="1,400+ employees across Binh Duong and Long An factories"
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <UserPlus className="h-4 w-4" /> Create Employee
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={employees.data ?? []}
        rowKey={(r) => r.id}
        loading={employees.loading}
        pageSize={10}
        toolbar={
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Search</p>
              <Input
                placeholder="Employee ID or name…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 w-60"
              />
            </div>
            <FilterSelect
              label="Factory"
              value={factory}
              onChange={(v) => { setFactory(v as FactoryFilter); setDepartment("ALL"); }}
              options={[
                { value: "ALL", label: "All factories" },
                { value: "BD", label: "Binh Duong" },
                { value: "LA", label: "Long An" },
              ]}
            />
            <FilterSelect label="Department" value={department} onChange={setDepartment} options={depOptions} />
            <FilterSelect
              label="Employment status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "ALL", label: "All statuses" },
                ...(["ACTIVE", "PROBATION", "ON_LEAVE", "SUSPENDED", "TERMINATED"] as const).map((s) => ({
                  value: s,
                  label: EMPLOYMENT_STATUS_LABEL[s],
                })),
              ]}
            />
          </div>
        }
      />

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={() => employees.reload()}
      />
      <EmployeeDetailDrawer employee={detail} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
