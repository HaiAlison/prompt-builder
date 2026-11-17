import type {
  AttendanceTransaction,
  DashboardData,
  DenialReason,
  EventType,
  FactoryFilter,
  QrValidation,
  ScanResult,
  TransactionStatus,
} from "@/types";
import { TRANSACTIONS, denialMessage, nowSim } from "@/mocks/attendance";
import { GATE_BY_ID } from "@/mocks/gates";
import { QR_BY_PAYLOAD } from "@/mocks/qr-codes";
import { EMPLOYEE_BY_ID, EMPLOYEES } from "@/mocks/data";
import { notifyDataChanged } from "./bus";
import { buildDailySummaries } from "./summary";
import { dateKey, todayKey } from "@/utils/format";
import api from "./api";

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface TransactionParams {
  q?: string;
  factoryId?: FactoryFilter;
  departmentId?: string;
  gateId?: string;
  eventType?: EventType | "ALL";
  status?: TransactionStatus | "ALL";
  from?: string; // YYYY-MM-DD
  to?: string;
}

function validationFor(reason: DenialReason): QrValidation {
  switch (reason) {
    case "EXPIRED_QR": return "EXPIRED";
    case "REVOKED_QR": return "REVOKED";
    case "SUSPENDED_QR": return "SUSPENDED";
    case "UNKNOWN_QR": return "UNKNOWN";
    default: return "VALID";
  }
}

export const attendanceService = {
  async listTransactions(params: TransactionParams = {}): Promise<AttendanceTransaction[]> {
    const q = params.q?.trim().toLowerCase();
    let results = await api.get<AttendanceTransaction[]>('/attendance/transactions', { params });
    return delay(results.data.slice(0, 4000));
  },

  async getTransaction(id: string): Promise<AttendanceTransaction | undefined> {
    return delay(TRANSACTIONS.find((t) => t.id === id), 60);
  },

  async listDailySummaries(params: { date: string; factoryId?: FactoryFilter; departmentId?: string; q?: string }) {
    let rows = buildDailySummaries(params.date, params.factoryId ?? "ALL");
    if (params.departmentId && params.departmentId !== "ALL") {
      rows = rows.filter((s) => EMPLOYEE_BY_ID.get(s.employeeId)?.departmentId === params.departmentId);
    }
    if (params.q?.trim()) {
      const q = params.q.trim().toLowerCase();
      rows = rows.filter((s) => s.employeeId.toLowerCase().includes(q) || s.employeeName.toLowerCase().includes(q));
    }
    return delay(rows);
  },

  async getDashboard(factoryId: FactoryFilter = "ALL"): Promise<DashboardData> {
    const data = await api.get<DashboardData>(`/attendance/dashboard?factoryId=${factoryId}`);
    return delay(data, 140);
  },

  /**
   * Simulates a gate scanner reading a QR payload. Validation order mirrors
   * the future backend: payload → QR status → employee status → gate rules.
   */
  async processScan(input: {
    qrPayload: string;
    gateId: string;
    eventType: EventType;
    /** When true the gate is offline and the transaction queues for sync. */
    offline?: boolean;
  }): Promise<ScanResult> {
    const gate = GATE_BY_ID.get(input.gateId);
    const base = {
      factoryId: gate?.factoryId ?? "BD",
      gateId: input.gateId,
      gateName: gate?.name ?? input.gateId,
      eventType: input.eventType,
      timestamp: nowSim().toISOString(),
    };
    const fail = (
      employeeId: string,
      employeeName: string,
      reason: DenialReason,
      validation: QrValidation,
      status: TransactionStatus = "DENIED",
    ): ScanResult => {
      const tx: AttendanceTransaction = {
        id: nextTxId(),
        employeeId,
        employeeName,
        ...base,
        qrValidation: validation,
        status,
        denialReason: reason,
        errorMessage: denialMessage(reason),
        synced: input.offline ? false : status === "SUCCESS",
      };
      if (input.offline && status === "SUCCESS") tx.status = "PENDING";
      TRANSACTIONS.unshift(tx);
      notifyDataChanged();
      return { transaction: tx, message: denialMessage(reason) };
    };

    if (!gate) {
      return fail("—", "—", "UNKNOWN_QR", "UNKNOWN", "FAILED");
    }
    if (gate.controllerStatus !== "ONLINE") {
      return fail("—", "—", "UNKNOWN_QR", "NOT_VALIDATED", "FAILED");
    }

    const qr = QR_BY_PAYLOAD.get(input.qrPayload);
    if (!qr) return fail("—", "Unknown QR card", "UNKNOWN_QR", "UNKNOWN");

    const emp = EMPLOYEE_BY_ID.get(qr.employeeId);
    if (!emp) return fail("—", "Unknown QR card", "UNKNOWN_QR", "UNKNOWN");

    if (qr.status === "EXPIRED") return fail(emp.id, emp.fullName, "EXPIRED_QR", "EXPIRED");
    if (qr.status === "REVOKED") return fail(emp.id, emp.fullName, "REVOKED_QR", "REVOKED");
    if (qr.status === "SUSPENDED") return fail(emp.id, emp.fullName, "SUSPENDED_QR", "SUSPENDED");

    if (emp.employmentStatus !== "ACTIVE" && emp.employmentStatus !== "PROBATION") {
      return fail(emp.id, emp.fullName, "INACTIVE_EMPLOYEE", "VALID");
    }

    const gateAllows =
      (input.eventType === "CHECK_IN" && (gate.type === "ENTRY" || gate.type === "BIDIRECTIONAL")) ||
      (input.eventType === "CHECK_OUT" && (gate.type === "EXIT" || gate.type === "BIDIRECTIONAL"));
    if (!gateAllows) {
      return fail(emp.id, emp.fullName, "UNAUTHORIZED_GATE", "VALID");
    }

    const tx: AttendanceTransaction = {
      id: nextTxId(),
      employeeId: emp.id,
      employeeName: emp.fullName,
      ...base,
      qrValidation: "VALID",
      status: input.offline ? "PENDING" : "SUCCESS",
      synced: !input.offline,
    };
    TRANSACTIONS.unshift(tx);
    qr.lastUsedAt = tx.timestamp;
    notifyDataChanged();
    await new Promise((r) => setTimeout(r, 400));
    return {
      transaction: tx,
      message:
        tx.status === "PENDING"
          ? "Access granted — transaction queued for synchronization (gate offline)"
          : "Access granted — gate unlocked",
    };
  },

  async listPendingSync(): Promise<AttendanceTransaction[]> {
    return delay(TRANSACTIONS.filter((t) => t.status === "PENDING" || (t.status === "FAILED" && !t.synced)), 60);
  },

  async syncStats(): Promise<{ pending: number; synced: number; failed: number }> {
    const pending = TRANSACTIONS.filter((t) => t.status === "PENDING").length;
    const failed = TRANSACTIONS.filter((t) => t.status === "FAILED").length;
    const synced = TRANSACTIONS.filter((t) => t.synced && t.status === "SUCCESS").length;
    return delay({ pending, synced, failed }, 60);
  },

  async retrySync(id: string): Promise<AttendanceTransaction | undefined> {
    const tx = TRANSACTIONS.find((t) => t.id === id);
    if (tx) {
      if (tx.status === "PENDING") {
        tx.status = "SUCCESS";
        tx.synced = true;
      } else if (tx.status === "FAILED") {
        tx.errorMessage = "Gate controller unreachable — transaction not processed";
      }
      notifyDataChanged();
    }
    return delay(tx, 300);
  },

  async syncAllPending(): Promise<number> {
    let n = 0;
    for (const tx of TRANSACTIONS) {
      if (tx.status === "PENDING") {
        tx.status = "SUCCESS";
        tx.synced = true;
        n++;
      }
    }
    notifyDataChanged();
    return delay(n, 500);
  },
};

function nextTxId(): string {
  const max = TRANSACTIONS.reduce((m, t) => {
    const n = Number(t.id.replace("TX-", ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `TX-${String(max + 1).padStart(6, "0")}`;
}
