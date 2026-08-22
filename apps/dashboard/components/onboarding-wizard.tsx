"use client";

import { useState } from "react";
import { connectWoo, createStore, scanStore, syncCatalog } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { publicApiBase } from "@/lib/public";
import { useToast } from "@/components/providers";

export function OnboardingWizard() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ storeId: string; widget: string; secret: string } | null>(null);
  const [syncMsg, setSyncMsg] = useState("");

  const snippet = created
    ? `<script src="${publicApiBase()}/widget.js" data-token="${created.widget}" async></script>`
    : "";

  return (
    <>
      <div className="steps-bar" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={n <= step ? "on" : ""} />
        ))}
      </div>
      {step === 1 ? (
        <form
          className="card"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            const form = new FormData(e.currentTarget);
            try {
              const result = await createStore({
                name: String(form.get("name")),
                siteUrl: String(form.get("siteUrl")),
                defaultLocale: String(form.get("defaultLocale")) as "en" | "bn",
                currency: String(form.get("currency")) as "USD" | "BDT",
                allowedDomains: String(form.get("allowedDomains") || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                policies: String(form.get("policies") || "") || undefined,
                storeType: String(form.get("storeType") || "custom") === "woocommerce" ? "woocommerce" : "custom",
              });
              setCreated(result);
              toast("Store created — save the widget token.");
              setStep(2);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not create store");
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Store details</h2>
          <label htmlFor="name">Store name</label>
          <input id="name" name="name" required placeholder="Naksha Ghor" />
          <label htmlFor="siteUrl">Website URL</label>
          <input id="siteUrl" name="siteUrl" type="url" required placeholder="https://yourstore.com" />
          <div className="grid cols-2">
            <div>
              <label htmlFor="defaultLocale">Default language</label>
              <select id="defaultLocale" name="defaultLocale" defaultValue="en">
                <option value="en">English (US)</option>
                <option value="bn">Bengali (Bangladesh)</option>
              </select>
            </div>
            <div>
              <label htmlFor="currency">Currency</label>
              <select id="currency" name="currency" defaultValue="USD">
                <option value="USD">USD</option>
                <option value="BDT">BDT</option>
              </select>
            </div>
          </div>
          <label htmlFor="allowedDomains">Allowed domains</label>
          <input id="allowedDomains" name="allowedDomains" placeholder="yourstore.com" />
          <label htmlFor="storeType">Store type</label>
          <select id="storeType" name="storeType" defaultValue="custom">
            <option value="custom">Custom site (HTML, other platforms)</option>
            <option value="woocommerce">WooCommerce</option>
          </select>
          <label htmlFor="policies">Shipping and returns for the agent</label>
          <textarea id="policies" name="policies" />
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Continue"}
          </button>
        </form>
      ) : null}
      {step === 2 && created ? (
        <div className="card">
          <h2>Catalog</h2>
          <p className="muted">Scan detects a cart platform, then follows shop/product/offer routes. Woo keys are optional and only for a native cart.</p>
          <div className="row">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await scanStore(created.storeId);
                  setSyncMsg(
                    `Detected ${res.probe.kind}. Routed ${res.pages} pages, indexed ${res.count} offers.`,
                  );
                  toast("Site scanned");
                } catch (err) {
                  setSyncMsg(err instanceof Error ? err.message : "Scan failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Scanning…" : "Scan site & offers"}
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await syncCatalog(created.storeId, "crawl");
                  setSyncMsg(`Indexed ${res.count} products.`);
                  toast("Catalog crawled");
                } catch (err) {
                  setSyncMsg(err instanceof Error ? err.message : "Crawl failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Crawl only
            </button>
            <button type="button" className="btn secondary" onClick={() => setStep(3)}>
              Skip for now
            </button>
          </div>
          <form
            style={{ marginTop: 18 }}
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setBusy(true);
              try {
                await connectWoo(created.storeId, {
                  siteUrl: String(form.get("wooUrl")),
                  consumerKey: String(form.get("consumerKey")),
                  consumerSecret: String(form.get("consumerSecret")),
                });
                toast("WooCommerce synced");
                setSyncMsg("WooCommerce connected.");
              } catch (err) {
                setSyncMsg(err instanceof Error ? err.message : "Woo connect failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3>WooCommerce (optional)</h3>
            <label>Store URL</label>
            <input name="wooUrl" type="url" placeholder="https://yourshop.com" />
            <label>Consumer key</label>
            <input name="consumerKey" />
            <label>Consumer secret</label>
            <input name="consumerSecret" type="password" />
            <button type="submit" className="btn secondary" disabled={busy}>
              Connect Woo
            </button>
          </form>
          {syncMsg ? <p className="muted">{syncMsg}</p> : null}
          <div className="row" style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setStep(3)}>
              Next: embed
            </button>
          </div>
        </div>
      ) : null}
      {step === 3 && created ? (
        <div className="card">
          <h2>Embed</h2>
          <p className="muted">Paste before the closing body tag. Widget token is public; secret stays private.</p>
          <label>Snippet</label>
          <div className="snippet">{snippet}</div>
          <div className="row" style={{ margin: "12px 0" }}>
            <CopyButton text={snippet} label="Copy snippet" />
          </div>
          <label>Widget token</label>
          <div className="snippet">{created.widget}</div>
          <label>Secret key</label>
          <div className="snippet">{created.secret}</div>
          <iframe
            title="Demo preview"
            src={`${publicApiBase()}/demo/`}
            style={{ width: "100%", height: 360, border: "1px solid var(--line)", borderRadius: 16, marginTop: 12 }}
          />
          <div className="row" style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setStep(4)}>
              Finish
            </button>
          </div>
        </div>
      ) : null}
      {step === 4 && created ? (
        <div className="card">
          <h2>You are ready</h2>
          <div className="check done">Widget token generated</div>
          <div className="check">Paste the snippet on your site</div>
          <div className="check">Wait for the first shopper conversation</div>
          <a className="btn" href={`/app/stores/${created.storeId}/setup`}>
            Open getting started
          </a>
        </div>
      ) : null}
    </>
  );
}
