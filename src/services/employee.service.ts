import type { Employee, EmploymentStatus, FactoryFilter, QrStatus } from "@/types";
import { EMPLOYEE_BY_ID, EMPLOYEES } from "@/mocks/data";
import { QR_BY_EMPLOYEE } from "@/mocks/qr-codes";
import { notifyDataChanged } from "./bus";
import { getEmployeeDailySummaries } from "./summary";

export interface EmployeeRow extends Employee {
  qrStatus: QrStatus | null;
}

export interface EmployeeListParams {
  q?: string;
  factoryId?: FactoryFilter;
  departmentId?: string;
  employmentStatus?: EmploymentStatus | "ALL";
}

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function toRow(e: Employee): EmployeeRow {
  return { ...e, qrStatus: QR_BY_EMPLOYEE.get(e.id)?.status ?? null };
}

export const employeeService = {
  async list(params: EmployeeListParams = {}): Promise<EmployeeRow[]> {
    const q = params.q?.trim().toLowerCase();
    let rows = EMPLOYEES as Employee[];
    if (params.factoryId && params.factoryId !== "ALL") rows = rows.filter((e) => e.factoryId === params.factoryId);
    if (params.departmentId && params.departmentId !== "ALL") rows = rows.filter((e) => e.departmentId === params.departmentId);
    if (params.employmentStatus && params.employmentStatus !== "ALL") rows = rows.filter((e) => e.employmentStatus === params.employmentStatus);
    if (q) rows = rows.filter((e) => e.id.toLowerCase().includes(q) || e.fullName.toLowerCase().includes(q));
    return delay(rows.map(toRow));
  },

  async getById(id: string) {
    const emp = EMPLOYEE_BY_ID.get(id);
    if (!emp) throw new Error("Employee not found");
    return delay({
      employee: toRow(emp),
      qrCode: QR_BY_EMPLOYEE.get(id) ?? null,
      attendanceHistory: getEmployeeDailySummaries(id, 14),
      recentEvents: [] as import("@/types").AttendanceTransaction[],
    });
  },

  async create(input: Omit<Employee, "id">): Promise<Employee> {
    const factoryId = input.factoryId;
    const seq = EMPLOYEES.filter((e) => e.factoryId === factoryId).reduce((max, e) => {
      const n = Number(e.id.split("-")[2]);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;
    const emp: Employee = { ...input, id: `TMC-${factoryId}-${String(seq).padStart(4, "0")}` };
    EMPLOYEES.push(emp);
    EMPLOYEE_BY_ID.set(emp.id, emp);
    notifyDataChanged();
    return delay(emp, 350);
  },

  async update(id: string, patch: Partial<Employee>): Promise<Employee> {
    const emp = EMPLOYEE_BY_ID.get(id);
    if (!emp) throw new Error("Employee not found");
    Object.assign(emp, patch);
    notifyDataChanged();
    return delay(emp, 250);
  },

  async setStatus(id: string, employmentStatus: EmploymentStatus): Promise<Employee> {
    return this.update(id, { employmentStatus });
  },
};
