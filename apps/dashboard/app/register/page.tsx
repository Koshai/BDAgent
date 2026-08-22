import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  return (
    <div className="auth-split">
      <div className="auth-visual">
        <div>
          <Link href="/" style={{ color: "inherit", textDecoration: "none", fontFamily: "Fraunces, serif", fontSize: 22 }}>
            BDAgent
          </Link>
          <h1 style={{ marginTop: 48, fontSize: 42 }}>Go live in one snippet.</h1>
          <p className="muted">For SMEs in the US and Bangladesh. WooCommerce-ready catalog sync.</p>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="inner">
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <ThemeToggle />
          </div>
          <h1>Create a merchant account</h1>
          <p className="muted">English and Bengali shopping agent.</p>
          <AuthForm mode="register" />
          <p className="muted">
            Already registered? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
