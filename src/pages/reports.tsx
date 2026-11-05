import { useState } from "react";
import {
  Download,
  BarChart3,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/common/data-table";
import { FilterSelect, PageHeader } from "@/components/common/filter-select";
import { reportService } from "@/services/report.service";
import { systemService } from "@/services/system.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import { downloadCsv } from "@/utils/csv";
import { monthKey, formatNumber } from "@/utils/format";
import type {
  FactoryFilter,
  MonthlyAttendanceRow,
  FactoryReportRow,
  AccessControlReportRow,
  PayrollExport,
} from "@/types";

export function ReportsPage() {
  const { factoryFilter: globalFactory, user, version } = useAppState();
  const [tab, setTab] = useState("monthly");
  const [month, setMonth] = useState(monthKey(new Date().toISOString()));
  const [factory, setFactory] = useState<FactoryFilter | "ALL">(globalFactory);
  const [department, setDepartment] = useState("ALL");
  const [exporting, setExporting] = useState(false);

  const departments = useAsync(() => systemService.listDepartments(), [version]);

  const monthlyReport = useAsync(
    () => reportService.monthlyAttendance(month, factory, department),
    [month, factory, department, version],
  );

  const factoryReport = useAsync(() => reportService.factoryReport(month), [month, version]);

  const accessReport = useAsync(
    () => reportService.accessControlReport(month, factory),
    [month, factory, version],
  );

  const payrollExports = useAsync(() => reportService.exportHistory(), [version]);

  async function handleExportPayroll() {
    setExporting(true);
    try {
      await reportService.exportPayroll(month, user.name);
      toast.success(`Payroll export for ${month} generated successfully`);
    } catch {
      toast.error("Failed to generate payroll export");
    } finally {
      setExporting(false);
    }
  }

  function exportMonthlyCsv() {
    if (!monthlyReport.data) return;
    downloadCsv(
      `monthly-attendance-${month}.csv`,
      ['Employee ID', 'Full Name', 'Department', 'Factory', 'Working Days', 'Present Days', 'Late Days', 'Absent Days', 'Total Hours'],
      monthlyReport.data.map((r) => [
        r.employeeId,
        r.employeeName,
        r.departmentName,
        r.factoryId,
        r.workingDays,
        r.presentDays,
        r.lateDays,
        r.absentDays,
        r.totalHours,
      ]),
    );
  }

  const monthlyColumns: Column<MonthlyAttendanceRow>[] = [
    {
      id: "employeeId",
      header: "Employee ID",
      cell: (r) => <span className="font-mono text-xs font-semibold">{r.employeeId}</span>,
    },
    {
      id: "employeeName",
      header: "Full Name",
      cell: (r) => <span className="font-medium text-foreground">{r.employeeName}</span>,
    },
    {
      id: "departmentName",
      header: "Department",
      cell: (r) => <span className="text-muted-foreground">{r.departmentName}</span>,
    },
    {
      id: "factoryId",
      header: "Factory",
      cell: (r) => <span className="text-xs font-semibold uppercase">{r.factoryId}</span>,
    },
    { id: "workingDays", header: "Work Days", cell: (r) => r.workingDays },
    {
      id: "presentDays",
      header: "Present",
      cell: (r) => <span className="font-semibold text-emerald-600">{r.presentDays}</span>,
    },
    {
      id: "lateDays",
      header: "Late",
      cell: (r) => (
        <span className={r.lateDays > 0 ? "font-semibold text-amber-600" : "text-muted-foreground"}>
          {r.lateDays}
        </span>
      ),
    },
    {
      id: "absentDays",
      header: "Absent",
      cell: (r) => (
        <span
          className={r.absentDays > 0 ? "font-semibold text-rose-600" : "text-muted-foreground"}
        >
          {r.absentDays}
        </span>
      ),
    },
    { id: "totalHours", header: "Total Hours", cell: (r) => `${r.totalHours} hrs` },
  ];

  const accessColumns: Column<AccessControlReportRow>[] = [
    {
      id: "gateId",
      header: "Gate Station",
      cell: (r) => <span className="font-mono font-semibold">{r.gateId}</span>,
    },
    { id: "gateName", header: "Name", cell: (r) => r.gateName },
    { id: "factoryId", header: "Factory", cell: (r) => r.factoryId },
    {
      id: "totalTransactions",
      header: "Total Swipes",
      cell: (r) => <span className="font-semibold">{formatNumber(r.totalTransactions)}</span>,
    },
    {
      id: "successful",
      header: "Granted",
      cell: (r) => (
        <span className="font-semibold text-emerald-600">{formatNumber(r.successful)}</span>
      ),
    },
    {
      id: "denied",
      header: "Denied",
      cell: (r) => <span className="font-semibold text-rose-600">{formatNumber(r.denied)}</span>,
    },
  ];

  const payrollColumns: Column<PayrollExport>[] = [
    {
      id: "period",
      header: "Period",
      cell: (r) => <span className="font-mono font-semibold">{r.period}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> {r.status}
        </span>
      ),
    },
    { id: "records", header: "Records", cell: (r) => `${r.records} employees` },
    { id: "exportedBy", header: "Exported By", cell: (r) => r.exportedBy },
    {
      id: "exportedAt",
      header: "Export Time",
      cell: (r) => (r.exportedAt ? new Date(r.exportedAt).toLocaleString() : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reports & Analytics"
        description="Consolidated attendance statistics, factory comparisons, and payroll export records"
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly" className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" /> Monthly Attendance
          </TabsTrigger>
          <TabsTrigger value="factory" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Factory Overview
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Access Control
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-1.5">
            <Download className="h-4 w-4" /> Payroll Exports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                value={department}
                onChange={setDepartment}
                options={[
                  { value: "ALL", label: "All departments" },
                  ...(departments.data ?? []).map((d) => ({
                    value: d.id,
                    label: `${d.factoryId} - ${d.name}`,
                  })),
                ]}
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportMonthlyCsv} className="gap-1.5">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          <DataTable
            columns={monthlyColumns}
            data={monthlyReport.data ?? []}
            loading={monthlyReport.loading}
            rowKey={(r) => r.employeeId}
            emptyMessage="No attendance data for this period."
          />
        </TabsContent>

        <TabsContent value="factory" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(factoryReport.data ?? []).map((f) => (
              <Card key={f.factoryId}>
                <CardHeader>
                  <CardTitle className="text-base">{f.factoryName}</CardTitle>
                  <CardDescription>{f.employees} total registered employees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md border p-2">
                      <p className="text-xs text-muted-foreground">Attendance Rate</p>
                      <p className="mt-1 text-xl font-bold text-emerald-600">
                        {f.avgAttendanceRate}%
                      </p>
                    </div>
                    <div className="rounded-md border p-2">
                      <p className="text-xs text-muted-foreground">Present Days</p>
                      <p className="mt-1 text-xl font-bold">{f.presentDays}</p>
                    </div>
                    <div className="rounded-md border p-2">
                      <p className="text-xs text-muted-foreground">Late Days</p>
                      <p className="mt-1 text-xl font-bold text-amber-600">{f.lateDays}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Departments Rate
                    </h4>
                    <div className="space-y-2">
                      {f.departments.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span>{d.name}</span>
                          <span className="font-semibold">{d.attendanceRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <DataTable
            columns={accessColumns}
            data={accessReport.data ?? []}
            loading={accessReport.loading}
            rowKey={(r) => r.gateId}
            emptyMessage="No access report records."
          />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Generate full monthly attendance payroll dumps formatted for HR & Finance ERP
              ingestion.
            </p>
            <Button
              onClick={handleExportPayroll}
              disabled={exporting}
              size="sm"
              className="gap-1.5"
            >
              <Download className="h-4 w-4" /> Run Payroll Export ({month})
            </Button>
          </div>

          <DataTable
            columns={payrollColumns}
            data={payrollExports.data ?? []}
            loading={payrollExports.loading}
            rowKey={(r) => r.id}
            emptyMessage="No previous payroll exports found."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
