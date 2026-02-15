import axios, { type AxiosInstance } from "axios";

/**
 * Resolve base URL for API calls.
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable (staging/production).
 * 2. Browser's window.location.origin (local dev / relative deployments).
 * 3. Empty string fallback for SSR.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Create an Axios instance pre-configured with:
 * - baseURL pointing to /api/v1
 * - JSON content type
 * - Bearer token interceptor from localStorage
 *
 * Use this for services that authenticate via Bearer token.
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use(
    (config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  return client;
};
