import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { BrandLockup } from "@/components/brand-lockup";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";

export default function RegisterPage() {
  return (
    <div className="auth-split">
      <div className="auth-visual">
        <div>
          <Link href="/" className="auth-brand-link">
            <BrandLockup as="strong" />
          </Link>
          <h1 style={{ marginTop: 48, fontSize: 42 }}>Go live in one snippet.</h1>
          <p className="bn-line">{BRAND.nameBn} — মার্কিন ও বাংলাদেশের ছোট দোকানের জন্য।</p>
          <p className="muted">For SMEs in the US and Bangladesh. WooCommerce-ready catalog sync.</p>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="inner">
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <ThemeToggle />
          </div>
          <h1>Create a merchant account</h1>
          <p className="muted">English and Bengali shopping agent — {BRAND.nameBn}</p>
          <AuthForm mode="register" />
          <p className="muted">
            Already registered? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
