import { api } from "@/lib/api";
import { WooForm } from "@/components/store-actions";

export default async function WooPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { connection } = await api<{
    connection: { siteUrl: string; lastSyncedAt: string | null } | null;
  }>(`/v1/stores/${id}/woocommerce`);
  return (
    <>
      <p className="kicker">Bangladesh SMEs</p>
      <h1>WooCommerce</h1>
      <p className="muted">
        REST API key with read access. The same JS snippet still loads the chat widget.
      </p>
      <div className="card">
        {connection ? (
          <p>
            Connected to <strong>{connection.siteUrl}</strong>
            {connection.lastSyncedAt ? ` · last sync ${new Date(connection.lastSyncedAt).toLocaleString()}` : ""}
          </p>
        ) : (
          <p className="muted">Not connected yet.</p>
        )}
        <WooForm storeId={id} connected={Boolean(connection)} />
      </div>
    </>
  );
}
