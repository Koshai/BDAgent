"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { api } from "@/lib/api";

export async function createStore(input: {
  name: string;
  siteUrl: string;
  defaultLocale: "en" | "bn";
  currency: "USD" | "BDT";
  allowedDomains: string[];
  policies?: string;
  storeType: "custom" | "woocommerce";
}) {
  const data = await api<{ store: { id: string }; tokens: { widget: string; secret: string } }>(
    "/v1/stores",
    { method: "POST", body: JSON.stringify(input) },
  );
  return { storeId: data.store.id, widget: data.tokens.widget, secret: data.tokens.secret };
}

export async function updateStore(id: string, input: Record<string, unknown>) {
  return api(`/v1/stores/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function rotateToken(id: string, type: "widget" | "secret") {
  return api<{ type: string; token: string; prefix: string }>(`/v1/stores/${id}/tokens/rotate`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

export async function scanStore(id: string) {
  return api<{
    pages: number;
    count: number;
    probe: {
      kind: string;
      cartDetected: boolean;
      confidence: number;
      signals: string[];
      notes: string;
    };
  }>(`/v1/stores/${id}/scan`, { method: "POST" });
}

export async function syncCatalog(id: string, mode: "crawl" | "woo") {
  return api<{ count: number; source: string }>(`/v1/stores/${id}/catalog/sync`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export async function connectWoo(id: string, input: { siteUrl: string; consumerKey: string; consumerSecret: string }) {
  return api(`/v1/stores/${id}/woocommerce`, { method: "POST", body: JSON.stringify(input) });
}

export async function disconnectWoo(id: string) {
  return api(`/v1/stores/${id}/woocommerce`, { method: "DELETE" });
}

export async function replyToConversation(storeId: string, conversationId: string, content: string) {
  return api(`/v1/stores/${storeId}/conversations/${conversationId}/reply`, {
    method: "POST",
    body: JSON.stringify({ content, handoff: true }),
  });
}

export async function setConversationHandoff(storeId: string, conversationId: string, active: boolean) {
  return api(`/v1/stores/${storeId}/conversations/${conversationId}/handoff`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}

export async function detectWidgetColor(id: string) {
  return api<{
    store: { widgetPrimaryColor: string; widgetColorManual: boolean };
    detectedColor: string;
    usedFallback?: boolean;
  }>(`/v1/stores/${id}/widget-color/detect`, { method: "POST", body: "{}" });
}

export async function signOutAction() {
  // Clear session without Auth.js absolute redirect (that used NEXTAUTH_URL /
  // apex dyotona.com and broke when only www was live). Stay on the current host.
  await signOut({ redirect: false });
  redirect("/");
}
