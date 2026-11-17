import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from "axios";
import { authService } from "./auth.service";

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || '';
export const axiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL.replace(/\/+$/, ""),
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Request Interceptor: Tự động đính kèm accessToken
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = authService.getStoredToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// Response Interceptor: Xử lý 401 & gọi refresh token qua cookie
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const ignoredPaths = ["/auth/login", "/auth/refresh", "/auth/mfa/verify-login"];
        const isIgnoredPath = ignoredPaths.some((path) => originalRequest.url?.includes(path));

        if (error.response?.status === 401 && !originalRequest._retry && !isIgnoredPath) {
            originalRequest._retry = true;

            try {
                // Backend tự nhận refreshToken qua HTTP-only cookie
                const refreshResponse = await axiosInstance.post<{
                    accessToken?: string;
                    data?: { accessToken?: string; access_token?: string };
                }>("/auth/refresh");

                const newAccessToken =
                    refreshResponse.data?.accessToken ||
                    refreshResponse.data?.data?.accessToken ||
                    refreshResponse.data?.data?.access_token;

                if (!newAccessToken) {
                    throw new Error("No access token returned from refresh endpoint");
                }

                const currentUser = authService.getStoredUser();
                if (currentUser) {
                    authService.setSession(newAccessToken, currentUser);
                }

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                return axiosInstance(originalRequest);
            } catch (refreshError) {
                authService.clearSession();
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

// Generic API methods: GET, POST, PUT, PATCH, DELETE
export const api = {
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return axiosInstance.get<T>(url, config).then((res) => res.data);
    },
    post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
        return axiosInstance.post<T>(url, data, config).then((res) => res.data);
    },
    put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
        return axiosInstance.put<T>(url, data, config).then((res) => res.data);
    },
    patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
        return axiosInstance.patch<T>(url, data, config).then((res) => res.data);
    },
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return axiosInstance.delete<T>(url, config).then((res) => res.data);
    },
};

export default api;
