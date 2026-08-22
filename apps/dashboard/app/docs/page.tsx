import Link from "next/link";

export const metadata = { title: "Getting started · BDAgent" };

export default function DocsHome() {
  return (
    <>
      <p className="kicker">For store owners</p>
      <h1>Getting started</h1>
      <p className="lede">
        Put the agent on your shop in four steps. No app-store install, no renamed URLs. One script tag and a product
        index.
      </p>

      <p>
        If you already have a store in the dashboard, use the in-app guide — it fills in your domains and snippet:{" "}
        <Link href="/app">Open Getting started</Link>.
      </p>

      <h2>1. Add your store</h2>
      <ol>
        <li>
          <Link href="/register">Create an account</Link> (or <Link href="/login">sign in</Link>).
        </li>
        <li>
          Add a store: name, public website URL, language (English or Bengali), currency.
        </li>
        <li>
          Save the <strong>widget token</strong> when it appears. It is shown once. The secret key stays in the
          dashboard — do not put it on the site.
        </li>
      </ol>

      <h2>2. Index products</h2>
      <p>
        Open the store → Getting started → <strong>Scan site &amp; offers</strong>. That reads public product markup
        (JSON-LD, Open Graph, Woo loops) without changing your theme.
      </p>
      <p>
        WooCommerce: paste a Read REST key (WooCommerce → Settings → Advanced → REST API) if you want the real cart (
        <code>/?add-to-cart=</code>) and order lookup. Details: <Link href="/docs/woocommerce">WooCommerce</Link>.
      </p>

      <h2>3. Paste the snippet</h2>
      <pre>{`<script
  src="https://YOUR_API/widget.js"
  data-token="wgt_YOUR_TOKEN"
  async>
</script>`}</pre>
      <p>
        Put it before <code>&lt;/body&gt;</code> on every page (theme footer or a “header and footer” plugin). Do not
        rebuild the site or rename <code>/bags</code>, <code>/?p=123</code>, or other existing paths.
      </p>
      <p>
        Allowed domains in Settings must include the host shoppers use (<code>yourstore.com</code> and{" "}
        <code>www</code> if both are live).
      </p>
      <p>
        Step-by-step for HTML vs WordPress: <Link href="/docs/widget">Embed &amp; tokens</Link>.
      </p>

      <h2>4. Check it</h2>
      <ol>
        <li>Load a product page on the live domain.</li>
        <li>Open the chat bubble (bottom right).</li>
        <li>Ask for a product you sell, in English or বাংলা.</li>
        <li>You should see a product card. Threads also appear under Inbox.</li>
      </ol>

      <p>
        <Link className="btn" href="/register">
          Create an account
        </Link>{" "}
        <Link className="btn secondary" href="/app">
          I already have a store
        </Link>
      </p>
    </>
  );
}
