import type { ModuleKey, RoleName, SystemUser } from "@/types";
import { api, axiosInstance } from "./api";
import axios from "axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserMeResponse {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: "ACTIVE" | "INACTIVE";
  linkedEmployeeId: string | null;
  permissions: ModuleKey[];
}

export interface LoginResponse {
  accessToken: string;
  user: SystemUser;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp?: string;
}

const TOKEN_KEY = "tmc_access_token";
const USER_KEY = "tmc_user_session";

export class AuthApiError extends Error {
  statusCode: number;
  error: string;

  constructor(message: string, statusCode = 400, error = "Bad Request") {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

function parseAxiosError(err: unknown, defaultMessage = "Request failed"): AuthApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status || 500;
    const responseData = err.response?.data as ApiErrorResponse | undefined;

    let message = defaultMessage;
    if (responseData) {
      if (Array.isArray(responseData.message)) {
        message = responseData.message.join(", ");
      } else if (responseData.message) {
        message = responseData.message;
      }
    } else if (err.message) {
      message = err.message;
    }

    const title = responseData?.error || err.code || "Error";
    return new AuthApiError(message, status, title);
  }

  if (err instanceof Error) {
    return new AuthApiError(err.message, 500, "Error");
  }

  return new AuthApiError(defaultMessage, 500, "Error");
}

export const authService = {
  getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getStoredUser(): SystemUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SystemUser;
    } catch {
      return null;
    }
  },

  setSession(accessToken: string, user: SystemUser): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const data = await api.post<LoginResponse>("/auth/login", credentials);
      this.setSession(data.accessToken, data.user);
      return data;
    } catch (err) {
      throw parseAxiosError(err, "Invalid email or password");
    }
  },

  /**
   * GET /auth/me
   */
  async getMe(): Promise<UserMeResponse> {
    const token = this.getStoredToken();
    try {
      const userMe = await api.get<UserMeResponse>("/auth/me");
      const existingUser = this.getStoredUser();
      const updatedUser: SystemUser = {
        id: userMe.id,
        name: userMe.name,
        email: userMe.email,
        role: userMe.role,
        status: userMe.status,
        linkedEmployeeId: userMe.linkedEmployeeId ?? null,
        lastLogin: existingUser?.lastLogin ?? new Date().toISOString(),
      };
      if (token) {
        this.setSession(token, updatedUser);
      }
      return userMe;
    } catch (err) {
      throw parseAxiosError(err, "Failed to fetch user profile");
    }
  },

  /**
   * POST /auth/refresh
   * Trình duyệt tự động gửi kèm HTTP-only cookie (refreshToken)
   */
  async refreshToken(): Promise<LoginResponse> {
    try {
      const data = await api.post<LoginResponse>("/auth/refresh");
      this.setSession(data.accessToken, data.user);
      return data;
    } catch (err) {
      this.clearSession();
      throw parseAxiosError(err, "Failed to refresh token");
    }
  },

  /**
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      this.clearSession();
    }
  },
};
