# API reference

Base URL locally: `http://localhost:4000`

Merchant routes expect `Authorization: Bearer <dashboard session JWT>` (the dashboard proxies this). Widget routes use the public widget token as a query or header as implemented in each handler.

## Health

`GET /health` → `{ ok, service }`

## Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/v1/auth/register` | email, name, password |
| POST | `/v1/auth/login` | email, password |
| GET | `/v1/me` | current user |

## Stores

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/stores` | list |
| POST | `/v1/stores` | create; response includes one-time `tokens.widget` and `tokens.secret` |
| GET | `/v1/stores/:id` | detail, token prefixes, Woo connection summary |
| PATCH | `/v1/stores/:id` | name, URL, locale, currency, domains, policies |
| POST | `/v1/stores/:id/tokens/rotate` | body `{ type: "widget" \| "secret" }`; returns full token once |
| GET | `/v1/stores/:id/products` | indexed catalog |

## Catalog

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/v1/stores/:id/catalog/sync` | crawl and/or Woo fetch |
| POST | `/v1/stores/:id/scan` | classify platform + crawl offers |

## WooCommerce

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/stores/:id/woocommerce` | connection metadata (no secrets) |
| POST | `/v1/stores/:id/woocommerce` | `siteUrl`, `consumerKey`, `consumerSecret` |
| DELETE | `/v1/stores/:id/woocommerce` | disconnect |

## Inbox

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/stores/:id/conversations` | list |
| GET | `/v1/stores/:id/conversations/:cid` | thread |
| POST | `/v1/stores/:id/conversations/:cid/reply` | merchant message |
| POST | `/v1/stores/:id/conversations/:cid/handoff` | pause LLM for that thread |

## Analytics

`GET /v1/stores/:id/analytics`

## Widget (public, domain-locked)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/widget/bootstrap` | store name, locale, flags |
| POST | `/v1/widget/chat` | SSE tokens + product cards |
| POST | `/v1/widget/events` | page view, clicks, add-to-cart |
| POST | `/v1/widget/order-status` | Woo order + billing email |
| GET | `/v1/widget/messages` | merchant replies for the open conversation |

## Static / demo (local)

| Path | Notes |
| --- | --- |
| `/widget.js` | built IIFE |
| `/demo/` | Naksha Ghor |
| `/demo/woo/` | Ghor Mart |
| `/wp-json`, `/wp-json/wc/v3/*` | Woo demo mock (Basic auth for catalog/orders) |
| `/?add-to-cart={id}` | Woo demo cart cookie |
