# Merchant guide

## Embed the widget

```html
<script
  src="https://api.dyotona.com/widget.js"
  data-token="wgt_YOUR_TOKEN"
  async>
</script>
```

Locally use `http://localhost:4000/widget.js` instead.

The widget loads in a Shadow DOM. It does not require renaming routes. Unusual paths (`/bags`, `/?p=123`) keep working.

### Tokens

| Token | Where it lives | Purpose |
| --- | --- | --- |
| Widget (`wgt_…`) | Public, in the script tag | Identifies the store to `/v1/widget/*` |
| Secret (`sec_…`) | Dashboard only | Not used on the storefront |

Rotate from **Embed**. Confirm, then copy immediately — the new value is not stored in plaintext.

### Allowed domains

Widget calls are checked against **Allowed domains** in Settings (hostname only, e.g. `yourstore.com`). Subdomains match if you listed the parent. In local development, `localhost` and `127.0.0.1` are always allowed.

## Catalog

Chat is grounded on **indexed products**, not on scraping the current HTML for every message. After you add products or services, run **Scan site & offers** or **Sync WooCommerce**. The next chat uses the updated index.

## Agent voice

Each store has an **Agent** page (tone, reply length, alternatives, clarifying questions, optional complement, optional email, extra notes). A shop-bounded system prompt is always on: this catalog and policies only; extra notes cannot override that.

### Scan / crawl (any site)

**Scan site & offers** fetches the store URL, common listing paths, sitemap/robots when present, then product markup:

- JSON-LD `Product` / `Offer` / `ItemList`
- Open Graph / product meta
- Woo loop markup (`data-product_id`, `add_to_cart_button`)
- Linked pages (depth 0–1, same host) so odd listing URLs still get found

Scan also classifies Woo / Shopify / Magento / generic from public HTML and `/wp-json/` namespaces. Classification does **not** install platform apps.

### WooCommerce REST (recommended for Woo shops)

In WordPress: WooCommerce → Settings → Advanced → REST API → add a key with **read** access. Paste site URL, consumer key (`ck_…`), and consumer secret (`cs_…`) on the store’s **WooCommerce** page.

That enables:

- Product sync with numeric `externalId`
- Same-origin add-to-cart: `GET {shop-origin}/?add-to-cart={id}` (classic Woo)
- Order lookup in the widget (order number + **billing email**)

Keys are encrypted at rest. Dyotona does not use the WooCommerce.com App Store.

## Inbox and handoff

Shopper threads appear under **Inbox**. You can reply; the widget polls for merchant messages.

**Handoff** pauses the LLM for that conversation so a human owns the thread.

## Order status

On a connected Woo store, shoppers can look up an order with number + billing email. Demo: order `1001` and `shopper@example.com` on [Ghor Mart](./demos.md).

## Languages

UI and model replies follow `navigator.language` (`bn` / `bn-BD` → Bengali) or the store default. Shoppers can toggle EN / বাংলা.

## Analytics

Overview and Analytics show opens, product clicks, and attributed add-to-carts (including Woo `/?add-to-cart=` when the widget issues it).
