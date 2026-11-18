import type {
  AttendanceTransaction,
  FactoryFilter,
  GateStation,
  GateStatus,
  GateType,
  IPaginatedResponse,
} from "@/types";
import { GATES, GATE_BY_ID } from "@/mocks/gates";
import { TRANSACTIONS } from "@/mocks/attendance";
import { notifyDataChanged } from "./bus";
import { dateKey } from "@/utils/format";
import api from "./api";

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface GateListParams {
  q?: string | undefined;
  factoryId?: FactoryFilter | undefined;
  status?: GateStatus | "ALL" | undefined;
}

export interface GateDetail {
  gate: GateStation;
  recentEvents: AttendanceTransaction[];
  dailyStats: { date: string; transactions: number; denied: number }[];
  onlineScanners: number;
  totalScanners: number;
}

export const gateService = {
  async list(params: GateListParams = {}): Promise<GateStation[]> {
    const rows = await api.get<IPaginatedResponse<GateStation> | GateStation[]>('/gates', { params });
    const list = Array.isArray(rows) ? rows : (rows?.results ?? []);
    return delay(list);
  },

  async getById(id: string): Promise<GateDetail | undefined> {
    const rows = await api.get<GateDetail>(`/gates/${id}`);
    if (!rows) return undefined;
    const events = TRANSACTIONS.filter((t) => t.gateId === id).slice(0, 20);
    const dailyStats: GateDetail["dailyStats"] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      const dayTx = TRANSACTIONS.filter((t) => t.gateId === id && dateKey(t.timestamp) === d);
      dailyStats.push({
        date: d,
        transactions: dayTx.length,
        denied: dayTx.filter((t) => t.status === "DENIED").length,
      });
    }
    return delay(
      {
        gate: rows.gate,
        recentEvents: events,
        dailyStats,
        onlineScanners: GATES.filter((g) => g.status === "ONLINE").length,
        totalScanners: GATES.length,
      },
      110,
    );
  },

  async create(input: Omit<GateStation, "id" | "lastHeartbeat">): Promise<GateStation> {
    const seq = GATES.filter((g) => g.factoryId === input.factoryId).length + 1;
    const gate: GateStation = {
      ...input,
      id: `GATE-${input.factoryId}-${String(seq).padStart(2, "0")}`,
      lastHeartbeatAt: new Date().toISOString(),
    };
    GATES.push(gate);
    notifyDataChanged();
    return delay(gate, 350);
  },

  async update(id: string, patch: Partial<GateStation>): Promise<GateStation | undefined> {
    const gate = GATE_BY_ID.get(id);
    if (gate) {
      Object.assign(gate, patch);
      notifyDataChanged();
    }
    return delay(gate, 250);
  },

  async setStatus(id: string, status: GateStatus): Promise<GateStation | undefined> {
    return this.update(id, { status: status, scannerStatus: status });
  },
};
