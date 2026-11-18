import { EmployeeDetail, EmployeePayload, IPaginatedResponse, type Employee, type EmploymentStatus, type FactoryFilter, type QrStatus } from "@/types";
import { EMPLOYEE_BY_ID, EMPLOYEES } from "@/mocks/data";
import { QR_BY_EMPLOYEE } from "@/mocks/qr-codes";
import { notifyDataChanged } from "./bus";
import { getEmployeeDailySummaries } from "./summary";
import api from "./api";

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
  async list(params: EmployeeListParams = {}): Promise<IPaginatedResponse<EmployeeRow>> {
    let rows = await api.get<IPaginatedResponse<EmployeeRow>>('/employees', { params });
    return delay(rows);
  },

  async getById(id: string): Promise<EmployeeDetail> {
    let res = await api.get<EmployeeDetail>(`/employees/${id}`);
    return delay(res);
  },

  async create(input: EmployeePayload): Promise<Employee> {
    let res = await api.post<Employee>('/employees', input);
    return delay(res, 350);
  },

  async update(id: string, patch: Partial<EmployeePayload>): Promise<Employee> {
    let res = await api.patch<Employee>(`/employees/${id}`, patch);
    return delay(res, 250);
  },

  async setStatus(id: string, employmentStatus: EmploymentStatus): Promise<Employee> {
    return this.update(id, { employmentStatus });
  },
};
