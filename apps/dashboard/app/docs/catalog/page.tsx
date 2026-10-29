import Link from "next/link";
import { BRAND, PROD_HOSTS } from "@/lib/brand";

export const metadata = { title: `Catalog · ${BRAND.name}` };

export default function DocsCatalog() {
  return (
    <>
      <p className="kicker">Docs</p>
      <h1>Catalog</h1>
      <p className="lede">
        Answers come from a synced product index, not from scraping the page on every chat message. Keep the index in
        step with the shop.
      </p>

      <h2>Scan site &amp; offers</h2>
      <p>
        On Overview, run a scan. {BRAND.name} fetches the store URL, common listing paths, sitemap when present, then
        product markup: JSON-LD, Open Graph, Woo loop attributes, and same-host links one click from the homepage.
      </p>
      <p>
        Scan also classifies the store as <strong>Custom site</strong> or <strong>WooCommerce</strong> from public HTML
        and <code>/wp-json/</code>. You can set the type when you create the store or in Settings.
      </p>
      <p>
        Product pages store title, price, image, and the longest description available. Scan also reads About / shipping /
        returns pages into a site brief for the agent.
      </p>

      <h2>Nightly auto-sync</h2>
      <p>
        In Settings you can enable automatic re-indexing so the catalog stays fresh without a manual scan every day.
      </p>

      <h2>When to use Woo REST instead</h2>
      <p>
        If the shop is WooCommerce and you want real <code>/?add-to-cart=</code> plus order lookup, paste REST keys on
        the WooCommerce page. See <Link href="/docs/woocommerce">WooCommerce</Link>.
      </p>

      <h2>Policies</h2>
      <p>
        Shipping and returns text in Settings is included as context so the agent can quote your rules instead of
        inventing them.
      </p>

      <h2>Public demos</h2>
      <ul>
        <li>
          <a href={`${PROD_HOSTS.api}/demo/`} target="_blank" rel="noreferrer">
            Catalog demo
          </a>
        </li>
        <li>
          <a href={`${PROD_HOSTS.api}/demo/woo/`} target="_blank" rel="noreferrer">
            WooCommerce demo
          </a>
        </li>
      </ul>
    </>
  );
}
