import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { BrandLockup } from "@/components/brand-lockup";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";

function Visual() {
  return (
    <div className="auth-visual">
      <div>
        <Link href="/" className="auth-brand-link">
          <BrandLockup as="strong" />
        </Link>
        <h1 style={{ marginTop: 48, fontSize: 42 }}>The storefront finally has a voice.</h1>
        <p className="bn-line">
          {BRAND.nameBn} — বাংলা ও ইংরেজিতে, আপনার পণ্য তালিকা থেকে উত্তর।
        </p>
      </div>
      <div className="widget-mock">
        <div className="mh">
          <strong>Shopping assistant</strong>
          <span>বাংলা</span>
        </div>
        <div className="mb">
          <div className="mock-bubble a">Sylhet tea ৳450 — gift tin চাইলে বলুন।</div>
          <div className="mock-bubble u">Do you ship to the US?</div>
          <div className="mock-bubble a">Yes — 10–14 days to the US. I can open the product page.</div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-split">
      <Visual />
      <div className="auth-form-wrap">
        <div className="inner">
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <ThemeToggle />
          </div>
          <h2>Sign in</h2>
          <p className="muted">Merchant dashboard for {BRAND.name}</p>
          <AuthForm mode="login" />
          <p className="muted" style={{ marginTop: 16 }}>
            New here? <Link href="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
