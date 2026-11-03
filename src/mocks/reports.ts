import type { PayrollExport, SystemConfig } from "@/types";

export const DEFAULT_CONFIG: SystemConfig = {
  timezone: "Asia/Ho_Chi_Minh",
  shiftStart: "07:30",
  lateThresholdMinutes: 15,
  employeeQrValidityDays: 365,
  dynamicQrTtlSeconds: 60,
  monthlyExportDay: 1,
  monthlyExportDeadline: "12:00",
  workingDaysPerWeek: 6,
};

export const PAYROLL_EXPORTS: PayrollExport[] = [
  {
    id: "EXP-0042",
    period: "2026-09",
    status: "COMPLETED",
    exportedAt: new Date(Date.now() - 26 * 86_400_000).toISOString(),
    records: 1352,
    exportedBy: "Tran Thi Bich",
  },
  {
    id: "EXP-0041",
    period: "2026-08",
    status: "COMPLETED",
    exportedAt: new Date(Date.now() - 56 * 86_400_000).toISOString(),
    records: 1338,
    exportedBy: "Tran Thi Bich",
  },
  {
    id: "EXP-0040",
    period: "2026-07",
    status: "COMPLETED",
    exportedAt: new Date(Date.now() - 87 * 86_400_000).toISOString(),
    records: 1317,
    exportedBy: "Duong Thi Lan",
  },
  {
    id: "EXP-0039",
    period: "2026-06",
    status: "COMPLETED",
    exportedAt: new Date(Date.now() - 118 * 86_400_000).toISOString(),
    records: 1301,
    exportedBy: "Tran Thi Bich",
  },
  {
    id: "EXP-0038",
    period: "2026-05",
    status: "FAILED",
    exportedAt: null,
    records: 0,
    exportedBy: "Tran Thi Bich",
  },
];
