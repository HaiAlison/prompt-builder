import type { AttendanceTransaction, AttendanceStatus, DailySummary, FactoryFilter } from "@/types";
import { TRANSACTIONS, nowSim } from "@/mocks/attendance";
import { isAbsentThatDay, seededRngFor, SHIFT_START_MINUTES, LATE_THRESHOLD_MINUTES } from "@/mocks/employees";
import { EMPLOYEE_BY_ID, EMPLOYEES } from "@/mocks/data";
import { dateKey } from "@/utils/format";

/**
 * Derives daily summaries (one row per employee/day) from the raw gate
 * transactions — the same derivation the backend will run.
 */
export function buildDailySummaries(date: string, factoryFilter: FactoryFilter = "ALL"): DailySummary[] {
  const byEmp = new Map<string, AttendanceTransaction[]>();
  for (const tx of TRANSACTIONS) {
    if (dateKey(tx.timestamp) !== date) continue;
    if (tx.employeeId === "—") continue;
    const list = byEmp.get(tx.employeeId);
    if (list) list.push(tx);
    else byEmp.set(tx.employeeId, [tx]);
  }
  const out: DailySummary[] = [];
  for (const emp of EMPLOYEES) {
    if (emp.employmentStatus !== "ACTIVE" && emp.employmentStatus !== "PROBATION") continue;
    if (factoryFilter !== "ALL" && emp.factoryId !== factoryFilter) continue;
    const txs = byEmp.get(emp.id) ?? [];
    const ins = txs.filter((t) => t.eventType === "CHECK_IN" && t.status !== "DENIED" && t.status !== "FAILED").map((t) => t.timestamp).sort();
    const outs = txs.filter((t) => t.eventType === "CHECK_OUT" && t.status !== "DENIED" && t.status !== "FAILED").map((t) => t.timestamp).sort();
    const firstCheckIn = ins[0] ?? null;
    const lastCheckOut = outs[outs.length - 1] ?? null;
    const lateMinutes = firstCheckIn
      ? Math.max(0, minutesOfDay(firstCheckIn) - (SHIFT_START_MINUTES + LATE_THRESHOLD_MINUTES))
      : 0;
    const workedMinutes = firstCheckIn && lastCheckOut
      ? Math.max(0, minutesOfDay(lastCheckOut) - minutesOfDay(firstCheckIn))
      : 0;
    let status: AttendanceStatus;
    if (isOnLeaveDaily(emp.id, date)) status = "ON_LEAVE";
    else if (!firstCheckIn) status = isAbsentThatDay(emp.id, date) ? "ABSENT" : "ABSENT";
    else if (!lastCheckOut) status = "INCOMPLETE";
    else if (lateMinutes > 0) status = "LATE";
    else status = "PRESENT";
    out.push({
      employeeId: emp.id,
      employeeName: emp.fullName,
      factoryId: emp.factoryId,
      departmentName: emp.departmentName,
      date,
      firstCheckIn,
      lastCheckOut,
      workedMinutes,
      lateMinutes,
      status,
    });
  }
  return out;
}

function isOnLeaveDaily(employeeId: string, dateKeyStr: string): boolean {
  let h = 0;
  for (const c of employeeId + dateKeyStr + "lv") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100 < 3;
}

function minutesOfDay(iso: string): number {
  return Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
}

export function getEmployeeDailySummaries(employeeId: string, days: number): DailySummary[] {
  const out: DailySummary[] = [];
  const now = nowSim();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    const emp = EMPLOYEE_BY_ID.get(employeeId);
    if (!emp) break;
    const one = buildDailySummaries(d, "ALL").filter((s) => s.employeeId === employeeId);
    out.push(...one);
  }
  return out;
}

/** Small deterministic helper reused by reports. */
export function seededDayPresent(employeeId: string, date: string): { present: boolean; late: boolean } {
  const rng = seededRngFor(employeeId + date + "rep");
  const present = rng() > 0.06;
  return { present, late: present && rng() < 0.18 };
}
