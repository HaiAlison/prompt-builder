import type { NotificationItem, Role, RoleName, SystemUser } from "@/types";
import { EMPLOYEES } from "./data";

export const ROLES: Role[] = [
  {
    name: "SYSTEM_ADMIN",
    label: "System Administrator",
    description: "Full access to every module including system configuration and audit logs.",
    permissions: [
      "dashboard",
      "employees",
      "qr-codes",
      "my-qr",
      "attendance",
      "gates",
      "reports",
      "audit-logs",
      "settings",
    ],
  },
  {
    name: "HR_STAFF",
    label: "HR Staff",
    description: "Manages employees, QR codes, attendance records and reports.",
    permissions: ["dashboard", "employees", "qr-codes", "my-qr", "attendance", "reports"],
  },
  {
    name: "SECURITY_GUARD",
    label: "Security Guard",
    description: "Monitors gate stations and access events.",
    permissions: ["my-qr", "attendance", "gates"],
  },
  {
    name: "PRODUCTION_SUPERVISOR",
    label: "Production Supervisor",
    description: "Overviews the dashboard and monitors team attendance.",
    permissions: ["dashboard", "my-qr", "attendance"],
  },
  {
    name: "EXECUTIVE_MANAGEMENT",
    label: "Executive Management",
    description: "High-level dashboard and company-wide reports.",
    permissions: ["dashboard", "my-qr", "reports"],
  },
  {
    name: "EMPLOYEE",
    label: "Employee",
    description: "Displays a personal QR code at factory gates.",
    permissions: ["my-qr"],
  },
];

export const ROLE_BY_NAME = new Map<RoleName, Role>(ROLES.map((r) => [r.name, r]));

// Two employee-role users are linked to real generated employees so the
// "My QR" portal shows a consistent persona.
const empA = EMPLOYEES.find((e) => e.factoryId === "BD" && e.departmentName === "Production")!;
const empB = EMPLOYEES.find((e) => e.factoryId === "LA" && e.departmentName === "Quality Control")!;

export const MOCK_USERS: SystemUser[] = [
  {
    id: "USR-001",
    name: "Nguyen Van An",
    email: "an.nguyen@tmc.com.vn",
    role: "SYSTEM_ADMIN",
    status: "ACTIVE",
    lastLogin: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "USR-002",
    name: "Tran Thi Bich",
    email: "bich.tran@tmc.com.vn",
    role: "HR_STAFF",
    status: "ACTIVE",
    lastLogin: new Date(Date.now() - 40 * 60_000).toISOString(),
  },
  {
    id: "USR-003",
    name: "Le Van Canh",
    email: "canh.le@tmc.com.vn",
    role: "SECURITY_GUARD",
    status: "ACTIVE",
    lastLogin: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: "USR-004",
    name: "Pham Thi Dao",
    email: "dao.pham@tmc.com.vn",
    role: "PRODUCTION_SUPERVISOR",
    status: "ACTIVE",
    lastLogin: new Date(Date.now() - 26 * 3600_000).toISOString(),
  },
  {
    id: "USR-005",
    name: "Hoang Van Em",
    email: "em.hoang@tmc.com.vn",
    role: "EXECUTIVE_MANAGEMENT",
    status: "ACTIVE",
    lastLogin: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  },
  {
    id: "USR-006",
    name: "Do Thi Giang",
    email: "giang.do@tmc.com.vn",
    role: "EMPLOYEE",
    status: "ACTIVE",
    lastLogin: new Date(Date.now() - 55 * 60_000).toISOString(),
    linkedEmployeeId: empA.id,
  },
  {
    id: "USR-007",
    name: "Vu Dinh Hai",
    email: "hai.vu@tmc.com.vn",
    role: "EMPLOYEE",
    status: "INACTIVE",
    lastLogin: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    linkedEmployeeId: empB.id,
  },
  {
    id: "USR-008",
    name: "Duong Thi Lan",
    email: "lan.duong@tmc.com.vn",
    role: "HR_STAFF",
    status: "ACTIVE",
    lastLogin: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
];

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "N-01",
    title: "Gate offline",
    message: "GATE-LA-03 (Long An Production Gate) controller is not responding.",
    time: new Date(Date.now() - 12 * 60_000).toISOString(),
    type: "error",
    read: false,
  },
  {
    id: "N-02",
    title: "Access denied spike",
    message: "8 denied transactions at GATE-BD-01 in the last hour.",
    time: new Date(Date.now() - 46 * 60_000).toISOString(),
    type: "warning",
    read: false,
  },
  {
    id: "N-03",
    title: "Pending synchronization",
    message: "14 transactions are waiting to sync from offline gates.",
    time: new Date(Date.now() - 60 * 60_000).toISOString(),
    type: "warning",
    read: false,
  },
  {
    id: "N-04",
    title: "QR codes revoked",
    message: "5 QR codes were revoked after the security review.",
    time: new Date(Date.now() - 5 * 3600_000).toISOString(),
    type: "info",
    read: true,
  },
  {
    id: "N-05",
    title: "Monthly export ready",
    message: "September payroll attendance export completed (1,352 records).",
    time: new Date(Date.now() - 26 * 3600_000).toISOString(),
    type: "success",
    read: true,
  },
];
