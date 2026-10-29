import { BRAND, PROD_HOSTS } from "@/lib/brand";

export const metadata = { title: `WooCommerce · ${BRAND.name}` };

export default function DocsWoo() {
  return (
    <>
      <p className="kicker">Docs</p>
      <h1>WooCommerce</h1>
      <p className="lede">
        Paste the REST keys you already create in WordPress. Same JS snippet as any other store. No WooCommerce.com app.
      </p>

      <h2>Connect</h2>
      <ol>
        <li>In WordPress: WooCommerce → Settings → Advanced → REST API → Add key (Read).</li>
        <li>On the store’s WooCommerce page in {BRAND.name}, paste site URL, consumer key, and consumer secret.</li>
        <li>Sync catalog so products get numeric Woo ids.</li>
      </ol>
      <p>Keys are encrypted at rest. You can disconnect anytime.</p>

      <h2>What keys unlock</h2>
      <ul>
        <li>
          Catalog sync from <code>/wp-json/wc/v3/products</code>
        </li>
        <li>
          Native add-to-cart from the widget: <code>{`GET /?add-to-cart={id}`}</code> on the <strong>shop origin</strong>{" "}
          (the snippet must run on that domain)
        </li>
        <li>Order lookup: order number + billing email</li>
      </ul>

      <h2>Embed</h2>
      <pre>{`<script
  src="${PROD_HOSTS.api}/widget.js"
  data-token="wgt_YOUR_TOKEN"
  async>
</script>`}</pre>

      <h2>Hosted stand-in</h2>
      <p>
        <a href={`${PROD_HOSTS.api}/demo/woo/`} target="_blank" rel="noreferrer">
          {PROD_HOSTS.api.replace("https://", "")}/demo/woo/
        </a>{" "}
        is HTML + mock REST (not WordPress). Sample order <code>1001</code> / <code>shopper@example.com</code>. Locally
        the same demo is at <code>http://localhost:4000/demo/woo/</code>.
      </p>
    </>
  );
}
