import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { useAsync } from "@/hooks/use-async";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { employeeService } from "@/services/employee.service";
import { systemService } from "@/services/system.service";
import { useAppState } from "@/store/app-state";
import type { Employee, EmployeePayload, EmploymentStatus } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Employee | null;
  onSaved: () => void;
}

const EMPTY: EmployeePayload = {
  fullName: "",
  departmentId: "",
  position: "",
  factoryId: "",
  email: "",
  phone: "",
  employmentStatus: "PROBATION",
  hireDate: new Date().toISOString().slice(0, 10),
  dateOfBirth: "1995-01-01",
  gender: "M",
};

export function EmployeeFormDialog({ open, onOpenChange, editing, onSaved }: Props) {
  const { factoryFilter: globalFactory, version } = useAppState();
  const [form, setForm] = useState<EmployeePayload>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const departments = useAsync(() => systemService.listDepartments(), [version]);
  const factories = useAsync(() => systemService.listFactories(), [version]);

  useEffect(() => {
    if (open) {
      setErrors({});
      setServerError(null);
      if (editing) {
        const { id, code, departmentName, ...payload } = editing;
        setForm(payload);
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, editing]);

  function set<K extends keyof Omit<Employee, "id">>(key: K, value: Omit<Employee, "id">[K]) {
    setServerError(null);
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.fullName?.trim()) e['fullName'] = "Full name is required";
    if (!form.departmentId) e['departmentId'] = "Department is required";
    if (!form.position?.trim()) e['position'] = "Position is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email || '')) e['email'] = "Valid email is required";
    if (!/^[+\d][\d\s-]{7,}$/.test(form.phone || '')) e['phone'] = "Valid phone number is required";
    if (!form.hireDate) e['hireDate'] = "Hire date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setBusy(true);
    setServerError(null);
    try {
      if (editing) {
        const dirtyFields = Object.keys(form).reduce<Partial<EmployeePayload>>((acc, key) => {
          const k = key as keyof EmployeePayload;
          if (form[k] !== editing[k]) {
            acc[k] = form[k];
          }
          return acc;
        }, {});

        if (Object.keys(dirtyFields).length === 0) {
          onOpenChange(false);
          return;
        }

        await employeeService.update(editing.id, dirtyFields);
        toast.success(`Employee ${editing.id} updated`);
      } else {
        const created = await employeeService.create(form);
        toast.success(`Employee ${created.id} created`);
      }
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save employee";
      setServerError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const factoryDeps = (departments.data ?? []).filter((d) => d.factoryId === form.factoryId);
  console.log('deps: ', factoryDeps);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit employee ${editing.id}` : "Create employee"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update employment information."
              : "New employees receive an employee ID automatically."}
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name" error={errors['fullName'] || ''} className="col-span-2">
            <Input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Nguyen Van A"
            />
          </Field>
          <Field label="Factory">
            <Select
              value={form.factoryId || ''}
              onValueChange={(v) => {
                set("factoryId", v);
                set("departmentId", "");
              }}
              disabled={!!editing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {factories.data?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Department" error={errors['departmentId'] || ''}>
            <Select value={form.departmentId || ''} onValueChange={(v) => set("departmentId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {factoryDeps.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Position" error={errors['position'] || ''}>
            <Input
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="Machine Operator"
            />
          </Field>
          <Field label="Employment status">
            <Select
              value={form.employmentStatus || ''}
              onValueChange={(v) => set("employmentStatus", v as EmploymentStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["ACTIVE", "PROBATION", "ON_LEAVE", "SUSPENDED", "TERMINATED"] as const).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Email" error={errors['email'] || ''}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@tmc.com.vn"
            />
          </Field>
          <Field label="Phone" error={errors['phone'] || ''}>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+84 90 123 4567"
            />
          </Field>
          <Field label="Hire date" error={errors['hireDate'] || ''}>
            <Input
              type="date"
              value={form.hireDate}
              onChange={(e) => set("hireDate", e.target.value)}
            />
          </Field>
          <Field label="Date of birth">
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <Select value={form.gender || ''} onValueChange={(v) => set("gender", v as "M" | "F")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Create employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
