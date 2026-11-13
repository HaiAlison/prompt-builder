import type { ModuleKey, RoleName, SystemUser } from "@/types";

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
  refreshToken?: string;
  user: SystemUser;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1";

const TOKEN_KEY = "tmc_access_token";
const REFRESH_TOKEN_KEY = "tmc_refresh_token";
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

export const authService = {
  getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getStoredRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
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

  setSession(accessToken: string, user: SystemUser, refreshToken?: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * POST /api/v1/auth/login
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const url = `${API_BASE_URL.replace(/\/+$/, "")}/auth/login`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // sends and receives HTTP-only cookie
        body: JSON.stringify(credentials),
      });
    } catch (err) {
      throw new AuthApiError(
        err instanceof Error
          ? `Cannot connect to auth server: ${err.message}`
          : "Network connection failed",
        503,
        "Service Unavailable"
      );
    }

    if (!response.ok) {
      let errorMessage = "Invalid email or password";
      let errorTitle = "Unauthorized";

      try {
        const errorData: ApiErrorResponse = await response.json();
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(", ");
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.error) {
          errorTitle = errorData.error;
        }
      } catch {
        errorMessage = `Request failed with status ${response.status}`;
      }

      throw new AuthApiError(errorMessage, response.status, errorTitle);
    }

    const data: LoginResponse = await response.json();
    this.setSession(data.accessToken, data.user, data.refreshToken);
    return data;
  },

  /**
   * GET /api/v1/auth/me
   * Fetches the current authenticated user profile and permissions
   */
  async getMe(): Promise<UserMeResponse> {
    const token = this.getStoredToken();
    const url = `${API_BASE_URL.replace(/\/+$/, "")}/auth/me`;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers,
        credentials: "include",
      });
    } catch (err) {
      throw new AuthApiError(
        err instanceof Error ? err.message : "Failed to fetch user profile",
        503,
        "Network Error"
      );
    }

    if (response.status === 401) {
      // Attempt token refresh if available
      try {
        const refreshed = await this.refreshToken();
        return await this.getMe();
      } catch {
        this.clearSession();
        throw new AuthApiError("Session expired, please login again", 401, "Unauthorized");
      }
    }

    if (!response.ok) {
      throw new AuthApiError(`Failed to fetch user info: ${response.status}`, response.status);
    }

    const userMe: UserMeResponse = await response.json();
    // Synchronize local session user info
    const existingUser = this.getStoredUser();
    const updatedUser: SystemUser = {
      id: userMe.id,
      name: userMe.name,
      email: userMe.email,
      role: userMe.role,
      status: userMe.status,
      linkedEmployeeId: userMe.linkedEmployeeId ?? undefined,
      lastLogin: existingUser?.lastLogin ?? new Date().toISOString(),
    };
    if (token) {
      this.setSession(token, updatedUser);
    }
    return userMe;
  },

  /**
   * POST /api/v1/auth/refresh
   * Refreshes access token via cookie or request body
   */
  async refreshToken(): Promise<LoginResponse> {
    const url = `${API_BASE_URL.replace(/\/+$/, "")}/auth/refresh`;
    const refreshToken = this.getStoredRefreshToken();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        ...(refreshToken ? { refreshToken } : {}),
      }),
    });

    if (!response.ok) {
      this.clearSession();
      throw new AuthApiError("Failed to refresh token", response.status);
    }

    const data: LoginResponse = await response.json();
    this.setSession(data.accessToken, data.user, data.refreshToken);
    return data;
  },

  /**
   * POST /api/v1/auth/logout
   * Invalidates server session and clears client storage
   */
  async logout(): Promise<void> {
    const token = this.getStoredToken();
    const url = `${API_BASE_URL.replace(/\/+$/, "")}/auth/logout`;

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      this.clearSession();
    }
  },
};
