import { api } from "@/lib/api";
import { SyncButtons } from "@/components/store-actions";

type Product = {
  id: string;
  title: string;
  description?: string;
  price: string | null;
  currency: string;
  url: string;
  imageUrl: string | null;
  source: string;
  inStock: boolean;
};

type StoreMeta = {
  wooConnection: unknown;
  lastScannedAt?: string | null;
  autoSyncDaily?: boolean;
  autoSyncHourUtc?: number;
  lastAutoSyncedAt?: string | null;
};

export default async function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ store }, { products }] = await Promise.all([
    api<{ store: StoreMeta }>(`/v1/stores/${id}`),
    api<{ products: Product[] }>(`/v1/stores/${id}/products`),
  ]);
  return (
    <>
      <p className="kicker">Index the agent answers from</p>
      <h1>Catalog</h1>
      <p className="muted" style={{ maxWidth: 700, marginBottom: 16 }}>
        The agent does not watch the live shop. When you add or change products, run a scan (or Woo sync). The next
        shopper message uses whatever is in this index.
        {store.autoSyncDaily ? <> Auto-sync daily at {String(store.autoSyncHourUtc ?? 0).padStart(2, "0")}:00 UTC.</> : null}
        {store.lastAutoSyncedAt ? <> Last auto-sync {new Date(store.lastAutoSyncedAt).toLocaleString()}.</> : null}
        {store.lastScannedAt ? <> Last manual scan {new Date(store.lastScannedAt).toLocaleString()}.</> : null}
      </p>
      <div className="card" style={{ marginBottom: 16 }}>
        <SyncButtons storeId={id} hasWoo={Boolean(store.wooConnection)} />
      </div>
      {!products.length ? (
        <p className="muted">No products yet. Scan the site or connect WooCommerce.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Details indexed</th>
                <th>Price</th>
                <th>Source</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <a href={p.url} target="_blank" rel="noreferrer">
                      {p.title}
                    </a>
                  </td>
                  <td className="muted" style={{ maxWidth: 280 }}>
                    {p.description?.trim()
                      ? `${p.description.slice(0, 140)}${p.description.length > 140 ? "�" : ""}`
                      : "Title / price only"}
                  </td>
                  <td className="num">{p.price ? `${p.currency} ${p.price}` : "�"}</td>
                  <td className="muted">{p.source}</td>
                  <td className="muted">{p.inStock ? "In stock" : "Out"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

