import { Building2, UserCheck, UserX, Users, LogIn, LogOut, ShieldX } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/filter-select";
import { EventTypeBadge, TransactionBadge } from "@/components/common/status-badge";
import { ScanSimulatorDialog } from "@/components/attendance/scan-simulator";
import { attendanceService } from "@/services/attendance.service";
import { useAppState } from "@/store/app-state";
import { useAsync, useIsClient } from "@/hooks/use-async";
import { formatDateTime, formatNumber } from "@/utils/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DIST_COLORS = ["var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--chart-3)"];

export function DashboardPage() {
  const { factoryFilter, version } = useAppState();
  const isClient = useIsClient();
  const { data, loading } = useAsync(() => attendanceService.getDashboard(factoryFilter), [factoryFilter, version]);

  const kpis = data?.kpis;
  const scopeLabel = factoryFilter === "ALL" ? "All factories" : factoryFilter === "BD" ? "Binh Duong" : "Long An";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        description={`Attendance & access overview · ${scopeLabel}`}
        actions={<ScanSimulatorDialog />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard icon={Users} label="Total Employees" value={formatNumber(kpis?.totalEmployees ?? 0)} loading={loading} />
        <KpiCard icon={UserCheck} label="Present Today" value={formatNumber(kpis?.presentToday ?? 0)} tone="success" loading={loading} />
        <KpiCard icon={UserX} label="Absent Today" value={formatNumber(kpis?.absentToday ?? 0)} tone="destructive" loading={loading} />
        <KpiCard icon={Building2} label="Currently Inside" value={formatNumber(kpis?.insideNow ?? 0)} tone="info" loading={loading} />
        <KpiCard icon={LogIn} label="Check-ins Today" value={formatNumber(kpis?.checkInsToday ?? 0)} loading={loading} />
        <KpiCard icon={LogOut} label="Check-outs Today" value={formatNumber(kpis?.checkOutsToday ?? 0)} loading={loading} />
        <KpiCard icon={ShieldX} label="Access Denied" value={formatNumber(kpis?.deniedToday ?? 0)} tone="warning" loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Attendance Overview</CardTitle>
            <CardDescription>Daily check-in vs check-out, last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isClient && data && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="checkIns" name="Check-ins" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="checkOuts" name="Check-outs" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Distribution</CardTitle>
            <CardDescription>Today · {scopeLabel}</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isClient && data && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.distribution.map((_, i) => (
                      <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Factory Comparison</CardTitle>
            <CardDescription>Attendance rate today</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {isClient && data && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.factoryComparison} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="factoryName" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="attendanceRate" name="Attendance rate" fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {data && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                {data.factoryComparison.map((f) => (
                  <div key={f.factoryId} className="rounded-md bg-muted/60 p-2">
                    <p className="font-semibold text-foreground">{f.factoryName}</p>
                    <p className="text-muted-foreground">{formatNumber(f.checkIns)} check-ins</p>
                    <p className="text-muted-foreground">{f.denied} denied</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Access Events</CardTitle>
            <CardDescription>Latest successful and denied transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-9 animate-pulse rounded bg-muted/70" />)}
              {data?.recentEvents.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2 text-sm">
                  <EventTypeBadge type={tx.eventType} />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{tx.employeeName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{tx.employeeId}</span>
                  </span>
                  <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground md:block">{tx.gateName}</span>
                  <span className="hidden text-xs text-muted-foreground lg:block">{formatDateTime(tx.timestamp)}</span>
                  <TransactionBadge status={tx.status} />
                </div>
              ))}
              {!loading && data && data.recentEvents.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No access events today yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: use <span className="font-medium">Simulate Gate Scan</span> to walk through the check-in workflow and the
        denial scenarios (expired, revoked, unknown QR, inactive employee, unauthorized gate).
      </p>
      <Button asChild variant="ghost" className="hidden" />
    </div>
  );
}
