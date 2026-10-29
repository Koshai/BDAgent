"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { IconClose, IconMenu } from "@/components/icons";
import { BrandLockup } from "@/components/brand-lockup";
import { BRAND } from "@/lib/brand";

export function PublicNav({
  links,
}: {
  links?: Array<{ href: string; label: string; primary?: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const defaults = [
    { href: "/docs", label: "Docs" },
    { href: "/login", label: "Sign in" },
    { href: "/register", label: "Start free", primary: true },
  ];
  const items = links ?? defaults;

  return (
    <>
      <nav className="m-nav">
        <Link href="/" className="brand-mark" onClick={() => setOpen(false)} aria-label={`${BRAND.name} ${BRAND.nameBn}`}>
          <span className="mark" aria-hidden>
            দ
          </span>
          <BrandLockup as="strong" compact />
        </Link>
        <div className="m-nav-desktop row">
          <ThemeToggle />
          {items.map((l) => (
            <Link key={l.href} className={l.primary ? "btn" : "btn secondary"} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="m-nav-mobile row">
          <ThemeToggle />
          <button type="button" className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
            <IconMenu size={20} />
          </button>
        </div>
      </nav>
      {open ? (
        <button type="button" className="sidebar-backdrop show" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <aside className={`mobile-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="mobile-drawer-head">
          <strong>Menu</strong>
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
            <IconClose size={20} />
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          {items.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${path === l.href ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
