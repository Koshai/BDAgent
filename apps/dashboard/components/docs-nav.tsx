"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconBook, IconCart, IconClose, IconHelp, IconInbox, IconMenu, IconPackage, IconRocket } from "@/components/icons";

const links = [
  { href: "/docs", label: "Getting started", Icon: IconRocket },
  { href: "/docs/widget", label: "Embed & tokens", Icon: IconBook },
  { href: "/docs/catalog", label: "Catalog", Icon: IconPackage },
  { href: "/docs/woocommerce", label: "WooCommerce", Icon: IconCart },
  { href: "/docs/inbox", label: "Inbox & orders", Icon: IconInbox },
  { href: "/docs/local", label: "Local & demos", Icon: IconHelp },
] as const;

export function DocsNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className="docs-aside">
      <button type="button" className="docs-nav-toggle btn secondary" onClick={() => setOpen((v) => !v)}>
        {open ? <IconClose size={16} /> : <IconMenu size={16} />}
        {open ? "Close" : "Browse topics"}
      </button>
      <nav className={`docs-nav ${open ? "open" : ""}`} aria-label="Documentation">
        {links.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={path === href ? "active" : ""} onClick={() => setOpen(false)}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
