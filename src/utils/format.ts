import type {
  AttendanceStatus,
  DenialReason,
  EventType,
  GateStatus,
  GateType,
  QrStatus,
  TransactionStatus,
  EmploymentStatus,
} from "@/types";

export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[Number(m) - 1]} ${Number(d)}, ${y}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[Number(m) - 1]} ${y}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/* ---- Human-readable enum labels ---- */

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
};

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  SUCCESS: "Success",
  DENIED: "Denied",
  PENDING: "Pending sync",
  FAILED: "Failed",
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT: "Absent",
  ON_LEAVE: "On leave",
  INCOMPLETE: "Incomplete",
};

export const QR_STATUS_LABEL: Record<QrStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
  SUSPENDED: "Suspended",
};

export const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> = {
  ACTIVE: "Active",
  PROBATION: "Probation",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

export const GATE_TYPE_LABEL: Record<GateType, string> = {
  ENTRY: "Entry",
  EXIT: "Exit",
  BIDIRECTIONAL: "Bidirectional",
};

export const GATE_STATUS_LABEL: Record<GateStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  MAINTENANCE: "Maintenance",
};

export const DENIAL_REASON_LABEL: Record<DenialReason, string> = {
  EXPIRED_QR: "Expired QR code",
  REVOKED_QR: "Revoked QR code",
  SUSPENDED_QR: "Suspended QR code",
  UNKNOWN_QR: "Unknown QR code",
  INACTIVE_EMPLOYEE: "Inactive employee",
  UNAUTHORIZED_GATE: "Unauthorized gate access",
};
