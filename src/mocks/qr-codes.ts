import type { QrCode, QrStatus } from "@/types";
import { EMPLOYEES } from "./data";
import { chance, mulberry32, randInt, token, utcAsLocal } from "./rand";

function randomPayload(): string {
  const rng = mulberry32(Date.now() ^ Math.floor(Math.random() * 1e9));
  return `TMCQR2|${token(rng, 24)}`;
}

export function newQrPayload(): string {
  return randomPayload();
}

function statusFor(expiresAt: string, roll: number): QrStatus {
  if (new Date(expiresAt).getTime() < Date.now()) return "EXPIRED";
  if (roll < 0.04) return "REVOKED";
  if (roll < 0.075) return "SUSPENDED";
  return "ACTIVE";
}

function generateQrCodes(): QrCode[] {
  const rng = mulberry32(777001);
  const out: QrCode[] = [];
  let seq = 0;
  const currentYear = new Date().getUTCFullYear();
  for (const emp of EMPLOYEES) {
    seq++;
    const createdYear = randInt(rng, currentYear - 1, currentYear);
    const createdMonth =
      createdYear === currentYear
        ? randInt(rng, 1, Math.max(1, new Date().getUTCMonth()))
        : randInt(rng, 1, 12);
    const createdAt = utcAsLocal(
      createdYear,
      createdMonth,
      randInt(rng, 1, 28),
      randInt(rng, 6, 17),
      randInt(rng, 0, 59),
    );
    const expiresAt = new Date(new Date(createdAt).getTime() + 365 * 86_400_000).toISOString();
    const status = statusFor(expiresAt, rng());
    let lastUsedAt: string | null = null;
    if (status === "ACTIVE" && chance(rng, 0.82)) {
      lastUsedAt = new Date(Date.now() - randInt(rng, 1, 6 * 24 * 60) * 60_000).toISOString();
    } else if (status !== "ACTIVE" && chance(rng, 0.5)) {
      lastUsedAt = new Date(Date.now() - randInt(rng, 30, 120) * 86_400_000).toISOString();
    }
    out.push({
      id: `QR-${token(rng, 6)}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      factoryId: emp.factoryId,
      status,
      createdAt,
      expiresAt,
      lastUsedAt,
      payload: `TMCQR2|${token(rng, 24)}`,
    });
  }
  return out;
}

export const QR_CODES: QrCode[] = generateQrCodes();

export const QR_BY_EMPLOYEE = new Map(QR_CODES.map((q) => [q.employeeId, q]));
export const QR_BY_PAYLOAD = new Map(QR_CODES.map((q) => [q.payload, q]));
