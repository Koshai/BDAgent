import Link from "next/link";
import { BRAND, PROD_HOSTS } from "@/lib/brand";

export const metadata = { title: `Getting started · ${BRAND.name}` };

export default function DocsHome() {
  return (
    <>
      <p className="kicker">For store owners</p>
      <h1>Getting started</h1>
      <p className="lede">
        Put {BRAND.name} ({BRAND.nameBn}) on your shop in four steps. One script tag, a product index, and chat in
        English or বাংলা—no app-store install and no renamed storefront URLs.
      </p>

      <p>
        Already have a store? Use the in-app guide (it fills domains and the snippet):{" "}
        <Link href="/app">Open the dashboard</Link>.
      </p>

      <h2>1. Add your store</h2>
      <ol>
        <li>
          <Link href="/register">Create an account</Link> (or <Link href="/login">sign in</Link>).
        </li>
        <li>Add a store: name, public website URL, default language (English or Bengali), currency.</li>
        <li>
          Copy the <strong>widget token</strong> when it appears—it is shown once. The secret key stays in the dashboard;
          never put it on the site.
        </li>
      </ol>

      <h2>2. Index products</h2>
      <p>
        Open the store → Getting started → <strong>Scan site &amp; offers</strong>. {BRAND.name} reads public product
        markup (JSON-LD, Open Graph, Woo loops) without changing your theme.
      </p>
      <p>
        WooCommerce: paste a Read REST key (WooCommerce → Settings → Advanced → REST API) if you want the native cart (
        <code>/?add-to-cart=</code>) and order lookup. Details: <Link href="/docs/woocommerce">WooCommerce</Link>.
      </p>

      <h2>3. Paste the snippet</h2>
      <pre>{`<script
  src="${PROD_HOSTS.api}/widget.js"
  data-token="wgt_YOUR_TOKEN"
  async>
</script>`}</pre>
      <p>
        Put it before <code>&lt;/body&gt;</code> on every page (theme footer or a header/footer plugin). Do not rebuild
        the site or rename paths like <code>/bags</code> or <code>/?p=123</code>.
      </p>
      <p>
        In Settings → Allowed domains, include every host shoppers use (e.g. <code>yourstore.com</code> and{" "}
        <code>www.yourstore.com</code>).
      </p>
      <p>
        HTML vs WordPress placement: <Link href="/docs/widget">Embed &amp; tokens</Link>.
      </p>

      <h2>4. Check it</h2>
      <ol>
        <li>Load a product page on the live domain.</li>
        <li>Open the chat bubble (bottom right).</li>
        <li>Ask for something you sell, in English or বাংলা.</li>
        <li>You should see a product card. Threads also appear under Inbox.</li>
      </ol>

      <p className="docs-actions">
        <Link className="btn" href="/register">
          Create an account
        </Link>
        <Link className="btn secondary" href="/app">
          I already have a store
        </Link>
      </p>
    </>
  );
}
