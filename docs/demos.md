# Local demos

Both demos are static HTML served by the API. They are not a live WordPress install.

## Naksha Ghor (catalog / crawl)

- Storefront: http://localhost:4000/demo/
- Seeded store: **Naksha Ghor**
- Widget token: `wgt_local_demo_token_abcdefghijk123`
- Catalog source: crawl / JSON-LD on product pages

Use this to try bilingual chat against a generic shop.

## Ghor Mart (WooCommerce stand-in)

- Storefront: http://localhost:4000/demo/woo/
- Seeded store: **Ghor Mart**
- Widget token: `wgt_local_woo_token_abcdefghijk123`
- Mock REST origin: http://localhost:4000 (`/wp-json/wc/v3/...`)
- Demo keys: `ck_demo_key_local` / `cs_demo_secret_local` (already saved on the seeded store)

Classic Woo signals on the page: `woocommerce`, `add_to_cart_button`, `ajax_add_to_cart`, `data-product_id`.

Add to cart uses `http://localhost:4000/?add-to-cart=101` (and 102, 103), then a cookie `bdagent_woo_cart` and `/demo/woo/cart.html`.

Sample order: **1001** billed to **shopper@example.com** (status `processing`).

`/shop` and `/cart` on `:4000` redirect into this demo so site scan sees familiar Woo paths.

Re-seed after a reset:

```bash
pnpm db:seed
```
