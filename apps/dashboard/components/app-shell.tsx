"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, type ComponentType } from "react";
import { signOutAction } from "@/app/actions";
import {
  IconCart,
  IconChart,
  IconClose,
  IconCode,
  IconHelp,
  IconInbox,
  IconLogout,
  IconMenu,
  IconMoon,
  IconOverview,
  IconPackage,
  IconPlus,
  IconRocket,
  IconSettings,
  IconSpark,
  IconStores,
  IconSun,
  type IconProps,
} from "@/components/icons";

import { BRAND } from "@/lib/brand";

type Store = { id: string; name: string; storeType?: string };

const NAV_ICONS: Record<string, ComponentType<IconProps>> = {
  Stores: IconStores,
  "New store": IconPlus,
  "Getting started": IconRocket,
  Overview: IconOverview,
  Inbox: IconInbox,
  Catalog: IconPackage,
  Agent: IconSpark,
  Analytics: IconChart,
  Embed: IconCode,
  WooCommerce: IconCart,
  Settings: IconSettings,
  Help: IconHelp,
};

export function AppShell({
  email,
  stores,
  children,
}: {
  email?: string | null;
  stores: Store[];
  children: React.ReactNode;
}) {
  const path = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const storeMatch = path.match(/\/app\/stores\/([^/]+)/);
  const storeId = storeMatch && storeMatch[1] !== "new" ? storeMatch[1] : null;
  const current = storeId ? stores.find((s) => s.id === storeId) : null;
  const isWoo = current?.storeType === "woocommerce";

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const items: Array<[string, string]> = storeId
    ? [
        ["Getting started", `/app/stores/${storeId}/setup`],
        ["Overview", `/app/stores/${storeId}`],
        ["Inbox", `/app/stores/${storeId}/inbox`],
        ["Catalog", `/app/stores/${storeId}/products`],
        ["Agent", `/app/stores/${storeId}/agent`],
        ["Analytics", `/app/stores/${storeId}/analytics`],
        ["Embed", `/app/stores/${storeId}/embed`],
        ...(isWoo ? ([["WooCommerce", `/app/stores/${storeId}/woocommerce`]] as Array<[string, string]>) : []),
        ["Settings", `/app/stores/${storeId}/settings`],
      ]
    : [
        ["Stores", "/app"],
        ["New store", "/app/stores/new"],
      ];

  return (
    <div className="app-shell">
      {open ? (
        <button type="button" className="sidebar-backdrop show" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <Link href="/app" className="brand" onClick={() => setOpen(false)}>
            <span className="mark" aria-hidden>
              ব
            </span>
            <span>
              <strong>{BRAND.name}</strong>
              <span>Merchant</span>
            </span>
          </Link>
          <button type="button" className="icon-btn sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <IconClose size={20} />
          </button>
        </div>
        {storeId && stores.length > 1 ? (
          <div className="store-switch">
            <label htmlFor="store-switch">Store</label>
            <select
              id="store-switch"
              value={storeId}
              onChange={(e) => {
                window.location.href = `/app/stores/${e.target.value}`;
              }}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <nav className="sidebar-nav">
          {items.map(([label, href]) => {
            const Icon = NAV_ICONS[label] ?? IconOverview;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link ${path === href ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <Link href="/docs" className="nav-link" onClick={() => setOpen(false)}>
            <IconHelp size={17} />
            Help
          </Link>
          {email ? (
            <p className="sidebar-email muted" title={email}>
              {email}
            </p>
          ) : null}
          <form action={signOutAction}>
            <button className="nav-link" type="submit">
              <IconLogout size={17} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="app-content">
        <header className="app-topbar">
          <button type="button" className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
            <IconMenu size={20} />
          </button>
          <Link href="/app" className="topbar-brand">
            <span className="mark" aria-hidden>
              ব
            </span>
            <span>{current?.name ?? BRAND.name}</span>
          </Link>
          <div className="topbar-actions">
            {mounted ? (
              <button
                type="button"
                className="icon-btn theme-btn"
                aria-label="Toggle theme"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
              </button>
            ) : (
              <span className="icon-btn theme-btn" />
            )}
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
