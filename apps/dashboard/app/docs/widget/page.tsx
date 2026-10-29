export const metadata = { title: "Embed & tokens · Dyotona" };

export default function DocsWidget() {
  return (
    <>
      <p className="kicker">Docs</p>
      <h1>Embed & tokens</h1>
      <p className="lede">One script tag. No route changes. Works on custom shops and WooCommerce.</p>

      <h2>Snippet</h2>
      <pre>{`<script
  src="http://localhost:4000/widget.js"
  data-token="wgt_YOUR_TOKEN"
  async>
</script>`}</pre>
      <p>
        In production, <code>src</code> must be your API origin — the host that serves <code>/widget.js</code>.
      </p>

      <h2>Tokens</h2>
      <ul>
        <li>
          <strong>Widget</strong> (<code>wgt_…</code>) — public, goes in the script. Identifies the store.
        </li>
        <li>
          <strong>Secret</strong> (<code>sec_…</code>) — dashboard only. Never paste it on the storefront.
        </li>
      </ul>
      <p>
        Rotate from Embed. Confirm, then copy immediately. The dashboard stores hashes, not the full token.
      </p>

      <h2>Allowed domains</h2>
      <p>
        Widget API calls are locked to hostnames in Settings (for example <code>yourstore.com</code>). Include{" "}
        <code>www</code> if that is what shoppers use. Locally, <code>localhost</code> is always allowed.
      </p>

      <h2>Where to paste</h2>
      <p>
        <strong>HTML / custom:</strong> layout or footer file, immediately before <code>&lt;/body&gt;</code>.
      </p>
      <p>
        <strong>WordPress / WooCommerce:</strong> a footer snippet plugin, or Appearance → Theme File Editor →{" "}
        <code>footer.php</code> before <code>&lt;/body&gt;</code>. You do not need a WooCommerce.com app.
      </p>
      <p>
        Signed-in merchants should use <strong>Getting started</strong> in the app — it builds the snippet for that
        store.
      </p>
    </>
  );
}
