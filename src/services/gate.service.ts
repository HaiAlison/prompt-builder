import type { AttendanceTransaction, FactoryFilter, GateStation, GateStatus, GateType } from "@/types";
import { GATES, GATE_BY_ID } from "@/mocks/gates";
import { TRANSACTIONS } from "@/mocks/attendance";
import { notifyDataChanged } from "./bus";
import { dateKey } from "@/utils/format";

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface GateListParams {
  q?: string;
  factoryId?: FactoryFilter;
  status?: GateStatus | "ALL";
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
    const q = params.q?.trim().toLowerCase();
    let rows = GATES;
    if (params.factoryId && params.factoryId !== "ALL") rows = rows.filter((g) => g.factoryId === params.factoryId);
    if (params.status && params.status !== "ALL") {
      rows = rows.filter((g) => g.controllerStatus === params.status || g.scannerStatus === params.status);
    }
    if (q) rows = rows.filter((g) => g.id.toLowerCase().includes(q) || g.name.toLowerCase().includes(q) || g.location.toLowerCase().includes(q));
    return delay(rows);
  },

  async getById(id: string): Promise<GateDetail | undefined> {
    const gate = GATE_BY_ID.get(id);
    if (!gate) return undefined;
    const events = TRANSACTIONS.filter((t) => t.gateId === id).slice(0, 20);
    const dailyStats: GateDetail["dailyStats"] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      const dayTx = TRANSACTIONS.filter((t) => t.gateId === id && dateKey(t.timestamp) === d);
      dailyStats.push({ date: d, transactions: dayTx.length, denied: dayTx.filter((t) => t.status === "DENIED").length });
    }
    return delay({
      gate,
      recentEvents: events,
      dailyStats,
      onlineScanners: GATES.filter((g) => g.controllerStatus === "ONLINE").length,
      totalScanners: GATES.length,
    }, 110);
  },

  async create(input: Omit<GateStation, "id" | "lastHeartbeat">): Promise<GateStation> {
    const seq = GATES.filter((g) => g.factoryId === input.factoryId).length + 1;
    const gate: GateStation = {
      ...input,
      id: `GATE-${input.factoryId}-${String(seq).padStart(2, "0")}`,
      lastHeartbeat: new Date().toISOString(),
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
    return this.update(id, { controllerStatus: status, scannerStatus: status });
  },
};
