import type { DailySummary, AttendanceStatus } from "@/types";
import { mulberry32, randInt, type Rng } from "./rand";

const SURNAMES = [
  "Nguyen",
  "Tran",
  "Le",
  "Pham",
  "Hoang",
  "Vu",
  "Dang",
  "Bui",
  "Do",
  "Ngo",
  "Duong",
  "Ly",
  "Mai",
  "Trinh",
  "Phan",
  "Vo",
  "Dinh",
  "Luong",
  "Ta",
  "Ha",
];

const MIDDLE_M = ["Van", "Hung", "Duc", "Quoc", "Thanh", "Ngoc", "Minh", "Tuan", "Khanh", "Bao"];
const MIDDLE_F = ["Thi", "Ngoc", "Thanh", "Thu", "Hong", "Mai", "Kim", "Dieu", "My", "Bich"];
const GIVEN_M = [
  "An",
  "Binh",
  "Cuong",
  "Dung",
  "Duy",
  "Giang",
  "Hai",
  "Hieu",
  "Hoang",
  "Hung",
  "Khanh",
  "Kien",
  "Lam",
  "Long",
  "Manh",
  "Nam",
  "Phong",
  "Quang",
  "Son",
  "Tan",
  "Thang",
  "Tien",
  "Toan",
  "Trung",
  "Tuan",
  "Viet",
  "Vu",
];
const GIVEN_F = [
  "Anh",
  "Chi",
  "Diep",
  "Dung",
  "Giang",
  "Ha",
  "Hanh",
  "Hoa",
  "Hue",
  "Huong",
  "Lan",
  "Lien",
  "Linh",
  "Mai",
  "Nga",
  "Ngan",
  "Nhi",
  "Nhung",
  "Oanh",
  "Phuong",
  "Quyen",
  "Sim",
  "Tam",
  "Thao",
  "Trang",
  "Trinh",
  "Tuyet",
  "Uyen",
  "Xuan",
  "Yen",
];

export const DEPARTMENT_DEFS = [
  { key: "PROD", name: "Production" },
  { key: "QC", name: "Quality Control" },
  { key: "WH", name: "Warehouse" },
  { key: "MNT", name: "Maintenance" },
  { key: "HR", name: "HR & Admin" },
  { key: "ACC", name: "Accounting" },
  { key: "IT", name: "IT" },
  { key: "SEC", name: "Security" },
] as const;

const POSITIONS: Record<string, string[]> = {
  Production: [
    "Operator",
    "Line Leader",
    "Machine Operator",
    "Technician",
    "Production Supervisor",
    "Shift Leader",
  ],
  "Quality Control": ["QC Inspector", "QC Supervisor", "QA Engineer", "QC Team Leader"],
  Warehouse: ["Storekeeper", "Forklift Driver", "Warehouse Supervisor", "Packing Staff"],
  Maintenance: ["Electrical Technician", "Mechanical Technician", "Maintenance Supervisor"],
  "HR & Admin": ["HR Officer", "Admin Officer", "Receptionist", "Payroll Officer"],
  Accounting: ["Accountant", "Chief Accountant", "Costing Officer"],
  IT: ["IT Support", "System Administrator", "Software Developer", "Network Engineer"],
  Security: ["Security Guard", "Security Supervisor", "Gate Keeper"],
};

const DOMAINS = ["tmc.com.vn", "tmc-manufacturing.vn"];

export interface GeneratedEmployee {
  id: string;
  fullName: string;
  departmentId: string;
  departmentName: string;
  position: string;
  factoryId: "BD" | "LA";
  email: string;
  phone: string;
  employmentStatus: import("@/types").EmploymentStatus;
  hireDate: string;
  dateOfBirth: string;
  gender: "M" | "F";
}

export function generateEmployees(): GeneratedEmployee[] {
  const rng = mulberry32(20261030);
  const out: GeneratedEmployee[] = [];
  const counts: Record<"BD" | "LA", number> = { BD: 0, LA: 0 };
  const targets: Record<"BD" | "LA", number> = { BD: 812, LA: 604 };
  const statusRoll = (): import("@/types").EmploymentStatus => {
    const r = rng();
    if (r < 0.86) return "ACTIVE";
    if (r < 0.92) return "PROBATION";
    if (r < 0.96) return "ON_LEAVE";
    if (r < 0.98) return "SUSPENDED";
    return "TERMINATED";
  };

  for (const factoryId of ["BD", "LA"] as const) {
    for (const dept of DEPARTMENT_DEFS) {
      const deptId = `${factoryId}-${dept.key}`;
      // Production is by far the largest department.
      const share =
        dept.key === "PROD"
          ? 0.52
          : dept.key === "QC"
            ? 0.12
            : dept.key === "WH"
              ? 0.1
              : dept.key === "MNT"
                ? 0.07
                : dept.key === "SEC"
                  ? 0.07
                  : 0.03;
      const n = Math.max(4, Math.round(targets[factoryId] * share));
      for (let i = 0; i < n; i++) {
        counts[factoryId]++;
        const gender: "M" | "F" = rng() < 0.55 ? "M" : "F";
        const middle = gender === "M" ? MIDDLE_M : MIDDLE_F;
        const given = gender === "M" ? GIVEN_M : GIVEN_F;
        const fullName = `${SURNAMES[Math.floor(rng() * SURNAMES.length)]} ${middle[Math.floor(rng() * middle.length)]} ${given[Math.floor(rng() * given.length)]}`;
        const posList = POSITIONS[dept.name] ?? [];
        const position = posList[Math.floor(rng() * posList.length)]!;
        const seq = String(counts[factoryId]).padStart(4, "0");
        const birthYear = randInt(rng, 1975, 2005);
        const hireYear = randInt(rng, 2015, 2026);
        out.push({
          id: `TMC-${factoryId}-${seq}`,
          fullName,
          departmentId: deptId,
          departmentName: dept.name,
          position,
          factoryId,
          email: `${fullName
            .toLowerCase()
            .replace(/[^a-z ]/g, "")
            .split(" ")
            .filter(Boolean)
            .slice(-2)
            .join(".")}${counts[factoryId] % 7}@${DOMAINS[Math.floor(rng() * DOMAINS.length)]!}`,
          phone: `+84 9${randInt(rng, 10, 99)} ${randInt(rng, 100, 999)} ${randInt(rng, 100, 999)}`,
          employmentStatus: statusRoll(),
          hireDate: `${hireYear}-${String(randInt(rng, 1, 12)).padStart(2, "0")}-${String(randInt(rng, 1, 28)).padStart(2, "0")}`,
          dateOfBirth: `${birthYear}-${String(randInt(rng, 1, 12)).padStart(2, "0")}-${String(randInt(rng, 1, 28)).padStart(2, "0")}`,
          gender,
        });
      }
    }
  }
  return out;
}

/** Faces a deterministic "shift start" of 07:45 (07:30 + grace). */
export const SHIFT_START_MINUTES = 7 * 60 + 30;
export const LATE_THRESHOLD_MINUTES = 15;

/** Deterministic per-employee/day leave flag. */
export function isOnLeaveThatDay(employeeId: string, dateKey: string): boolean {
  let h = 0;
  for (const c of employeeId + dateKey) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100 < 3;
}

/** Deterministic per-employee/day "absent" flag for eligible employees. */
export function isAbsentThatDay(employeeId: string, dateKey: string): boolean {
  let h = 0;
  for (const c of employeeId + dateKey + "abs") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100 < 5;
}

export function seededRngFor(dateKey: string): Rng {
  let seed = 0;
  for (const c of dateKey) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  return mulberry32(seed);
}
