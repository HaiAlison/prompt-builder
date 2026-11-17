import api from "./api";
import type { Factory } from "@/types";

export const factoryService = {
  async list(): Promise<Factory[]> {
    const res = await api.get<Factory[] | { data: Factory[] }>("/factory");
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  async getById(id: string): Promise<Factory> {
    return api.get<Factory>(`/factory/${id}`);
  },
};
