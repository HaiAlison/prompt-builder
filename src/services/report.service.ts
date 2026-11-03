import type {
  AccessControlReportRow,
  FactoryFilter,
  FactoryReportRow,
  MonthlyAttendanceRow,
  PayrollExport,
  ReportType,
} from "@/types";
import { PAYROLL_EXPORTS, DEFAULT_CONFIG } from "@/mocks/reports";
import { EMPLOYEES } from "@/mocks/data";
import { TRANSACTIONS } from "@/mocks/attendance";
import { GATES } from "@/mocks/gates";
import { notifyDataChanged } from "./bus";
import { seededDayPresent } from "./summary";
import { dateKey, monthKey, todayKey } from "@/utils/format";

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Working days (Mon–Sat) of a month. */
function workingDaysOfMonth(month: string): string[] {
  const [y = 0, m = 1] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: string[] = [];
  for (let d = 1; d <= days; d++) {
    const key = `${month}-${String(d).padStart(2, "0")}`;
    const dow = new Date(key + "T00:00:00Z").getUTCDay();
    if (dow !== 0) out.push(key);
  }
  return out;
}

export const reportService = {
  async monthlyAttendance(
    month: string,
    factoryFilter: FactoryFilter = "ALL",
    departmentId?: string,
  ): Promise<MonthlyAttendanceRow[]> {
    const workingDays = workingDaysOfMonth(month);
    const txByEmpDay = new Map<string, { in: boolean; late: boolean }>();
    for (const tx of TRANSACTIONS) {
      if (
        monthKey(tx.timestamp) !== month ||
        tx.eventType !== "CHECK_IN" ||
        tx.status === "DENIED" ||
        tx.status === "FAILED"
      )
        continue;
      const key = `${tx.employeeId}|${dateKey(tx.timestamp)}`;
      const late =
        Number(tx.timestamp.slice(11, 13)) * 60 + Number(tx.timestamp.slice(14, 16)) > 7 * 60 + 45;
      const prev = txByEmpDay.get(key);
      txByEmpDay.set(key, { in: true, late: (prev?.late ?? false) || late });
    }

    const rows: MonthlyAttendanceRow[] = EMPLOYEES.filter((e) => {
      if (e.employmentStatus !== "ACTIVE" && e.employmentStatus !== "PROBATION") return false;
      if (factoryFilter !== "ALL" && e.factoryId !== factoryFilter) return false;
      if (departmentId && departmentId !== "ALL" && e.departmentId !== departmentId) return false;
      return true;
    }).map((emp) => {
      let presentDays = 0;
      let lateDays = 0;
      let absentDays = 0;
      for (const day of workingDays) {
        if (day > todayKey()) continue; // future days of the current month
        const real = txByEmpDay.get(`${emp.id}|${day}`);
        if (real) {
          presentDays++;
          if (real.late) lateDays++;
        } else {
          const seeded = seededDayPresent(emp.id, day);
          if (seeded.present) {
            presentDays++;
            if (seeded.late) lateDays++;
          } else {
            absentDays++;
          }
        }
      }
      return {
        id: emp.id,
        employeeId: emp.id,
        employeeName: emp.fullName,
        departmentName: emp.departmentName,
        factoryId: emp.factoryId,
        workingDays: workingDays.filter((d) => d <= todayKey()).length,
        presentDays,
        absentDays,
        lateDays,
        totalHours: Math.round(presentDays * 8.4 * 10) / 10,
      };
    });
    return delay(rows, 450);
  },

  async factoryReport(month: string): Promise<FactoryReportRow[]> {
    const rows: FactoryReportRow[] = [];
    for (const fid of ["BD", "LA"] as const) {
      const monthly = await this.monthlyAttendance(month, fid);
      const employees = monthly.length;
      const presentDays = monthly.reduce((s, r) => s + r.presentDays, 0);
      const expectedDays = monthly.reduce((s, r) => s + r.workingDays, 0);
      const deptNames = [...new Set(monthly.map((r) => r.departmentName))];
      rows.push({
        factoryId: fid,
        factoryName: fid === "BD" ? "Binh Duong Factory" : "Long An Factory",
        employees,
        avgAttendanceRate: expectedDays ? Math.round((presentDays / expectedDays) * 1000) / 10 : 0,
        presentDays,
        lateDays: monthly.reduce((s, r) => s + r.lateDays, 0),
        absentDays: monthly.reduce((s, r) => s + r.absentDays, 0),
        trend: (() => {
          const out: FactoryReportRow["trend"] = [];
          const now = new Date();
          for (let i = 13; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
            const dayTx = TRANSACTIONS.filter(
              (t) => dateKey(t.timestamp) === d && t.factoryId === fid,
            );
            out.push({
              date: d,
              checkIns: dayTx.filter(
                (t) =>
                  t.eventType === "CHECK_IN" && (t.status === "SUCCESS" || t.status === "PENDING"),
              ).length,
              checkOuts: dayTx.filter(
                (t) =>
                  t.eventType === "CHECK_OUT" && (t.status === "SUCCESS" || t.status === "PENDING"),
              ).length,
            });
          }
          return out;
        })(),
        departments: deptNames.map((name) => {
          const sub = monthly.filter((r) => r.departmentName === name);
          const p = sub.reduce((s, r) => s + r.presentDays, 0);
          const e = sub.reduce((s, r) => s + r.workingDays, 0);
          return { name, attendanceRate: e ? Math.round((p / e) * 1000) / 10 : 0 };
        }),
      });
    }
    return rows;
  },

  async accessControlReport(
    month: string,
    factoryFilter: FactoryFilter = "ALL",
  ): Promise<AccessControlReportRow[]> {
    const rows: AccessControlReportRow[] = GATES.filter(
      (g) => factoryFilter === "ALL" || g.factoryId === factoryFilter,
    ).map((gate) => {
      const txs = TRANSACTIONS.filter(
        (t) => t.gateId === gate.id && monthKey(t.timestamp) === month,
      );
      return {
        gateId: gate.id,
        gateName: gate.name,
        factoryId: gate.factoryId,
        totalTransactions: txs.length,
        successful: txs.filter((t) => t.status === "SUCCESS" || t.status === "PENDING").length,
        denied: txs.filter((t) => t.status === "DENIED").length,
      };
    });
    return delay(rows, 350);
  },

  async exportHistory(): Promise<PayrollExport[]> {
    return delay(PAYROLL_EXPORTS, 80);
  },

  /** Simulates pushing the month's attendance data to the HR/Payroll system. */
  async exportPayroll(period: string, exportedBy: string): Promise<PayrollExport> {
    const eligible = EMPLOYEES.filter(
      (e) => e.employmentStatus === "ACTIVE" || e.employmentStatus === "PROBATION",
    ).length;
    const rec: PayrollExport = {
      id: `EXP-${String(PAYROLL_EXPORTS.length + 43).padStart(4, "0")}`,
      period,
      status: "PENDING",
      exportedAt: null,
      records: eligible,
      exportedBy,
    };
    PAYROLL_EXPORTS.unshift(rec);
    notifyDataChanged();
    await new Promise((r) => setTimeout(r, 1200));
    rec.status = "COMPLETED";
    rec.exportedAt = new Date().toISOString();
    notifyDataChanged();
    return delay(rec, 100);
  },

  async listReports(): Promise<{ type: ReportType; status: string }[]> {
    return delay(
      [
        { type: "MONTHLY_ATTENDANCE", status: "NOT_GENERATED" },
        { type: "FACTORY_ATTENDANCE", status: "NOT_GENERATED" },
        { type: "ACCESS_CONTROL", status: "NOT_GENERATED" },
      ],
      60,
    );
  },
};

export { DEFAULT_CONFIG };
