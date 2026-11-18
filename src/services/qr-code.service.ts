import type { Employee, FactoryFilter, IPaginatedResponse, QrCode, QrStatus } from "@/types";
import { QR_CODES, newQrPayload } from "@/mocks/qr-codes";
import { EMPLOYEE_BY_ID } from "@/mocks/data";
import { notifyDataChanged } from "./bus";
import { DEFAULT_CONFIG } from "@/mocks/reports";
import api from "./api";

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface QrListParams {
  q?: string;
  factoryId?: FactoryFilter;
  status?: QrStatus | "ALL";
}

export const qrCodeService = {
  async list(params: QrListParams = {}): Promise<IPaginatedResponse<QrCode>> {
    let rows = await api.get<IPaginatedResponse<QrCode>>("/qr-codes", { params });
    return delay(rows);
  },

  async getById(id: string): Promise<QrCode | undefined> {
    return delay(
      QR_CODES.find((r) => r.id === id),
      60,
    );
  },

  async getByEmployee(employeeId: string): Promise<QrCode | undefined> {
    return delay(await api.get(`qr-codes/employee/${employeeId}`), 60);
  },
  /** Issues a fresh code for an employee; previously active codes are revoked. */
  async generateForEmployee(employeeId: string): Promise<QrCode> {
    const code = await api.post<QrCode>("/qr-codes/generate", { employeeId });
    notifyDataChanged();
    return delay(code, 400);
  },

  async revoke(id: string): Promise<QrCode> {
    const code = await api.post<QrCode>(`qr-codes/${id}/revoke`);
    notifyDataChanged();
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
