import { PublicNav } from "@/components/public-nav";
import { DocsNav } from "@/components/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs">
      <PublicNav
        links={[
          { href: "/", label: "Home" },
          { href: "/login", label: "Sign in" },
          { href: "/register", label: "Start free", primary: true },
        ]}
      />
      <div className="docs-shell">
        <DocsNav />
        <article className="docs-body">{children}</article>
      </div>
    </div>
  );
}
