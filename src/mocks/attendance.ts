import type { AttendanceTransaction, DenialReason, QrValidation, TransactionStatus } from "@/types";
import { EMPLOYEES } from "./data";
import { GATES } from "./gates";
import { chance, mulberry32, pick, randInt, seededRngFor, utcAsLocal, ymd, type Rng } from "./rand";

const DAYS_BACK = 14;

/** Current "wall clock" in the simulated Asia/Ho_Chi_Minh timezone (stored as UTC). */
export function nowSim(): Date {
  return new Date();
}

function dateKeys(): string[] {
  const out: string[] = [];
  const now = nowSim();
  for (let i = DAYS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// The attendance generation below pre-decides, per employee/day, whether the
// person shows up, so the summary service and the transaction list always agree.

interface PlannedDay {
  checkIn: string | null;
  checkOut: string | null;
  lateMinutes: number;
}

function planDay(rng: Rng, dayKey: string, isToday: boolean): PlannedDay | null {
  const weekday = new Date(dayKey + "T00:00:00Z").getUTCDay();
  if (weekday === 0 && chance(rng, 0.85)) return null; // Sundays mostly off
  if (chance(rng, 0.06)) return null; // absent
  const ci = randInt(rng, 6 * 60 + 45, 8 * 60 + 15); // 06:45 – 08:15
  const co = randInt(rng, 16 * 60 + 50, 18 * 60 + 35); // 16:50 – 18:35
  const nowMin = nowSim().getUTCHours() * 60 + nowSim().getUTCMinutes();
  const checkOut = isToday && co > nowMin ? null : co;
  return {
    checkIn: `${String(Math.floor(ci / 60)).padStart(2, "0")}:${String(ci % 60).padStart(2, "0")}`,
    checkOut:
      checkOut === null
        ? null
        : `${String(Math.floor(checkOut / 60)).padStart(2, "0")}:${String(checkOut % 60).padStart(2, "0")}`,
    lateMinutes: Math.max(0, ci - (7 * 60 + 30 + 15)),
  };
}

function generateTransactions(): AttendanceTransaction[] {
  const rng = mulberry32(424242);
  const out: AttendanceTransaction[] = [];
  const days = dateKeys();
  const gatesByFactory: Record<string, { entry: typeof GATES; exit: typeof GATES }> = {
    BD: { entry: [], exit: [] },
    LA: { entry: [], exit: [] },
  };
  for (const g of GATES) {
    if (g.type === "EXIT") gatesByFactory[g.factoryId]!.exit.push(g);
    else gatesByFactory[g.factoryId]!.entry.push(g);
  }
  let seq = 0;
  const nextId = () => `TX-${String(++seq).padStart(6, "0")}`;

  for (const emp of EMPLOYEES) {
    const eligible = emp.employmentStatus === "ACTIVE" || emp.employmentStatus === "PROBATION";
    if (!eligible) continue;
    for (const dayKey of days) {
      const leave = seededLeave(emp.id, dayKey);
      const empRng = seededRngFor(emp.id + dayKey + "att");
      if (leave) continue;
      const isToday = dayKey === days[days.length - 1];
      const plan = planDay(empRng, dayKey, isToday);
      if (!plan) continue;
      const dateParts = ymd(dayKey);
      if (plan.checkIn) {
        const gate = pick(empRng, gatesByFactory[emp.factoryId]!.entry);
        const denied = chance(empRng, 0.008);
        if (denied) {
          const reason = pickDenial(empRng);
          out.push({
            id: nextId(),
            employeeId: emp.id,
            employeeName: emp.fullName,
            factoryId: emp.factoryId,
            gateId: gate.id,
            gateName: gate.name,
            eventType: "CHECK_IN",
            timestamp: utcAsLocal(
              dateParts[0],
              dateParts[1],
              dateParts[2],
              Math.floor(randInt(empRng, 6 * 60 + 45, 8 * 60 + 15) / 60),
              0,
            ),
            qrValidation: validationFor(reason),
            status: "DENIED",
            denialReason: reason,
            errorMessage: denialMessage(reason),
            synced: true,
          });
          continue;
        }
        const [h = 0, m = 0] = plan.checkIn.split(":").map(Number);
        out.push({
          id: nextId(),
          employeeId: emp.id,
          employeeName: emp.fullName,
          factoryId: emp.factoryId,
          gateId: gate.id,
          gateName: gate.name,
          eventType: "CHECK_IN",
          timestamp: utcAsLocal(dateParts[0], dateParts[1], dateParts[2], h, m),
          qrValidation: "VALID",
          status: "SUCCESS",
          synced: true,
        });
      }
      if (plan.checkOut) {
        const gate = pick(empRng, gatesByFactory[emp.factoryId]!.exit);
        const [h = 0, m = 0] = plan.checkOut.split(":").map(Number);
        out.push({
          id: nextId(),
          employeeId: emp.id,
          employeeName: emp.fullName,
          factoryId: emp.factoryId,
          gateId: gate.id,
          gateName: gate.name,
          eventType: "CHECK_OUT",
          timestamp: utcAsLocal(dateParts[0], dateParts[1], dateParts[2], h, m),
          qrValidation: "VALID",
          status: "SUCCESS",
          synced: true,
        });
      }
    }
  }

  // Inject unknown-QR denials (no employee behind the card).
  for (let i = 0; i < 18; i++) {
    const dayKey = pick(rng, days);
    const d = ymd(dayKey);
    const gate = pick(
      rng,
      GATES.filter((g) => g.controllerStatus === "ONLINE"),
    );
    out.push({
      id: nextId(),
      employeeId: "—",
      employeeName: "Unknown QR card",
      factoryId: gate.factoryId,
      gateId: gate.id,
      gateName: gate.name,
      eventType: pick(rng, ["CHECK_IN", "CHECK_OUT"] as const),
      timestamp: utcAsLocal(d[0], d[1], d[2], randInt(rng, 6, 17), randInt(rng, 0, 59)),
      qrValidation: "UNKNOWN",
      status: "DENIED",
      denialReason: "UNKNOWN_QR",
      errorMessage: "QR payload not recognized by the validation service",
      synced: true,
    });
  }

  // Inject a handful of failed transactions on the offline/under-maintenance gates.
  for (let i = 0; i < 8; i++) {
    const dayKey = pick(rng, days);
    const d = ymd(dayKey);
    const gate = pick(
      rng,
      GATES.filter((g) => g.controllerStatus !== "ONLINE"),
    );
    out.push({
      id: nextId(),
      employeeId: "—",
      employeeName: "—",
      factoryId: gate.factoryId,
      gateId: gate.id,
      gateName: gate.name,
      eventType: pick(rng, ["CHECK_IN", "CHECK_OUT"] as const),
      timestamp: utcAsLocal(d[0], d[1], d[2], randInt(rng, 6, 17), randInt(rng, 0, 59)),
      qrValidation: "NOT_VALIDATED",
      status: "FAILED",
      errorMessage: "Gate controller unreachable — transaction not processed",
      synced: false,
    });
  }

  out.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Simulate offline queue: the newest successful transactions from today are
  // waiting for synchronization.
  const todayKey = days[days.length - 1];
  let marked = 0;
  for (const tx of out) {
    if (marked >= 14) break;
    if (tx.timestamp.slice(0, 10) === todayKey && tx.status === "SUCCESS") {
      tx.status = "PENDING";
      tx.synced = false;
      marked++;
    }
  }
  return out;
}

function seededLeave(employeeId: string, dayKey: string): boolean {
  let h = 0;
  for (const c of employeeId + dayKey + "lv") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100 < 3;
}

const DENIAL_POOL: DenialReason[] = [
  "EXPIRED_QR",
  "REVOKED_QR",
  "SUSPENDED_QR",
  "INACTIVE_EMPLOYEE",
  "UNAUTHORIZED_GATE",
];

function pickDenial(rng: Rng): DenialReason {
  return pick(rng, DENIAL_POOL);
}

function validationFor(reason: DenialReason): QrValidation {
  switch (reason) {
    case "EXPIRED_QR":
      return "EXPIRED";
    case "REVOKED_QR":
      return "REVOKED";
    case "SUSPENDED_QR":
      return "SUSPENDED";
    case "UNKNOWN_QR":
      return "UNKNOWN";
    default:
      return "VALID";
  }
}

export function denialMessage(reason: DenialReason): string {
  switch (reason) {
    case "EXPIRED_QR":
      return "QR code has expired — employee must regenerate their code";
    case "REVOKED_QR":
      return "QR code has been revoked by an administrator";
    case "SUSPENDED_QR":
      return "QR code is suspended pending review";
    case "UNKNOWN_QR":
      return "QR payload not recognized by the validation service";
    case "INACTIVE_EMPLOYEE":
      return "Employee account is inactive — access not permitted";
    case "UNAUTHORIZED_GATE":
      return "Employee is not authorized to use this gate for this event type";
  }
}

export const TRANSACTIONS: AttendanceTransaction[] = generateTransactions();
