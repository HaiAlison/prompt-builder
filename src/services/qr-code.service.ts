import type { FactoryFilter, QrCode, QrStatus } from "@/types";
import { QR_CODES, newQrPayload } from "@/mocks/qr-codes";
import { EMPLOYEE_BY_ID } from "@/mocks/data";
import { notifyDataChanged } from "./bus";
import { DEFAULT_CONFIG } from "@/mocks/reports";

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface QrListParams {
  q?: string;
  factoryId?: FactoryFilter;
  status?: QrStatus | "ALL";
}

export const qrCodeService = {
  async list(params: QrListParams = {}): Promise<QrCode[]> {
    const q = params.q?.trim().toLowerCase();
    let rows = QR_CODES;
    if (params.factoryId && params.factoryId !== "ALL")
      rows = rows.filter((r) => r.factoryId === params.factoryId);
    if (params.status && params.status !== "ALL")
      rows = rows.filter((r) => r.status === params.status);
    if (q) {
      rows = rows.filter(
        (r) =>
          r.employeeId.toLowerCase().includes(q) ||
          r.employeeName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      );
    }
    return delay(rows);
  },

  async getById(id: string): Promise<QrCode | undefined> {
    return delay(
      QR_CODES.find((r) => r.id === id),
      60,
    );
  },

  /** Returns the (single) code assigned to an employee, if any. */
  async getByEmployee(employeeId: string): Promise<QrCode | undefined> {
    return delay(
      QR_CODES.find((r) => r.employeeId === employeeId),
      80,
    );
  },

  /** Issues a fresh code for an employee; previously active codes are revoked. */
  async generateForEmployee(employeeId: string): Promise<QrCode> {
    const emp = EMPLOYEE_BY_ID.get(employeeId);
    if (!emp) throw new Error("Employee not found");
    for (const code of QR_CODES) {
      if (code.employeeId === employeeId && code.status === "ACTIVE") code.status = "REVOKED";
    }
    const now = new Date();
    const code: QrCode = {
      id: `QR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      employeeId,
      employeeName: emp.fullName,
      factoryId: emp.factoryId,
      status: "ACTIVE",
      createdAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + DEFAULT_CONFIG.employeeQrValidityDays * 86_400_000,
      ).toISOString(),
      lastUsedAt: null,
      payload: newQrPayload(),
    };
    QR_CODES.unshift(code);
    notifyDataChanged();
    return delay(code, 400);
  },

  async revoke(id: string): Promise<QrCode | undefined> {
    const code = QR_CODES.find((r) => r.id === id);
    if (code) {
      code.status = "REVOKED";
      notifyDataChanged();
    }
    return delay(code, 300);
  },

  async regenerate(id: string): Promise<QrCode> {
    const code = QR_CODES.find((r) => r.id === id);
    if (!code) throw new Error("QR code not found");
    const fresh = await this.generateForEmployee(code.employeeId);
    return fresh;
  },

  async setStatus(id: string, status: QrStatus): Promise<QrCode | undefined> {
    const code = QR_CODES.find((r) => r.id === id);
    if (code) {
      code.status = status;
      notifyDataChanged();
    }
    return delay(code, 250);
  },
};
