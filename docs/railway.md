# Host Dyotona on Railway (+ dyotona.com)

Use three Railway services from this repo: **Postgres**, **API**, **dashboard**. Clients keep their shop on their own domain; they only paste your widget snippet from `api.dyotona.com`.

## Target URLs (production)

| Host | Railway service | Purpose |
| --- | --- | --- |
| `https://dyotona.com` and `https://www.dyotona.com` | **Dashboard** | Marketing, login, merchant app |
| `https://api.dyotona.com` | **API** | Widget, chat, catalog, demos |

Widget embeds look like:

```html
<script src="https://api.dyotona.com/widget.js" data-token="wgt_…" async></script>
```

---

## 1. Create the project

1. Push this repo to GitHub (private is fine).
2. [Railway](https://railway.app) → **New project** → **Deploy from GitHub**.
3. Add a **Postgres** plugin (**+ New** → **Database** → **PostgreSQL**).

Do not deploy the repo as one catch-all service. Add **two empty services**, then point each at this repo with a different Dockerfile.

## 2. API service

**+ New** → GitHub repo → this repository.

| Setting | Value |
| --- | --- |
| Dockerfile path | `Dockerfile.api` |
| Healthcheck path | `/health` |

**Variables:**

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Share from Postgres (Railway **Variable reference**) |
| `JWT_SECRET` | Long random string (32+ chars) — not a placeholder |
| `ENCRYPTION_KEY` | 64 hex chars (32 bytes). Never reuse the local `.env.example` value in prod |
| `OPENAI_API_KEY` | Your OpenAI key |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `NODE_ENV` | `production` |

Railway sets `PORT`. Generate `ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Optional one-time seed from your laptop (Railway `DATABASE_URL`):

```bash
pnpm db:seed
```

Do not seed on every deploy. Change the seeded password before any real use.

## 3. Dashboard service

**+ New** → same GitHub repo.

| Setting | Value |
| --- | --- |
| Dockerfile path | `Dockerfile.dashboard` |

**Variables (after custom domains — see §5):**

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | Long random string (32+ chars) |
| `NEXTAUTH_URL` | `https://dyotona.com` (or `https://www.dyotona.com` if that is your canonical host) |
| `NEXT_PUBLIC_API_URL` | `https://api.dyotona.com` |
| `API_INTERNAL_URL` | `https://api.dyotona.com` (or the API’s private Railway URL) |
| `AUTH_TRUST_HOST` | `true` |
| `NODE_ENV` | `production` |

`NEXT_PUBLIC_API_URL` is baked into the client at **build** time. Set it **before** building the dashboard. If you change it, **redeploy** the dashboard.

Until DNS is live you can temporarily use `https://….up.railway.app` URLs, then switch to dyotona.com and redeploy.

## 4. Smoke-check Railway URLs first

1. `https://YOUR-API.up.railway.app/health` → `{ "ok": true, … }`
2. `https://YOUR-DASH.up.railway.app` → marketing / login
3. `https://YOUR-API.up.railway.app/demo/` and `/demo/woo/`

```bash
API_URL=https://YOUR-API.up.railway.app pnpm smoke
```

## 5. Point dyotona.com at Railway (do this in Railway + DNS)

### A. Attach domains in Railway

**API service** → **Settings** → **Networking** / **Custom domain**:

- Add `api.dyotona.com`

**Dashboard service** → same:

- Add `dyotona.com`
- Add `www.dyotona.com`

Railway shows the DNS records to create (usually a **CNAME** to something like `….up.railway.app`, or an apex instruction via CNAME flattening / ALIAS depending on your registrar).

### B. At your domain registrar (where you bought dyotona.com)

Create the records Railway displays. Typical pattern:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `www` | Railway dashboard target |
| CNAME | `api` | Railway API target |
| ALIAS / A / CNAME flattening | `@` (apex) | Railway dashboard target |

Exact values come from Railway’s domain UI — copy/paste them; do not invent IPs.

Wait until Railway marks each domain **Verified** / certificate issued (often a few minutes; sometimes up to an hour).

### C. Lock dashboard env to the domain

On the **dashboard** service, set:

```text
NEXTAUTH_URL=https://dyotona.com
NEXT_PUBLIC_API_URL=https://api.dyotona.com
API_INTERNAL_URL=https://api.dyotona.com
AUTH_TRUST_HOST=true
```

If you prefer `www` as canonical, use `https://www.dyotona.com` for `NEXTAUTH_URL` and redirect apex → www at the registrar or Railway if available.

**Redeploy the dashboard** after changing `NEXT_PUBLIC_API_URL` or `NEXTAUTH_URL`.

### D. Confirm

| Check | Expect |
| --- | --- |
| `https://dyotona.com` | Dyotona homepage |
| `https://www.dyotona.com` | Same (or redirect) |
| `https://api.dyotona.com/health` | `{ "ok": true }` |
| `https://api.dyotona.com/widget.js` | JavaScript bundle |
| Login / register | Works with cookies on dyotona.com |

```bash
API_URL=https://api.dyotona.com pnpm smoke
```

## 6. First merchant (client on their own domain)

1. Sign in at `https://dyotona.com/login`.
2. Create a store with their shop URL and **Allowed domains** (e.g. `itsmyshop.com`, `www.itsmyshop.com`).
3. Scan catalog or connect Woo REST keys.
4. Embed on **their** site:

```html
<script
  src="https://api.dyotona.com/widget.js"
  data-token="wgt_THEIR_TOKEN"
  async>
</script>
```

## 7. Demo stores after go-live

Update seeded demo store URLs in **Settings** to use the API host:

| Store | Website URL | Allowed domains |
| --- | --- | --- |
| Naksha Ghor | `https://api.dyotona.com/demo/` | `api.dyotona.com` |
| Ghor Mart | `https://api.dyotona.com/demo/woo/` | `api.dyotona.com` |

Then re-scan / detect color.

## 8. Common failures

| Symptom | Fix |
| --- | --- |
| Domain pending / no HTTPS | Wait for Railway cert; fix DNS to match Railway’s exact target |
| Login redirect loop | `NEXTAUTH_URL` must be the public `https://` dashboard origin (no path) |
| Login “invalid email or password” | API down, or dashboard still pointing at localhost / old Railway URL |
| Widget 403 domain | Shop hostname missing from Allowed domains |
| `/widget.js` 404 | Rebuild API with `Dockerfile.api` (includes widget build) |
| Auth cookies wrong host | Don’t mix `www` and apex without setting one as `NEXTAUTH_URL` |

Learner (`pnpm dev:learner`) stays local until you choose to host it.

## Checklist (copy)

- [ ] API + dashboard deployed and healthy on `*.up.railway.app`
- [ ] Custom domains `dyotona.com`, `www.dyotona.com` → dashboard; `api.dyotona.com` → API
- [ ] DNS verified + TLS green in Railway
- [ ] Dashboard env: `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL` use dyotona hosts
- [ ] Dashboard redeployed after env change
- [ ] `pnpm smoke` against `https://api.dyotona.com`
- [ ] Seeded password changed (if seed was used)
