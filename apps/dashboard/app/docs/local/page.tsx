import { BRAND, PROD_HOSTS } from "@/lib/brand";

export const metadata = { title: `Local setup · ${BRAND.name}` };

export default function DocsLocal() {
  return (
    <>
      <p className="kicker">Docs</p>
      <h1>Local setup &amp; demos</h1>
      <p className="lede">
        For developers running {BRAND.name} on a laptop. Production merchants can ignore this page and use{" "}
        <a href={PROD_HOSTS.app}>{BRAND.domain}</a>.
      </p>

      <h2>Requirements</h2>
      <p>Node 20+, pnpm, and Docker. Local Postgres is mapped to port 55432.</p>

      <h2>Commands</h2>
      <pre>{`copy .env.example apps\\api\\.env
copy .env.example apps\\dashboard\\.env.local
pnpm db:up
pnpm install
pnpm db:push
pnpm db:seed
pnpm --filter @bdagent/widget build
pnpm dev`}</pre>
      <p>
        Dashboard: <a href="http://localhost:3000">localhost:3000</a> · app:{" "}
        <a href="http://localhost:3000/app">/app</a>
        <br />
        Seeded login: <code>merchant@bdagent.dev</code> / <code>password123</code>
      </p>
      <p>
        Optional: set <code>OPENAI_API_KEY</code> in <code>apps/api/.env</code>. Without it, chat still returns catalog
        matches.
      </p>

      <h2>Local demos</h2>
      <ul>
        <li>
          <a href="http://localhost:4000/demo/">Naksha Ghor</a> — crawl / JSON-LD shop
        </li>
        <li>
          <a href="http://localhost:4000/demo/woo/">Ghor Mart</a> — Woo markup + mock REST. Sample order{" "}
          <code>1001</code> / <code>shopper@example.com</code>
        </li>
      </ul>

      <h2>Production demos</h2>
      <ul>
        <li>
          <a href={`${PROD_HOSTS.api}/demo/`} target="_blank" rel="noreferrer">
            {PROD_HOSTS.api}/demo/
          </a>
        </li>
        <li>
          <a href={`${PROD_HOSTS.api}/demo/woo/`} target="_blank" rel="noreferrer">
            {PROD_HOSTS.api}/demo/woo/
          </a>
        </li>
      </ul>
      <p>
        Deploy notes: see the repo <code>docs/railway.md</code> for Railway + {BRAND.domain}.
      </p>
    </>
  );
}
