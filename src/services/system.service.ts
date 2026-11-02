import type { Department, Factory, Role, SystemConfig, SystemUser } from "@/types";
import { MOCK_USERS, ROLES } from "@/mocks/users";
import { DEFAULT_CONFIG, PAYROLL_EXPORTS } from "@/mocks/reports";
import { notifyDataChanged } from "./bus";

function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const FACTORIES: Factory[] = [
  {
    id: "BD",
    name: "Binh Duong Factory",
    address: "VSIP II, Road 5, Binh Duong Province",
    status: "ACTIVE",
  },
  {
    id: "LA",
    name: "Long An Factory",
    address: "Long An Industrial Park, Tan An City, Long An Province",
    status: "ACTIVE",
  },
];

export const DEPARTMENTS: Department[] = [
  { id: "BD-PROD", name: "Production", factoryId: "BD" },
  { id: "BD-QC", name: "Quality Control", factoryId: "BD" },
  { id: "BD-WH", name: "Warehouse", factoryId: "BD" },
  { id: "BD-MNT", name: "Maintenance", factoryId: "BD" },
  { id: "BD-HR", name: "HR & Admin", factoryId: "BD" },
  { id: "BD-ACC", name: "Accounting", factoryId: "BD" },
  { id: "BD-IT", name: "IT", factoryId: "BD" },
  { id: "BD-SEC", name: "Security", factoryId: "BD" },
  { id: "LA-PROD", name: "Production", factoryId: "LA" },
  { id: "LA-QC", name: "Quality Control", factoryId: "LA" },
  { id: "LA-WH", name: "Warehouse", factoryId: "LA" },
  { id: "LA-MNT", name: "Maintenance", factoryId: "LA" },
  { id: "LA-HR", name: "HR & Admin", factoryId: "LA" },
  { id: "LA-ACC", name: "Accounting", factoryId: "LA" },
  { id: "LA-IT", name: "IT", factoryId: "LA" },
  { id: "LA-SEC", name: "Security", factoryId: "LA" },
];

let config: SystemConfig = { ...DEFAULT_CONFIG };

export const systemService = {
  async listUsers(): Promise<SystemUser[]> {
    return delay(MOCK_USERS);
  },

  async createUser(input: Omit<SystemUser, "id" | "lastLogin">): Promise<SystemUser> {
    const user: SystemUser = {
      ...input,
      id: `USR-${String(MOCK_USERS.length + 1).padStart(3, "0")}`,
      lastLogin: null,
    };
    MOCK_USERS.push(user);
    notifyDataChanged();
    return delay(user, 350);
  },

  async updateUser(id: string, patch: Partial<SystemUser>): Promise<SystemUser | undefined> {
    const user = MOCK_USERS.find((u) => u.id === id);
    if (user) {
      Object.assign(user, patch);
      notifyDataChanged();
    }
    return delay(user, 250);
  },

  async listRoles(): Promise<Role[]> {
    return delay(ROLES, 60);
  },

  async listFactories(): Promise<Factory[]> {
    return delay(FACTORIES, 60);
  },

  async updateFactory(id: string, patch: Partial<Factory>): Promise<Factory | undefined> {
    const f = FACTORIES.find((x) => x.id === id);
    if (f) {
      Object.assign(f, patch);
      notifyDataChanged();
    }
    return delay(f, 250);
  },

  async listDepartments(): Promise<Department[]> {
    return delay(DEPARTMENTS, 60);
  },

  async createDepartment(input: Omit<Department, "id">): Promise<Department> {
    const dep: Department = {
      ...input,
      id: `${input.factoryId}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    };
    DEPARTMENTS.push(dep);
    notifyDataChanged();
    return delay(dep, 300);
  },

  async deleteDepartment(id: string): Promise<void> {
    const idx = DEPARTMENTS.findIndex((d) => d.id === id);
    if (idx >= 0) DEPARTMENTS.splice(idx, 1);
    notifyDataChanged();
    return delay(undefined, 250);
  },

  async getConfig(): Promise<SystemConfig> {
    return delay(config, 60);
  },

  async saveConfig(patch: Partial<SystemConfig>): Promise<SystemConfig> {
    config = { ...config, ...patch };
    notifyDataChanged();
    return delay(config, 300);
  },
};
