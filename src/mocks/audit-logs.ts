import type { AuditAction, AuditLog, AuditModule } from "@/types";
import { MOCK_USERS } from "./users";
import { chance, mulberry32, pick, randInt, utcAsLocal, ymd } from "./rand";

const TEMPLATES: { action: AuditAction; module: AuditModule; resource: string; details: string }[] =
  [
    {
      action: "CREATE",
      module: "EMPLOYEES",
      resource: "TMC-BD-0812",
      details: "Created employee record and assigned to Production department",
    },
    {
      action: "UPDATE",
      module: "EMPLOYEES",
      resource: "TMC-LA-0231",
      details: "Updated employment status from PROBATION to ACTIVE",
    },
    {
      action: "GENERATE",
      module: "QR_CODES",
      resource: "QR-K4M9T2",
      details: "Generated new QR code for employee",
    },
    {
      action: "REVOKE",
      module: "QR_CODES",
      resource: "QR-P7X2Q1",
      details: "Revoked QR code reported as lost",
    },
    {
      action: "LOGIN",
      module: "AUTH",
      resource: "session",
      details: "User signed in from web portal",
    },
    { action: "LOGOUT", module: "AUTH", resource: "session", details: "User signed out" },
    {
      action: "UPDATE",
      module: "GATES",
      resource: "GATE-LA-03",
      details: "Changed gate type from ENTRY to BIDIRECTIONAL",
    },
    {
      action: "CONFIG_CHANGE",
      module: "SETTINGS",
      resource: "SYS-CONFIG",
      details: "Changed late threshold from 10 to 15 minutes",
    },
    {
      action: "EXPORT",
      module: "REPORTS",
      resource: "RPT-2026-09",
      details: "Exported monthly attendance report to CSV",
    },
    {
      action: "UPDATE",
      module: "ATTENDANCE",
      resource: "TX-004512",
      details: "Corrected transaction timestamp after gate clock drift",
    },
    {
      action: "CREATE",
      module: "SETTINGS",
      resource: "USR-009",
      details: "Created system user with role HR Staff",
    },
    {
      action: "UPDATE",
      module: "SETTINGS",
      resource: "USR-004",
      details: "Changed role assignment to Production Supervisor",
    },
    {
      action: "DELETE",
      module: "SETTINGS",
      resource: "DEP-BD-ACC",
      details: "Removed unused department mapping",
    },
  ];

function generateLogs(): AuditLog[] {
  const rng = mulberry32(313131);
  const out: AuditLog[] = [];
  const now = new Date();
  for (let i = 0; i < 180; i++) {
    const tpl = pick(rng, TEMPLATES);
    const user = pick(
      rng,
      MOCK_USERS.filter((u) => u.status === "ACTIVE"),
    );
    const minutesBack = randInt(rng, 2, 7 * 24 * 60);
    const ts = new Date(now.getTime() - minutesBack * 60_000);
    const d = ymd(ts.toISOString().slice(0, 10));
    out.push({
      id: `LOG-${String(i + 1).padStart(5, "0")}`,
      userName: user.name,
      userRole: user.role,
      action: tpl.action,
      module: tpl.module,
      resourceId: tpl.resource,
      ipAddress: `10.${randInt(rng, 0, 4)}.${randInt(rng, 1, 250)}.${randInt(rng, 2, 250)}`,
      timestamp: utcAsLocal(d[0], d[1], d[2], ts.getUTCHours(), ts.getUTCMinutes()),
      result: chance(rng, 0.96) ? "SUCCESS" : "FAILED",
      details: tpl.details,
    });
  }
  out.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return out;
}

export const AUDIT_LOGS: AuditLog[] = generateLogs();
