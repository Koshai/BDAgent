export const metadata = { title: "Local setup · Dyotona" };

export default function DocsLocal() {
  return (
    <>
      <p className="kicker">Docs</p>
      <h1>Local setup &amp; demos</h1>
      <p className="lede">Node 20+, pnpm, and Docker. Postgres is mapped to port 55432.</p>

      <h2>Commands</h2>
      <pre>{`copy .env.example apps\\api\\.env
copy .env.example apps\\dashboard\\.env.local
pnpm db:up
pnpm install
pnpm db:push
pnpm db:seed
pnpm --filter @Dyotona/widget build
pnpm dev`}</pre>
      <p>
        Dashboard: <a href="http://localhost:3000">localhost:3000</a> · app:{" "}
        <a href="http://localhost:3000/app">/app</a>
        <br />
        Seeded login: <code>merchant@Dyotona.dev</code> / <code>password123</code>
      </p>
      <p>
        Optional: set <code>OPENAI_API_KEY</code> in <code>apps/api/.env</code>. Without it, chat still returns catalog
        matches.
      </p>

      <h2>Demos</h2>
      <ul>
        <li>
          <a href="http://localhost:4000/demo/">Naksha Ghor</a> — crawl / JSON-LD shop. Token{" "}
          <code>wgt_local_demo_token_abcdefghijk123</code>
        </li>
        <li>
          <a href="http://localhost:4000/demo/woo/">Ghor Mart</a> — Woo markup + mock REST. Token{" "}
          <code>wgt_local_woo_token_abcdefghijk123</code>. Keys <code>ck_demo_key_local</code> /{" "}
          <code>cs_demo_secret_local</code>. Order <code>1001</code> / <code>shopper@example.com</code>
        </li>
      </ul>
      <p>
        Markdown copies of this guide live in the repo under <code>docs/</code>.
      </p>
    </>
  );
}
