import api from "./api";
import type { Department, IPaginatedResponse } from "@/types";
import { DEPARTMENTS } from "./system.service";

export interface DepartmentListParams {
  q?: string;
  factoryId?: string;
}

export const departmentService = {
  async list(params: DepartmentListParams = {}): Promise<Department[]> {
    try {
      const res = await api.get<IPaginatedResponse<Department> | Department[]>("/departments", { params });
      const list = Array.isArray(res) ? res : (res?.results ?? (res as any)?.data ?? []);
      return list;
    } catch (err) {
      console.warn("Failed to fetch departments from API, using fallback:", err);
      let rows = DEPARTMENTS;
      if (params.factoryId && params.factoryId !== "ALL") {
        rows = rows.filter((d) => d.factoryId === params.factoryId);
      }
      if (params.q?.trim()) {
        const q = params.q.trim().toLowerCase();
        rows = rows.filter((d) => d.name.toLowerCase().includes(q));
      }
      return rows;
    }
  },

  async getById(id: string): Promise<Department> {
    return api.get<Department>(`/departments/${id}`);
  },

  async create(data: { name: string; factoryId: string }): Promise<Department> {
    return api.post<Department>("/departments", data);
  },

  async update(id: string, data: Partial<{ name: string; factoryId: string }>): Promise<Department> {
    return api.patch<Department>(`/departments/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/departments/${id}`);
  },
};
