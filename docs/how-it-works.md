# How it works

## Pieces

```
Shopper browser          API (:4000)              Dashboard (:3000)
─────────────────        ────────────             ────────────────
widget.js (IIFE)  ──►    /v1/widget/bootstrap
                         /v1/widget/chat (SSE)
                         /v1/widget/events
                         catalog in Postgres  ◄──  scan / Woo sync
                         inbox replies        ◄──  merchant UI
```

- **Dashboard** — Auth.js credentials, store CRUD, inbox, analytics.
- **API** — Fastify, Prisma, Postgres. Serves `widget.js` and `/demo/`.
- **Widget** — Vite IIFE, Shadow DOM, bilingual UI.

## What the widget does not do

It does not call OpenAI. Shopper messages go to **Dyotona’s API**. Catalog lookup, site notes, and the model run there. The merchant storefront never holds an API key.

It does not scrape the current page HTML as the source of truth for answers. Products and a short site brief are indexed on scan. The current URL is extra context.

## Store type

Each store is **Custom site** or **WooCommerce**. You set it when creating the store; scan will set WooCommerce if public markup / `/wp-json/` says so.

## What scan indexes

- Product: title, URL, image, price, currency, stock when present, categories, **description** (JSON-LD, Woo description tabs, product page body — up to ~8k characters). Listing-only cards may start with title/price until the product URL is crawled.
- Site notes: About, shipping, returns, FAQ, contact (summarized with the platform LLM when `OPENAI_API_KEY` is set on the API).

Chat uses retrieved products plus those site notes. It does not send the whole live site on every message.

## Add to cart

If a suggested product has a numeric Woo `externalId`, the widget requests:

`{location.origin}/?add-to-cart={id}`

with cookies, so the cart is the **shop’s** cart on that origin. Generic crawl products without a numeric id use a local demo cart event only.

For that to work, the snippet must run on the same origin as Woo (not only inside an iframe on another host).

## Scan vs Woo connect

| | Scan | Woo REST |
| --- | --- | --- |
| Keys | None | Merchant-pasted `ck_` / `cs_` |
| Offers | Public markup | Catalog API |
| Native cart | Only if ids appear in HTML | Yes, via `externalId` |
| Order lookup | No | Yes, billing email match |

## Out of scope

No Meta / WhatsApp / Messenger / Instagram apps, no Shopify App Store listing, no courier SaaS. Woo REST with keys the merchant already has is the integration path.
