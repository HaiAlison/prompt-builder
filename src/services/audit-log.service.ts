import type { AuditAction, AuditLog, AuditModule } from "@/types";
import { AUDIT_LOGS } from "@/mocks/audit-logs";

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface AuditLogParams {
  q?: string;
  from?: string;
  to?: string;
  user?: string;
  module?: AuditModule | "ALL";
  action?: AuditAction | "ALL";
}

export const auditLogService = {
  async list(params: AuditLogParams = {}): Promise<AuditLog[]> {
    const q = params.q?.trim().toLowerCase();
    let rows = AUDIT_LOGS;
    if (params.module && params.module !== "ALL")
      rows = rows.filter((l) => l.module === params.module);
    if (params.action && params.action !== "ALL")
      rows = rows.filter((l) => l.action === params.action);
    if (params.user && params.user !== "ALL") rows = rows.filter((l) => l.userName === params.user);
    if (params.from) rows = rows.filter((l) => l.timestamp.slice(0, 10) >= params.from!);
    if (params.to) rows = rows.filter((l) => l.timestamp.slice(0, 10) <= params.to!);
    if (q) {
      rows = rows.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.resourceId.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q),
      );
    }
    return delay(rows);
  },

  async getById(id: string): Promise<AuditLog | undefined> {
    return delay(
      AUDIT_LOGS.find((l) => l.id === id),
      60,
    );
  },
};
