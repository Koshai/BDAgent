# Host BDAgent on Railway (no custom domain yet)

Use three Railway services from this repo: **Postgres**, **API**, **dashboard**. Clients keep their shop on `www.itsmyshop.com`; they only paste your Railway widget snippet.

## 1. Create the project

1. Push this repo to GitHub (private is fine).
2. [Railway](https://railway.app) → **New project** → **Deploy from GitHub**.
3. Add a **Postgres** plugin to the project (Railway → **+ New** → **Database** → **PostgreSQL**).

Do not deploy the GitHub repo as a single catch-all service. Add **two empty services** instead, then point each at this repo with a different Dockerfile.

## 2. API service

**+ New** → **GitHub repo** → this repository.

| Setting | Value |
| --- | --- |
| Dockerfile path | `Dockerfile.api` |
| Healthcheck path | `/health` |

**Variables** (service → Variables):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Share from the Postgres service (Railway **Variable reference**) |
| `JWT_SECRET` | Long random string (32+ chars) |
| `ENCRYPTION_KEY` | 64 hex chars (32 bytes). Keep the local default only for dev. |
| `OPENAI_API_KEY` | Your OpenAI key |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `NODE_ENV` | `production` |

Railway sets `PORT` itself. The API already listens on `PORT` (fallback `API_PORT` / 4000).

Generate a production encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

After the first deploy, copy the public URL, e.g. `https://bdagent-api-production.up.railway.app`.

Optional seed (once, from your laptop, with the Railway `DATABASE_URL`):

```bash
# in apps/api, with DATABASE_URL pointing at Railway Postgres
pnpm db:seed
```

Do not seed automatically on every deploy.

## 3. Dashboard service

**+ New** → same GitHub repo.

| Setting | Value |
| --- | --- |
| Dockerfile path | `Dockerfile.dashboard` |

**Variables:**

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | Long random string (32+ chars) |
| `NEXTAUTH_URL` | Public dashboard URL, e.g. `https://bdagent-dashboard-production.up.railway.app` |
| `NEXT_PUBLIC_API_URL` | Public **API** URL from step 2 |
| `API_INTERNAL_URL` | Same as `NEXT_PUBLIC_API_URL` (or the API private Railway URL if you prefer) |
| `AUTH_TRUST_HOST` | `true` |
| `NODE_ENV` | `production` |

`NEXT_PUBLIC_API_URL` is baked into the Next.js client bundle at **build** time. Set it **before** the first successful dashboard build. If you change the API URL later, **redeploy** the dashboard.

After the first dashboard deploy, set `NEXTAUTH_URL` to the real `https://….up.railway.app` URL if you guessed it, then redeploy.

## 4. Connect the two URLs

1. Open `https://YOUR-API.up.railway.app/health` → `{ "ok": true, … }`.
2. Open `https://YOUR-DASH.up.railway.app` → marketing / login.
3. Open `https://YOUR-API.up.railway.app/demo/` and `/demo/woo/` → local mock shops, now public.

## 5. First merchant (client on their own domain)

Example client site: `https://www.itsmyshop.com`.

1. Sign in on the Railway dashboard (seeded `merchant@bdagent.dev` / `password123` if you ran seed — **change the password** before sharing).
2. Create a store:
   - Website URL: `https://www.itsmyshop.com`
   - Allowed domains: `itsmyshop.com`, `www.itsmyshop.com`
3. Scan catalog or connect Woo REST keys.
4. Embed snippet on **their** site (not on Railway):

```html
<script
  src="https://YOUR-API.up.railway.app/widget.js"
  data-token="wgt_THEIR_TOKEN"
  async>
</script>
```

Shop HTML stays on `itsmyshop.com`. Chat, catalog, and OpenAI run on your Railway API.

## 6. Demo stores on Railway

For a client walkthrough without their live shop:

| Store | Website URL | Allowed domains |
| --- | --- | --- |
| Naksha Ghor | `https://YOUR-API.up.railway.app/demo/` | `YOUR-API.up.railway.app` |
| Ghor Mart | `https://YOUR-API.up.railway.app/demo/woo/` | `YOUR-API.up.railway.app` |

Update those URLs in **Settings** after deploy (they still say `localhost:4000` from seed). Then scan / detect color again.

## 7. Common failures

| Symptom | Fix |
| --- | --- |
| Dashboard login “invalid email or password” | API is down, or `NEXT_PUBLIC_API_URL` / `API_INTERNAL_URL` still localhost |
| Widget missing / 403 domain | Add the shop hostname to Allowed domains |
| `/widget.js` 404 | API image built without `pnpm --filter @bdagent/widget build` (use `Dockerfile.api`) |
| Prisma SSL / connect error | Use the Railway Postgres `DATABASE_URL` reference; wait until Postgres is running |
| Dashboard auth redirect loop | `NEXTAUTH_URL` must be the public `https://` dashboard URL, no trailing path |

Learner (`pnpm dev:learner`) is local-only for now. Do not add it as a Railway service until you want training data on the host.
