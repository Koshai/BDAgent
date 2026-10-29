import { api } from "@/lib/api";
import { SyncButtons } from "@/components/store-actions";
import { publicApiBase } from "@/lib/public";
import { storeTypeLabel } from "@/lib/store-type";
import Link from "next/link";

type Store = {
  id: string;
  name: string;
  siteUrl: string;
  defaultLocale: string;
  currency: string;
  storeType?: string;
  siteBrief?: string;
  commerceKind?: string;
  cartDetected?: boolean;
  pagesScanned?: number;
  offersFound?: number;
  lastScannedAt?: string | null;
  scanSignals?: { notes?: string; signals?: string[] } | null;
  tokens: Array<{ type: string; prefix: string }>;
  wooConnection: { siteUrl: string; lastSyncedAt: string | null } | null;
  _count: { products: number; conversations: number; events: number };
};

type Analytics = {
  funnel: { chatOpened: number; productClicks: number; addToCart: number };
  conversations: number;
};

export default async function StoreOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ store }, analytics, llm] = await Promise.all([
    api<{ store: Store }>(`/v1/stores/${id}`),
    api<Analytics>(`/v1/stores/${id}/analytics`).catch(() => null),
    fetch(`${publicApiBase()}/health`)
      .then((r) => r.json() as Promise<{ llm?: boolean }>)
      .then((h) => Boolean(h.llm))
      .catch(() => false),
  ]);
  const widget = store.tokens.find((t) => t.type === "widget");
  const catalogDone = store._count.products > 0;
  const carts = analytics?.funnel.addToCart ?? 0;
  const isWoo = store.storeType === "woocommerce";
  const wooHint = isWoo && !store.wooConnection;

  let status: { tone: "ok" | "warn" | "bad"; label: string };
  if (!widget) status = { tone: "bad", label: "No widget token" };
  else if (!catalogDone) status = { tone: "warn", label: "Catalog empty" };
  else if (wooHint) status = { tone: "warn", label: "WooCommerce — REST keys needed for native cart" };
  else status = { tone: "ok", label: "Agent ready" };

  const rows = [
    ["Type", storeTypeLabel(store.storeType)],
    ["Widget", widget ? `Live · ${widget.prefix}…` : "Missing"],
    ["Catalog", catalogDone ? `${store._count.products} products indexed` : "Empty — scan the site"],
    ["Native cart", store.wooConnection ? "Woo keys on file" : isWoo ? "Keys needed" : "Public offers only"],
    ["Shopper AI", llm ? "Dyotona model (on our API)" : "Catalog match only — set OPENAI_API_KEY on the API"],
    ["Inbox", `${store._count.conversations} conversations`],
  ];

  return (
    <>
      <p className="kicker">{store.siteUrl}</p>
      <h1>{store.name}</h1>
      <div className="status-row">
        <span className={`status ${status.tone}`}>
          <i />
          {status.label}
        </span>
        <span className={`pill ${status.tone === "ok" ? "ok" : ""}`}>{storeTypeLabel(store.storeType)}</span>
        <span className="muted">
          {store.defaultLocale === "bn" ? "বাংলা" : "English"} · {store.currency}
        </span>
      </div>
      <div className="metrics">
        <div>
          <span>Attributed carts</span>
          <strong>{carts}</strong>
          <em>from the agent · 30 days</em>
        </div>
        <div>
          <span>Conversations</span>
          <strong>{store._count.conversations}</strong>
          <em>shopper threads</em>
        </div>
        <div>
          <span>Offers indexed</span>
          <strong>{store.offersFound ?? store._count.products}</strong>
          <em>{store.pagesScanned ?? 0} pages scanned</em>
        </div>
      </div>
      <div className="table-scroll" style={{ marginBottom: 24 }}>
      <table className="table">
        <thead>
          <tr>
            <th>Check</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {store.siteBrief ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="panel-title">What the agent knows about this site</h2>
          <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
            {store.siteBrief}
          </p>
        </div>
      ) : null}
      {store.scanSignals?.notes ? <p className="muted">{store.scanSignals.notes}</p> : null}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="panel-title">Catalog</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Scan indexes product title, price, image, and the longest description we can read (JSON-LD, Woo tabs, page
          body). It also reads About / shipping / returns pages on our servers — the shopper site never calls OpenAI.
        </p>
        <SyncButtons storeId={id} hasWoo={Boolean(store.wooConnection)} />
      </div>
      <div className="row">
        <Link className="btn" href={`/app/stores/${id}/setup`}>
          Getting started
        </Link>
        <Link className="btn secondary" href={`/app/stores/${id}/embed`}>
          Embed
        </Link>
        <Link className="btn secondary" href={`/app/stores/${id}/inbox`}>
          Inbox
        </Link>
        {wooHint ? (
          <Link className="btn secondary" href={`/app/stores/${id}/woocommerce`}>
            Add Woo keys
          </Link>
        ) : null}
      </div>
    </>
  );
}
