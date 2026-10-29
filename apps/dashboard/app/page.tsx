import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { IconChart, IconCode, IconMessage } from "@/components/icons";
import { BRAND } from "@/lib/brand";
import { publicApiBase } from "@/lib/public";

export default function LandingPage() {
  const api = publicApiBase();
  return (
    <div className="marketing">
      <PublicNav />
      <section className="hero">
        <div>
          <p className="kicker">
            {BRAND.name} · for small &amp; medium stores · US + Bangladesh
          </p>
          <h1>{BRAND.tagline}</h1>
          <p className="bn-line">ইংরেজি বা বাংলায় কেনাকাটা — স্নিপেট বসিয়েই চালু।</p>
          <p className="muted" style={{ maxWidth: 520, marginBottom: 24 }}>
            Paste one script. Shoppers get grounded answers and product cards. You get inbox, popularity, and a
            bilingual agent powered by {BRAND.name}.
          </p>
          <div className="row">
            <Link className="btn" href="/register">
              Create a merchant account
            </Link>
            <a className="btn secondary" href={`${api}/demo/`} target="_blank" rel="noreferrer">
              Catalog demo
            </a>
            <a className="btn secondary" href={`${api}/demo/woo/`} target="_blank" rel="noreferrer">
              Woo demo
            </a>
          </div>
        </div>
        <div className="widget-mock" aria-hidden>
          <div className="mh">
            <strong>Naksha Ghor</strong>
            <span>EN · বাংলা</span>
          </div>
          <div className="mb">
            <div className="mock-bubble a">Jamdani না কি leather tote — budget বলুন, মিলিয়ে দিচ্ছি।</div>
            <div className="mock-bubble u">Something under ৳7,000, gift for Eid</div>
            <div className="mock-bubble a">The vegetable-tanned tote is ৳6,400 and in stock. I can take you to the product page.</div>
          </div>
        </div>
      </section>
      <section className="steps">
        <article className="card">
          <p className="kicker">01</p>
          <h2 className="step-title">
            <IconCode size={18} />
            Paste a snippet
          </h2>
          <p className="muted">One script tag and a public token. Works on custom sites and WooCommerce.</p>
        </article>
        <article className="card">
          <p className="kicker">02</p>
          <h2 className="step-title">
            <IconMessage size={18} />
            Shoppers chat
          </h2>
          <p className="muted">English or Bengali. Answers come from your synced catalog, not guesswork.</p>
        </article>
        <article className="card">
          <p className="kicker">03</p>
          <h2 className="step-title">
            <IconChart size={18} />
            You see the signal
          </h2>
          <p className="muted">Inbox, language split, popular products, and a simple sales funnel.</p>
        </article>
      </section>
      <footer className="marketing-footer muted">
        © {new Date().getFullYear()} {BRAND.name} · {BRAND.domain}
      </footer>
    </div>
  );
}
