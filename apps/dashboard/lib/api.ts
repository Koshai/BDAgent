import { auth } from "@/auth";

export function apiBase() {
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

function errorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const err = (data as { error?: unknown }).error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") return JSON.stringify(err).slice(0, 300);
  }
  return `Request failed (${status})`;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await auth();
  const method = (init?.method ?? "GET").toUpperCase();
  const needsJsonBody = method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
  const body = init?.body ?? (needsJsonBody ? "{}" : undefined);
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    method,
    body,
    headers: {
      ...(body != null ? { "content-type": "application/json" } : {}),
      ...(session?.accessToken ? { authorization: `Bearer ${session.accessToken}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text.slice(0, 200) };
    }
  }
  if (!res.ok) {
    throw new Error(errorMessage(data, res.status));
  }
  return data as T;
}
