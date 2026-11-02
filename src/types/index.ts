// Domain types for the TMC Attendance & Access Control System (frontend only).
// These mirror the future NestJS API contracts so services can be swapped later.

export type FactoryId = "BD" | "LA";

export interface Factory {
  id: FactoryId;
  name: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface Department {
  id: string;
  name: string;
  factoryId: FactoryId;
}

export type EmploymentStatus = "ACTIVE" | "PROBATION" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";

export interface Employee {
  id: string; // e.g. TMC-BD-0001
  fullName: string;
  departmentId: string;
  departmentName: string;
  position: string;
  factoryId: FactoryId;
  email: string;
  phone: string;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  dateOfBirth: string;
  gender: "M" | "F";
}

export type QrStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";

export interface QrCode {
  id: string; // e.g. QR-A1B2C3
  employeeId: string;
  employeeName: string;
  factoryId: FactoryId;
  status: QrStatus;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  // Opaque rotating payload token — no sensitive employee data is embedded.
  payload: string;
}

export type EventType = "CHECK_IN" | "CHECK_OUT";

export type TransactionStatus = "SUCCESS" | "DENIED" | "PENDING" | "FAILED";

export type DenialReason =
  | "EXPIRED_QR"
  | "REVOKED_QR"
  | "UNKNOWN_QR"
  | "INACTIVE_EMPLOYEE"
  | "UNAUTHORIZED_GATE"
  | "SUSPENDED_QR";

export type QrValidation =
  "VALID" | "EXPIRED" | "REVOKED" | "SUSPENDED" | "UNKNOWN" | "NOT_VALIDATED";

export interface AttendanceTransaction {
  id: string; // e.g. TX-000001
  employeeId: string;
  employeeName: string;
  factoryId: FactoryId;
  gateId: string;
  gateName: string;
  eventType: EventType;
  timestamp: string; // ISO (UTC, rendered as Asia/Ho_Chi_Minh)
  qrValidation: QrValidation;
  status: TransactionStatus;
  denialReason?: DenialReason;
  errorMessage?: string;
  /** False while the transaction waits for backend synchronization (offline gate). */
  synced: boolean;
}

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE" | "INCOMPLETE";

export interface DailySummary {
  employeeId: string;
  employeeName: string;
  factoryId: FactoryId;
  departmentName: string;
  date: string; // YYYY-MM-DD
  firstCheckIn: string | null;
  lastCheckOut: string | null;
  workedMinutes: number;
  lateMinutes: number;
  status: AttendanceStatus;
}

export type GateType = "ENTRY" | "EXIT" | "BIDIRECTIONAL";
export type GateStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE";

export interface GateStation {
  id: string; // e.g. GATE-BD-01
  name: string;
  factoryId: FactoryId;
  location: string;
  type: GateType;
  controllerStatus: GateStatus;
  scannerStatus: GateStatus;
  lastHeartbeat: string;
}

export type ReportType = "MONTHLY_ATTENDANCE" | "FACTORY_ATTENDANCE" | "ACCESS_CONTROL";

export type ReportStatus = "NOT_GENERATED" | "GENERATING" | "COMPLETED" | "FAILED";

export interface MonthlyAttendanceRow {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  factoryId: FactoryId;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
}

export interface FactoryReportRow {
  factoryId: FactoryId;
  factoryName: string;
  employees: number;
  avgAttendanceRate: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  trend: { date: string; checkIns: number; checkOuts: number }[];
  departments: { name: string; attendanceRate: number }[];
}

export interface AccessControlReportRow {
  gateId: string;
  gateName: string;
  factoryId: FactoryId;
  totalTransactions: number;
  successful: number;
  denied: number;
}

export interface PayrollExport {
  id: string;
  period: string; // YYYY-MM
  status: "COMPLETED" | "FAILED" | "PENDING";
  exportedAt: string | null;
  records: number;
  exportedBy: string;
}

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "GENERATE"
  | "REVOKE"
  | "CONFIG_CHANGE";

export type AuditModule =
  "EMPLOYEES" | "QR_CODES" | "ATTENDANCE" | "GATES" | "REPORTS" | "SETTINGS" | "AUTH";

export interface AuditLog {
  id: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  module: AuditModule;
  resourceId: string;
  ipAddress: string;
  timestamp: string;
  result: "SUCCESS" | "FAILED";
  details: string;
}

export type RoleName =
  | "SYSTEM_ADMIN"
  | "HR_STAFF"
  | "SECURITY_GUARD"
  | "PRODUCTION_SUPERVISOR"
  | "EXECUTIVE_MANAGEMENT"
  | "EMPLOYEE";

/** Module keys double as route segments for the guard. */
export type ModuleKey =
  | "dashboard"
  | "employees"
  | "qr-codes"
  | "my-qr"
  | "attendance"
  | "gates"
  | "reports"
  | "audit-logs"
  | "settings";

export interface Role {
  name: RoleName;
  label: string;
  description: string;
  permissions: ModuleKey[];
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: "ACTIVE" | "INACTIVE";
  lastLogin: string | null;
  linkedEmployeeId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
}

export type NetworkStatus = "ONLINE" | "OFFLINE" | "RECONNECTING";

export interface SystemConfig {
  timezone: string;
  shiftStart: string; // HH:mm
  lateThresholdMinutes: number;
  employeeQrValidityDays: number;
  dynamicQrTtlSeconds: number;
  monthlyExportDay: number;
  monthlyExportDeadline: string; // HH:mm
  workingDaysPerWeek: number;
}

export interface DashboardKpis {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  insideNow: number;
  checkInsToday: number;
  checkOutsToday: number;
  deniedToday: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  trend: { date: string; checkIns: number; checkOuts: number }[];
  distribution: { name: string; value: number; status: AttendanceStatus }[];
  recentEvents: AttendanceTransaction[];
  factoryComparison: {
    factoryId: FactoryId;
    factoryName: string;
    attendanceRate: number;
    checkIns: number;
    denied: number;
  }[];
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScanResult {
  transaction: AttendanceTransaction;
  message: string;
}

export type FactoryFilter = FactoryId | "ALL";
