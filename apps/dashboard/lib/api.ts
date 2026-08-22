import { auth } from "@/auth";

export function apiBase() {
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
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
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
