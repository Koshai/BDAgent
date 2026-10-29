import Image from "next/image";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { BrandLockup } from "@/components/brand-lockup";
import { BRAND } from "@/lib/brand";
import { publicApiBase } from "@/lib/public";

export default function LandingPage() {
  const api = publicApiBase();
  return (
    <div className="marketing">
      <PublicNav />

      <section className="hero-bleed">
        <Image
          className="hero-bleed-img"
          src="/marketing/hero-store.jpg"
          alt="Independent boutique with textiles and leather goods on wooden shelves"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-bleed-shade" aria-hidden />
        <div className="hero-bleed-copy reveal">
          <p className="hero-brand">
            <BrandLockup as="span" />
          </p>
          <h1>{BRAND.tagline}</h1>
          <p className="hero-lede">
            Embed one script. Shoppers ask in English or বাংলা and get answers from your real catalog—not generic chat.
          </p>
          <p className="hero-lede-bn bn-line">{BRAND.nameBn} — আপনার দোকানের AI সহকারী।</p>
          <div className="hero-cta">
            <Link className="btn" href="/register">
              Start free
            </Link>
            <a className="btn secondary" href={`${api}/demo/`} target="_blank" rel="noreferrer">
              See a live demo
            </a>
          </div>
        </div>
      </section>

      <section className="m-section m-split">
        <div className="m-copy reveal">
          <p className="kicker">What it does</p>
          <h2>A storefront clerk that reads your inventory</h2>
          <p>
            {BRAND.name} ({BRAND.nameBn}) indexes your products, prices, and policies. When a shopper asks for a gift
            under ৳7,000 or a jamdani in stock, the agent answers from that index and can send them to the right product
            page.
          </p>
          <p className="bn-line">ইংরেজি বা বাংলায়—আপনার ক্যাটালগ থেকেই উত্তর।</p>
        </div>
        <figure className="m-photo reveal">
          <Image
            src="/marketing/bilingual-shop.jpg"
            alt="Craft textile beside a phone showing a shopping chat"
            width={960}
            height={720}
            sizes="(max-width: 900px) 100vw, 48vw"
          />
        </figure>
      </section>

      <section className="m-section m-how">
        <div className="m-how-head reveal">
          <p className="kicker">How it works</p>
          <h2>Live in three steps</h2>
          <p className="muted">No app-store install. Works on custom sites and WooCommerce.</p>
        </div>
        <ol className="m-how-list">
          <li className="reveal">
            <span className="m-num">1</span>
            <div>
              <h3>Connect your store</h3>
              <p className="muted">Add your site URL, scan the catalog, or sync WooCommerce REST keys.</p>
            </div>
          </li>
          <li className="reveal">
            <span className="m-num">2</span>
            <div>
              <h3>Paste one snippet</h3>
              <p className="muted">A script tag and public token—same embed pattern merchants already know.</p>
            </div>
          </li>
          <li className="reveal">
            <span className="m-num">3</span>
            <div>
              <h3>Talk to shoppers</h3>
              <p className="muted">Watch inbox threads, popular products, and language mix as chats come in.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="m-section m-split m-split-rev">
        <figure className="m-photo reveal">
          <Image
            src="/marketing/merchant-desk.jpg"
            alt="Merchant desk with laptop catalog and phone chat"
            width={960}
            height={720}
            sizes="(max-width: 900px) 100vw, 48vw"
          />
        </figure>
        <div className="m-copy reveal">
          <p className="kicker">For owners</p>
          <h2>Built for small teams in the US and Bangladesh</h2>
          <p>
            You keep your existing shop. {BRAND.name} hosts the agent, catalog sync, and OpenAI calls—so storefront pages
            never hold an API key. Tune tone and policies in the dashboard; the widget picks up your brand color.
          </p>
          <Link className="text-link" href="/docs">
            Read the merchant docs →
          </Link>
        </div>
      </section>

      <section className="m-cta reveal">
        <h2>Put a bilingual clerk on your shop tonight</h2>
        <p className="muted">Create an account, index a catalog, paste the snippet.</p>
        <div className="hero-cta">
          <Link className="btn" href="/register">
            Create a merchant account
          </Link>
          <a className="btn secondary" href={`${api}/demo/woo/`} target="_blank" rel="noreferrer">
            WooCommerce demo
          </a>
        </div>
      </section>

      <footer className="marketing-footer muted">
        © {new Date().getFullYear()} {BRAND.name} · {BRAND.nameBn} · {BRAND.domain}
      </footer>
    </div>
  );
}
