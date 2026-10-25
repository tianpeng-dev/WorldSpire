import { getDeviceId } from "@/store/local-db";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (typeof window !== "undefined" && (options.method ?? "GET").toUpperCase() === "POST" && !path.startsWith("/api/auth/sign-")) {
    headers.set("X-WordSpire-Device-Id", await getDeviceId());
  }
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: "include",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiError("NETWORK_ERROR", 0, error);
  }

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      if (response.ok) throw new ApiError("INVALID_RESPONSE", 502, error);
      payload = raw;
    }
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? String((payload as { error: unknown }).error)
      : `REQUEST_FAILED_${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

export { isChildPreviewMode as isDemoMode } from "./preview-mode";

export async function apiOrDemo<T>(
  path: string,
  fallback: T,
  demo = false,
  options?: RequestOptions,
): Promise<T> {
  if (demo) return fallback;
  return apiRequest<T>(path, options);
}
