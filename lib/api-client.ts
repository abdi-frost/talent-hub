/**
 * apiClient — a typed fetch wrapper for use in Client Components.
 *
 * Every method:
 * • sends/receives JSON
 * • throws ApiClientError on non-2xx responses (carries the structured error payload)
 * • lets you use the `useApiCall` hook to auto-pipe errors to the global overlay
 *
 * Usage:
 *   const talent = await apiClient.post<SingleResponse<Talent>>("/api/talents", payload);
 */
import type { ApiErrorResponse } from "./response";

export class ApiClientError extends Error {
  readonly status: number;
  readonly errorData: ApiErrorResponse["error"];

  constructor(errorData: ApiErrorResponse["error"], status: number) {
    super(errorData.message);
    this.name = "ApiClientError";
    this.status = status;
    this.errorData = errorData;
  }
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  // 204 No Content — return undefined cast to T
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errorData: ApiErrorResponse["error"] =
      body && typeof body === "object" && "error" in body
        ? (body as ApiErrorResponse).error
        : { code: "HTTP_ERROR", message: res.statusText || "Request failed" };

    throw new ApiClientError(errorData, res.status);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(url: string, init?: Omit<RequestInit, "method" | "body">) =>
    apiFetch<T>(url, { ...init, method: "GET" }),

  post: <T>(url: string, data: unknown, init?: Omit<RequestInit, "method" | "body">) =>
    apiFetch<T>(url, { ...init, method: "POST", body: JSON.stringify(data) }),

  put: <T>(url: string, data: unknown, init?: Omit<RequestInit, "method" | "body">) =>
    apiFetch<T>(url, { ...init, method: "PUT", body: JSON.stringify(data) }),

  patch: <T>(url: string, data: unknown, init?: Omit<RequestInit, "method" | "body">) =>
    apiFetch<T>(url, { ...init, method: "PATCH", body: JSON.stringify(data) }),

  delete: <T = void>(url: string, init?: Omit<RequestInit, "method" | "body">) =>
    apiFetch<T>(url, { ...init, method: "DELETE" }),
};
