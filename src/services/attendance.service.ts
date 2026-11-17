import type {
  AttendanceTransaction,
  DashboardData,
  EventType,
  FactoryFilter,
  IPaginatedResponse,
  ScanResult,
  TransactionStatus,
} from "@/types";
import { TRANSACTIONS } from "@/mocks/attendance";
import { EMPLOYEE_BY_ID } from "@/mocks/data";
import { notifyDataChanged } from "./bus";
import { buildDailySummaries } from "./summary";
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

export const attendanceService = {
  async listTransactions(params: TransactionParams = {}): Promise<AttendanceTransaction[]> {
    let rows = await api.get<IPaginatedResponse<AttendanceTransaction>>(
      "/attendance/transactions",
      { params },
    );
    return delay(rows.results);
  },

  async getTransaction(id: string): Promise<AttendanceTransaction | undefined> {
    return await api.get(`/attendance/transactions/${id}`);
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
   * Process a QR scan event via POST /attendance/scan
   */
  async processScan(input: {
    qrPayload: string;
    gateId: string;
    eventType: EventType;
    /** When true the gate is offline and the transaction queues for sync. */
    offline?: boolean;
  }): Promise<ScanResult> {
    const payload = {
      qrPayload: input.qrPayload,
      gateId: input.gateId,
      eventType: input.eventType,
      offline: Boolean(input.offline),
    };

    try {
      const res = await api.post<ScanResult | { data: ScanResult }>("/attendance/scan", payload);
      const data: ScanResult = (res as any)?.data?.transaction ? (res as any).data : (res as ScanResult);

      if (data?.transaction) {
        if (!data.transaction.factoryId && data.transaction.factoryCode) {
          data.transaction.factoryId = data.transaction.factoryCode;
        }
        if (!data.transaction.factoryCode && data.transaction.factoryId) {
          data.transaction.factoryCode = data.transaction.factoryId;
        }
        if (!data.transaction.employeeCode && data.transaction.employeeId) {
          data.transaction.employeeCode = data.transaction.employeeId;
        }
        TRANSACTIONS.unshift(data.transaction);
      }

      notifyDataChanged();
      return data;
    } catch (err: any) {
      const errorData = err?.response?.data;
      const data: ScanResult | undefined = errorData?.transaction
        ? errorData
        : errorData?.data?.transaction
          ? errorData.data
          : undefined;

      if (data?.transaction) {
        if (!data.transaction.factoryId && data.transaction.factoryCode) {
          data.transaction.factoryId = data.transaction.factoryCode;
        }
        if (!data.transaction.factoryCode && data.transaction.factoryId) {
          data.transaction.factoryCode = data.transaction.factoryId;
        }
        if (!data.transaction.employeeCode && data.transaction.employeeId) {
          data.transaction.employeeCode = data.transaction.employeeId;
        }
        TRANSACTIONS.unshift(data.transaction);
        notifyDataChanged();
        return data;
      }
      throw err;
    }
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
