"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { RotateToken, SyncButtons } from "@/components/store-actions";

const SEED_TOKENS: Record<string, string> = {
  wgt_local_de: "wgt_local_demo_token_abcdefghijk123",
  wgt_local_wo: "wgt_local_woo_token_abcdefghijk123",
};

type Platform = "html" | "wordpress";

export function SetupGuide({
  storeId,
  siteUrl,
  apiBase,
  allowedDomains,
  widgetPrefix,
  productCount,
  hasWoo,
  wooDetected,
}: {
  storeId: string;
  siteUrl: string;
  apiBase: string;
  allowedDomains: string[];
  widgetPrefix?: string;
  productCount: number;
  hasWoo: boolean;
  wooDetected: boolean;
}) {
  const seeded = widgetPrefix ? SEED_TOKENS[widgetPrefix] : undefined;
  const [token, setToken] = useState(seeded ?? "");
  const [platform, setPlatform] = useState<Platform>(wooDetected || hasWoo ? "wordpress" : "html");

  const snippet = useMemo(() => {
    const t = token.trim() || "wgt_YOUR_TOKEN";
    return `<script\n  src="${apiBase}/widget.js"\n  data-token="${t}"\n  async>\n</script>`;
  }, [apiBase, token]);

  const hostReady = allowedDomains.length > 0;
  const catalogReady = productCount > 0;
  const snippetReady = Boolean(token.trim());

  return (
    <div className="setup-list">
      <section className="setup-step">
        <header>
          <span className={`setup-num ${hostReady ? "done" : ""}`}>1</span>
          <div>
            <h2>Allow your shop domain</h2>
            <p className="muted">The chat only loads on hosts you list. Use the hostname shoppers type, including www if that is live.</p>
          </div>
        </header>
        <p>
          Site: <a href={siteUrl} target="_blank" rel="noreferrer">{siteUrl}</a>
        </p>
        {hostReady ? (
          <p>
            Allowed:{" "}
            {allowedDomains.map((d) => (
              <code key={d} style={{ marginRight: 8 }}>
                {d}
              </code>
            ))}
          </p>
        ) : (
          <p className="muted">No domains listed yet — add the shop hostname.</p>
        )}
        <Link className="btn secondary" href={`/app/stores/${storeId}/settings`}>
          Edit domains
        </Link>
      </section>

      <section className="setup-step">
        <header>
          <span className={`setup-num ${catalogReady ? "done" : ""}`}>2</span>
          <div>
            <h2>Index your products</h2>
            <p className="muted">
              The agent answers from a synced catalog, not by reading the page on every message. Scan first; add Woo keys
              if you want a native cart.
            </p>
          </div>
        </header>
        <p>
          {catalogReady ? `${productCount} products indexed.` : "No products yet — scan the site."}
        </p>
        <SyncButtons storeId={storeId} hasWoo={hasWoo} />
        {wooDetected && !hasWoo ? (
          <p style={{ marginTop: 12 }}>
            This looks like WooCommerce.{" "}
            <Link href={`/app/stores/${storeId}/woocommerce`}>Paste REST keys</Link> for add-to-cart and order lookup.
          </p>
        ) : null}
        <p className="muted" style={{ marginTop: 10 }}>
          <Link href={`/app/stores/${storeId}/products`}>Open catalog</Link>
        </p>
      </section>

      <section className="setup-step">
        <header>
          <span className={`setup-num ${snippetReady ? "done" : ""}`}>3</span>
          <div>
            <h2>Paste this on your site</h2>
            <p className="muted">One script, before the closing body tag. You do not need to rename pages or rebuild the shop.</p>
          </div>
        </header>

        <div className="setup-tabs">
          <button type="button" className={platform === "html" ? "btn" : "btn secondary"} onClick={() => setPlatform("html")}>
            HTML / custom
          </button>
          <button
            type="button"
            className={platform === "wordpress" ? "btn" : "btn secondary"}
            onClick={() => setPlatform("wordpress")}
          >
            WordPress / Woo
          </button>
        </div>

        {platform === "html" ? (
          <ol className="setup-ol">
            <li>Open the layout or footer file that wraps every page.</li>
            <li>Paste the snippet just before <code>&lt;/body&gt;</code>.</li>
            <li>Publish, then load a product page.</li>
          </ol>
        ) : (
          <ol className="setup-ol">
            <li>In WordPress, use a footer snippet plugin (WPCode, Insert Headers and Footers) → Footer.</li>
            <li>Or Appearance → Theme File Editor → <code>footer.php</code>, before <code>&lt;/body&gt;</code>.</li>
            <li>Paste the snippet, update the file, then view a product on the live domain.</li>
          </ol>
        )}

        <label htmlFor="widget-token">Widget token</label>
        <input
          id="widget-token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={widgetPrefix ? `${widgetPrefix}…` : "wgt_…"}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="muted">
          Paste the token you saved when the store was created. If it is gone, rotate below — the old script will stop
          working until you replace it.
        </p>

        <div className="snippet">{snippet}</div>
        <div className="row" style={{ marginTop: 12 }}>
          <CopyButton text={snippet} label="Copy snippet" />
          {token.trim() ? <CopyButton text={token.trim()} label="Copy token" /> : null}
        </div>
        <RotateToken storeId={storeId} apiBase={apiBase} />
      </section>

      <section className="setup-step">
        <header>
          <span className="setup-num">4</span>
          <div>
            <h2>Check it works</h2>
            <p className="muted">The bubble sits at the bottom-right. Chat is English or বাংলা.</p>
          </div>
        </header>
        <ol className="setup-ol">
          <li>
            Open{" "}
            <a href={siteUrl} target="_blank" rel="noreferrer">
              {siteUrl}
            </a>{" "}
            on the allowed domain (not a preview iframe on another host).
          </li>
          <li>Confirm the chat button appears. If it does not, the token or domain is wrong.</li>
          <li>Ask for a product you sell. You should see a card from the catalog.</li>
          <li>Woo shops: “Add to cart” on a card uses the shop’s own cart. Order lookup needs billing email.</li>
        </ol>
        <div className="row">
          <a className="btn" href={siteUrl} target="_blank" rel="noreferrer">
            Open shop
          </a>
          <Link className="btn secondary" href={`/app/stores/${storeId}/inbox`}>
            Open inbox
          </Link>
        </div>
      </section>
    </div>
  );
}
