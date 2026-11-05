import {
  coursesResponseSchema,
  healthSchema,
  parseApiError,
  type CoursesResponse,
} from "@codekita/shared";

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/+$/, "");

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

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      // not JSON — use status text
    }
    throw new ApiError(
      res.status,
      payload,
      parseApiError(payload)?.message ?? res.statusText,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
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