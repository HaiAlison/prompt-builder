import { useState, useEffect } from "react";
import { Settings2, Users, Shield, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/filter-select";
import { systemService } from "@/services/system.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import type { SystemConfig, SystemUser } from "@/types";

export function SettingsPage() {
  const { version } = useAppState();
  const [tab, setTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const configQuery = useAsync(() => systemService.getConfig(), [version]);
  const usersQuery = useAsync(() => systemService.listUsers(), [version]);

  const [form, setForm] = useState<Partial<SystemConfig>>({});

  useEffect(() => {
    if (configQuery.data) {
      setForm(configQuery.data);
    }
  }, [configQuery.data]);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await systemService.updateConfig(form);
      toast.success("System configuration saved successfully");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  const userColumns: Column<SystemUser>[] = [
    { id: "id", header: "User ID", cell: (u) => <span className="font-mono text-xs">{u.id}</span> },
    {
      id: "name",
      header: "Name & Email",
      cell: (u) => (
        <div>
          <div className="font-medium">{u.name}</div>
          <div className="text-xs text-muted-foreground">{u.email}</div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Assigned Role",
      cell: (u) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold">
          {u.role}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (u) => (
        <span
          className={`text-xs font-semibold ${u.status === "ACTIVE" ? "text-emerald-600" : "text-rose-600"}`}
        >
          {u.status}
        </span>
      ),
    },
    {
      id: "lastLogin",
      header: "Last Login",
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="System Settings"
        description="Configure shift timings, QR expiration rules, and administrative role accounts"
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Settings2 className="h-4 w-4" /> General Parameters
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" /> System Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSaveConfig}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Operational Shift & QR Rules</CardTitle>
                <CardDescription>
                  Define company-wide shift parameters and access control security tolerances.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="shiftStart">Standard Shift Start (HH:MM)</Label>
                    <Input
                      id="shiftStart"
                      value={form.shiftStart ?? "07:30"}
                      onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lateThreshold">Late Grace Threshold (Minutes)</Label>
                    <Input
                      id="lateThreshold"
                      type="number"
                      value={form.lateThresholdMinutes ?? 15}
                      onChange={(e) =>
                        setForm({ ...form, lateThresholdMinutes: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="qrValidity">Permanent QR Validity (Days)</Label>
                    <Input
                      id="qrValidity"
                      type="number"
                      value={form.employeeQrValidityDays ?? 90}
                      onChange={(e) =>
                        setForm({ ...form, employeeQrValidityDays: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ttlSeconds">Dynamic Mobile QR TTL (Seconds)</Label>
                    <Input
                      id="ttlSeconds"
                      type="number"
                      value={form.dynamicQrTtlSeconds ?? 30}
                      onChange={(e) =>
                        setForm({ ...form, dynamicQrTtlSeconds: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="timezone">System Timezone</Label>
                    <Input
                      id="timezone"
                      value={form.timezone ?? "Asia/Ho_Chi_Minh"}
                      onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="exportDay">Monthly Payroll Cutoff Day</Label>
                    <Input
                      id="exportDay"
                      type="number"
                      value={form.monthlyExportDay ?? 25}
                      onChange={(e) =>
                        setForm({ ...form, monthlyExportDay: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button type="submit" disabled={saving} className="gap-1.5">
                  <Save className="h-4 w-4" /> Save Configuration
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="users">
          <DataTable
            columns={userColumns}
            data={usersQuery.data ?? []}
            loading={usersQuery.loading}
            rowKey={(u) => u.id}
            emptyMessage="No system users found."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
