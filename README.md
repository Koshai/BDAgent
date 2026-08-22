# BDAgent

Embeddable AI shopping agent for small and medium ecommerce sites. Merchants paste a script tag; shoppers chat in **English** or **Bengali**; owners get catalog-aware suggestions and basic analytics.

**[Getting started](./docs/getting-started.md)** · **[Railway](./docs/railway.md)** · **[All docs](./docs/README.md)** · in-app: [http://localhost:3000/docs](http://localhost:3000/docs)

## Apps

- `apps/dashboard` — merchant portal (Next.js, Auth.js)
- `apps/api` — widget runtime, catalog sync, chat, analytics (Fastify + Prisma)
- `packages/widget` — Shadow DOM chat bundle (`widget.js`)
- `packages/shared` — i18n, Zod schemas, event types

## Quick start

You need Node 20+, pnpm, and Docker.

```bash
# Windows
copy .env.example apps\api\.env
copy .env.example apps\dashboard\.env.local

# macOS / Linux
cp .env.example apps/api/.env
cp .env.example apps/dashboard/.env.local

pnpm db:up
pnpm install
pnpm db:push
pnpm db:seed
pnpm --filter @bdagent/widget build
pnpm dev
```

| | URL |
| --- | --- |
| Dashboard | [http://localhost:3000](http://localhost:3000) · app [http://localhost:3000/app](http://localhost:3000/app) |
| Docs | [http://localhost:3000/docs](http://localhost:3000/docs) |
| Catalog demo | [http://localhost:4000/demo/](http://localhost:4000/demo/) |
| WooCommerce demo | [http://localhost:4000/demo/woo/](http://localhost:4000/demo/woo/) |
| API health | [http://localhost:4000/health](http://localhost:4000/health) |

Seeded merchant: `merchant@bdagent.dev` / `password123`

## Install on a store

```html
<script
  src="http://localhost:4000/widget.js"
  data-token="wgt_YOUR_TOKEN"
  async>
</script>
```

The **widget token** is public and domain-locked. The **secret key** stays in the dashboard. Full walkthrough: [merchant guide](./docs/merchant-guide.md).

## Catalog

- **Crawl** — public JSON-LD / Open Graph / listing markup
- **WooCommerce** — REST consumer key/secret the merchant pastes (native cart + order lookup)

Optional LLM: set `OPENAI_API_KEY` in `apps/api/.env`. Without a key, the agent still returns catalog matches.

## Stack

PostgreSQL 16 (Docker on port **55432**), Fastify, Next.js 15, Auth.js credentials, Vite IIFE widget.
