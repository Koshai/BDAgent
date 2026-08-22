import Link from "next/link";
import { api } from "@/lib/api";
import { IconChevron, IconPlus, IconStore } from "@/components/icons";
import { storeTypeLabel } from "@/lib/store-type";

type StoreRow = {
  id: string;
  name: string;
  siteUrl: string;
  defaultLocale: string;
  currency: string;
  storeType?: string;
  offersFound?: number;
  _count: { products: number; conversations: number };
};

export default async function StoresPage() {
  const { stores } = await api<{ stores: StoreRow[] }>("/v1/stores");
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18, alignItems: "flex-start" }}>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <p className="kicker">Workspace</p>
          <h1>Stores</h1>
        </div>
        <Link className="btn" href="/app/stores/new">
          <IconPlus size={16} />
          New store
        </Link>
      </div>
      {!stores.length ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <IconStore size={32} style={{ color: "var(--jade)", marginBottom: 12 }} />
          <h2>No stores yet</h2>
          <p className="muted">Create a store, then follow Getting started to paste the snippet.</p>
          <Link className="btn" href="/app/stores/new" style={{ marginTop: 8 }}>
            <IconPlus size={16} />
            Start setup
          </Link>
        </div>
      ) : (
        <div className="list">
          {stores.map((store) => (
            <Link key={store.id} href={`/app/stores/${store.id}`} className="list-row">
              <div>
                <strong>{store.name}</strong>
                <div className="list-meta">
                  <span className="pill ok">{storeTypeLabel(store.storeType)}</span>
                  <span className="muted">{store.siteUrl}</span>
                </div>
              </div>
              <div className="row" style={{ gap: 12 }}>
                <span className="muted num">
                  {store.offersFound ?? store._count.products} offers · {store._count.conversations} chats
                </span>
                <IconChevron size={18} className="list-chevron" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
