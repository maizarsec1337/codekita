import {
  coursesResponseSchema,
  healthSchema,
  apiErrorSchema,
  type CoursesResponse,
} from "@codekita/shared";
import { apiBase } from "./mode";

const API_BASE = apiBase.replace(/\/+$/, "");

function validateApiBase() {
  if (API_BASE === "/api" || API_BASE.startsWith("/api/")) return;
  if (API_BASE.startsWith("/")) throw new ApiError(0, null, "VITE_API_URL must be an HTTPS URL or a same-origin /api path.");
  let url: URL;
  try { url = new URL(API_BASE); }
  catch { throw new ApiError(0, null, "VITE_API_URL must be a valid absolute HTTPS URL or a same-origin /api path."); }
  if (url.protocol !== "https:" && (typeof window === "undefined" || window.location.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new ApiError(0, null, "The production API must use HTTPS.");
  }
  if (url.username || url.password) throw new ApiError(0, null, "API URLs must not contain credentials.");
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API error ${statusCode}`);
    this.name = "ApiError";
  }
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  validateApiBase();
  const url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(init.method ?? "GET")) {
    // Fetch for each mutation so session rotation and separate tabs cannot leave a stale token.
    let response: Response;
    try { response = await fetch(`${API_BASE}/auth/csrf-token`, { credentials: "include", signal: AbortSignal.timeout(15000), headers: { Accept: "application/json" } }); }
    catch { throw new ApiError(0, null, "Could not reach the CodeKita API. Check its HTTPS URL, CORS configuration, and network availability."); }
    if (!response.ok) throw new ApiError(response.status, null, "Unable to establish a secure request. Try again.");
    let payload: unknown;
    try { payload = await response.json(); }
    catch { throw new ApiError(response.status, null, "The API did not return a valid CSRF response. Check the backend URL."); }
    const token = payload && typeof payload === "object" && "token" in payload ? payload.token : undefined;
    if (typeof token !== "string" || !token) throw new ApiError(response.status, null, "The API returned an invalid CSRF token.");
    headers.set("X-CSRF-TOKEN", token);
  }
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(15000), credentials: "include", headers });
  } catch {
    throw new ApiError(0, null, "Could not reach the CodeKita API. Check its HTTPS URL, CORS configuration, and network availability.");
  }

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      // not JSON — use status text
    }
    const parsedError = apiErrorSchema.safeParse(payload);
    throw new ApiError(
      res.status,
      payload,
      parsedError.success ? parsedError.data.message : res.statusText || `API error ${res.status}`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }
  try { return await res.json() as T; }
  catch { throw new ApiError(res.status, null, "The CodeKita API returned an invalid or non-JSON response."); }
}

export const api = {
  health: () =>
    request("/health").then((data) =>
      healthSchema.parse(data) as {
        status: string;
        timestamp: string;
        services: { application: string; database: string };
      },
    ),

  courses: (params?: { page?: number; limit?: number }) => {
    const search = params
      ? `?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)]),
          ),
        )}`
      : "";
    return request<CoursesResponse>(`/courses${search}`).then((data) =>
      coursesResponseSchema.parse(data),
    );
  },

  auth: {
    login: (email: string, password: string) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    register: (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
    ) =>
      request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, firstName, lastName }),
      }),

    me: () => request("/auth/me"),

    logout: () => request("/auth/logout", { method: "POST" }),

    csrfToken: () => request("/auth/csrf-token"),
  },
};