"use client";

import { useToast } from "@/components/providers";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { connectWoo, disconnectWoo, rotateToken, scanStore, syncCatalog, updateStore } from "@/app/actions";

export function SyncButtons({ storeId, hasWoo }: { storeId: string; hasWoo: boolean }) {
  const toast = useToast();
  const [msg, setMsg] = useState("");
  async function run(mode: "crawl" | "woo") {
    setMsg("Syncing…");
    try {
      const res = await syncCatalog(storeId, mode);
      const text = `Indexed ${res.count} products from ${res.source}.`;
      setMsg(text);
      toast(text);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Sync failed");
    }
  }
  async function scan() {
    setMsg("Detecting cart platform and routing offers…");
    try {
      const res = await scanStore(storeId);
      const text = `${res.probe.kind} · ${res.pages} pages · ${res.count} offers`;
      setMsg(text);
      toast(text);
      window.location.reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Scan failed");
    }
  }
  return (
    <div>
      <div className="row">
        <button type="button" onClick={() => void scan()}>
          Scan site & offers
        </button>
        <button type="button" className="btn secondary" onClick={() => run("crawl")}>
          Crawl only
        </button>
        <button type="button" className="btn secondary" disabled={!hasWoo} onClick={() => run("woo")}>
          Sync WooCommerce
        </button>
      </div>
      {msg ? <p className="muted">{msg}</p> : null}
    </div>
  );
}

export function RotateToken({ storeId, apiBase }: { storeId: string; apiBase: string }) {
  const toast = useToast();
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<"widget" | "secret" | "">("");
  const [busy, setBusy] = useState(false);

  async function rotate(type: "widget" | "secret") {
    if (
      !window.confirm(
        type === "widget"
          ? "This replaces the live widget token. The old snippet will stop working until you paste the new one."
          : "This replaces the secret key. Anything using the old secret will fail.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await rotateToken(storeId, type);
      setKind(type);
      setValue(res.token);
      await navigator.clipboard.writeText(res.token);
      toast("New token copied to clipboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setBusy(false);
    }
  }

  const snippet =
    kind === "widget" && value
      ? `<script src="${apiBase}/widget.js" data-token="${value}" async></script>`
      : "";

  return (
    <div style={{ marginTop: 18 }}>
      <h2>Rotate tokens</h2>
      <p className="muted">
        The full token is shown once. We only store a hash, so copy it now and update the script on your site.
      </p>
      <div className="row">
        <button type="button" className="btn secondary" disabled={busy} onClick={() => void rotate("widget")}>
          Rotate widget token
        </button>
        <button type="button" className="btn secondary" disabled={busy} onClick={() => void rotate("secret")}>
          Rotate secret key
        </button>
      </div>
      {value ? (
        <div style={{ marginTop: 16 }}>
          <p className="muted">
            New {kind === "widget" ? "widget token" : "secret key"} (also copied to your clipboard)
          </p>
          <div className="snippet">{value}</div>
          <div className="row" style={{ marginTop: 10 }}>
            <CopyButton text={value} label="Copy token again" />
            {snippet ? <CopyButton text={snippet} label="Copy embed snippet" /> : null}
          </div>
          {snippet ? (
            <>
              <p className="muted" style={{ marginTop: 14 }}>
                Replace the old script tag with this:
              </p>
              <div className="snippet">{snippet}</div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function WooForm({ storeId, connected }: { storeId: string; connected: boolean }) {
  const [msg, setMsg] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setMsg("Connecting…");
        try {
          await connectWoo(storeId, {
            siteUrl: String(form.get("siteUrl")),
            consumerKey: String(form.get("consumerKey")),
            consumerSecret: String(form.get("consumerSecret")),
          });
          setMsg("Connected and synced.");
          window.location.reload();
        } catch (err) {
          setMsg(err instanceof Error ? err.message : "Connect failed");
        }
      }}
    >
      <label htmlFor="siteUrl">Store URL</label>
      <input id="siteUrl" name="siteUrl" type="url" required placeholder="https://yourshop.com" />
      <label htmlFor="consumerKey">Consumer key</label>
      <input id="consumerKey" name="consumerKey" required />
      <label htmlFor="consumerSecret">Consumer secret</label>
      <input id="consumerSecret" name="consumerSecret" type="password" required />
      <div className="row">
        <button type="submit">{connected ? "Update & sync" : "Connect & sync"}</button>
        {connected ? (
          <button
            type="button"
            className="btn danger"
            onClick={async () => {
              await disconnectWoo(storeId);
              window.location.reload();
            }}
          >
            Disconnect
          </button>
        ) : null}
      </div>
      {msg ? <p className="muted">{msg}</p> : null}
    </form>
  );
}

export function SettingsForm({
  store,
}: {
  store: {
    id: string;
    name: string;
    siteUrl: string;
    defaultLocale: string;
    currency: string;
    allowedDomains: string[];
    policies: string | null;
    storeType?: string;
    autoSyncDaily?: boolean;
    autoSyncHourUtc?: number;
  };
}) {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setMsg("Saving…");
        try {
          await updateStore(store.id, {
            name: form.get("name"),
            siteUrl: form.get("siteUrl"),
            defaultLocale: form.get("defaultLocale"),
            currency: form.get("currency"),
            allowedDomains: String(form.get("allowedDomains") || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            policies: String(form.get("policies") || "") || null,
            storeType: String(form.get("storeType") || "custom") === "woocommerce" ? "woocommerce" : "custom",
            autoSyncDaily: form.get("autoSyncDaily") === "on",
            autoSyncHourUtc: Number(form.get("autoSyncHourUtc") || 0),
          });
          setMsg("Saved.");
        } catch (err) {
          setMsg(err instanceof Error ? err.message : "Save failed");
        }
      }}
    >
      <label htmlFor="name">Name</label>
      <input id="name" name="name" defaultValue={store.name} required />
      <label htmlFor="siteUrl">Website URL</label>
      <input id="siteUrl" name="siteUrl" type="url" defaultValue={store.siteUrl} required />
      <div className="grid cols-2">
        <div>
          <label htmlFor="defaultLocale">Default language</label>
          <select id="defaultLocale" name="defaultLocale" defaultValue={store.defaultLocale}>
            <option value="en">English</option>
            <option value="bn">Bengali</option>
          </select>
        </div>
        <div>
          <label htmlFor="currency">Currency</label>
          <select id="currency" name="currency" defaultValue={store.currency}>
            <option value="USD">USD</option>
            <option value="BDT">BDT</option>
          </select>
        </div>
      </div>
      <label htmlFor="allowedDomains">Allowed domains</label>
      <input id="allowedDomains" name="allowedDomains" defaultValue={store.allowedDomains.join(", ")} />
      <label htmlFor="storeType">Store type</label>
      <select id="storeType" name="storeType" defaultValue={store.storeType === "woocommerce" ? "woocommerce" : "custom"}>
        <option value="custom">Custom site</option>
        <option value="woocommerce">WooCommerce</option>
      </select>
      <label htmlFor="autoSyncDaily">Catalog auto-sync</label>
      <label className="check-row">
        <input id="autoSyncDaily" type="checkbox" name="autoSyncDaily" defaultChecked={Boolean(store.autoSyncDaily)} />
        <span>
          Auto-sync every day
          <em>Runs once daily at the UTC hour below. Woo stores use Woo sync; others use crawl.</em>
        </span>
      </label>
      <label htmlFor="autoSyncHourUtc">Auto-sync hour (UTC)</label>
      <select id="autoSyncHourUtc" name="autoSyncHourUtc" defaultValue={String(store.autoSyncHourUtc ?? 0)}>
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h}>{String(h).padStart(2, "0")}:00 UTC</option>
        ))}
      </select>
      <label htmlFor="policies">Agent policies</label>
      <textarea id="policies" name="policies" defaultValue={store.policies ?? ""} />
      <button type="submit">Save settings</button>
      {msg ? <p className="muted">{msg}</p> : null}
    </form>
  );
}


