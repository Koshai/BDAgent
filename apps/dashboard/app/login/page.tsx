import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { ThemeToggle } from "@/components/theme-toggle";

function Visual() {
  return (
    <div className="auth-visual">
      <div>
        <Link href="/" style={{ color: "inherit", textDecoration: "none", fontFamily: "Fraunces, serif", fontSize: 22 }}>
          Dyotona
        </Link>
        <h1 style={{ marginTop: 48, fontSize: 42 }}>The storefront finally has a voice.</h1>
        <p className="bn-line">বাংলা ও ইংরেজিতে — আপনার পণ্য তালিকা থেকে উত্তর।</p>
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
          <h1>Welcome back</h1>
          <p className="muted">Tokens, catalog, inbox, analytics.</p>
          <AuthForm mode="login" />
          <p className="muted">
            No account? <Link href="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
