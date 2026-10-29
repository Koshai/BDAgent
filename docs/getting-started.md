# Getting started

**In the dashboard:** sign in, open a store, then **Getting started** in the sidebar (`/app/stores/{id}/setup`). That page has your domains, scan buttons, and a copyable snippet.

## 1. Run it locally

You need **Node.js 20+**, **pnpm**, and **Docker** (Postgres).

From the repo root:

```bash
# Windows (PowerShell)
copy .env.example apps\api\.env
copy .env.example apps\dashboard\.env.local

# macOS / Linux
cp .env.example apps/api/.env
cp .env.example apps/dashboard/.env.local
```

Then:

```bash
pnpm db:up
pnpm install
pnpm db:push
pnpm db:seed
pnpm --filter @bdagent/widget build
pnpm dev
```

Or split terminals:

```bash
pnpm dev:api
pnpm dev:dashboard
```

Open:

| What | URL |
| --- | --- |
| Marketing | http://localhost:3000 |
| Merchant app | http://localhost:3000/app |
| Docs (this product) | http://localhost:3000/docs |
| Catalog demo | http://localhost:4000/demo/ |
| WooCommerce demo | http://localhost:4000/demo/woo/ |
| API health | http://localhost:4000/health |

Seeded login: `merchant@bdagent.dev` / `password123`

Optional LLM: set `OPENAI_API_KEY` in `apps/api/.env`. Without it, chat still returns catalog matches.

If `prisma generate` fails on Windows with `EPERM` on `query_engine-windows.dll.node`, stop `pnpm dev:api`, generate, then start the API again.

Production host: [dyotona.com via Railway](./railway.md) (`dyotona.com` → dashboard, `api.dyotona.com` → API).

## 2. First store (10 minutes)

1. Sign in at `/login` (or register).
2. **Add a store** — name, public site URL, default language, currency. Allowed domains default to the site hostname; add extra hosts if the shop is served from `www` or a staging domain.
3. **Index the catalog** — **Scan site & offers** on Overview, or connect WooCommerce REST keys and sync.
4. **Embed** — copy the snippet and widget token onto the live site (before `</body>`).
5. Load a product page, open the chat bubble, ask in English or বাংলা.

The full token is shown **once** at create (and once after rotate). After that the dashboard only stores a prefix and a hash.

## 3. Checklist

- [ ] Widget token pasted; chat bubble appears
- [ ] Allowed domains include the host shoppers use
- [ ] Catalog has products (crawl and/or Woo sync)
- [ ] Woo stores: REST keys saved if you want `/?add-to-cart=` and order lookup
- [ ] Policies text filled in Settings (shipping, returns) so the agent can quote them

Next: [Merchant guide](./merchant-guide.md) · [Local demos](./demos.md)
