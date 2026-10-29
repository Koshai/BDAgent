/**
 * Local / Railway smoke checks for BDAgent API.
 *
 * Usage:
 *   node scripts/smoke.mjs
 *   API_URL=https://your-api.up.railway.app node scripts/smoke.mjs
 */
const API = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

async function check(name, fn) {
  try {
    await fn();
    console.log(`OK  ${name}`);
    return true;
  } catch (err) {
    console.error(`FAIL ${name}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

async function main() {
  console.log(`Smoke testing ${API}`);
  let ok = true;

  ok =
    (await check("GET /health", async () => {
      const res = await fetch(`${API}/health`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = await res.json();
      if (!body.ok) throw new Error(`health not ok: ${JSON.stringify(body)}`);
      if (body.db === false) throw new Error("database unreachable");
    })) && ok;

  ok =
    (await check("GET /widget.js", async () => {
      const res = await fetch(`${API}/widget.js`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const text = await res.text();
      if (!text.includes("bdagent") && text.length < 1000) throw new Error("widget bundle looks empty");
    })) && ok;

  ok =
    (await check("GET /demo/", async () => {
      const res = await fetch(`${API}/demo/`);
      if (!res.ok) throw new Error(`status ${res.status}`);
    })) && ok;

  ok =
    (await check("POST /v1/auth/login (seed)", async () => {
      const res = await fetch(`${API}/v1/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "merchant@bdagent.dev", password: "password123" }),
      });
      if (res.status === 401) {
        console.log("SKIP login — seed user not present (ok for fresh prod)");
        return;
      }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = await res.json();
      if (!body.token) throw new Error("missing token");
    })) && ok;

  ok =
    (await check("Widget bootstrap rejects empty auth", async () => {
      const res = await fetch(`${API}/v1/widget/bootstrap`);
      if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
    })) && ok;

  if (!ok) {
    process.exit(1);
  }
  console.log("All smoke checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
