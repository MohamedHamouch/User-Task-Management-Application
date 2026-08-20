import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ── Shared types ─────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "client" | "worker";
}

export interface ApiTask {
  id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  client_id: number;
  worker_id: number | null;
  created_at: string;
  updated_at: string;
  client?: ApiUser;
  worker?: ApiUser | null;
}

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach the Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear local auth state so the app redirects to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Error helper ──────────────────────────────────────────────────────────────

/**
 * Extract a human-readable message from an Axios error response.
 * Laravel returns { message, errors } on validation failures.
 */
export function getErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (data?.errors) {
      return Object.values(data.errors as Record<string, string[]>)
        .flat()
        .join(" ");
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
