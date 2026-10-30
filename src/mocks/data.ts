import { generateEmployees, type GeneratedEmployee } from "./employees";

export const EMPLOYEES: GeneratedEmployee[] = generateEmployees();

export const EMPLOYEE_BY_ID = new Map(EMPLOYEES.map((e) => [e.id, e]));

export function employeeName(id: string): string {
  return EMPLOYEE_BY_ID.get(id)?.fullName ?? "Unknown";
}

export type { GeneratedEmployee };
