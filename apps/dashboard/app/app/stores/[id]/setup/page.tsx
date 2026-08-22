import { api } from "@/lib/api";
import { publicApiBase } from "@/lib/public";
import { SetupGuide } from "@/components/setup-guide";

type Store = {
  id: string;
  name: string;
  siteUrl: string;
  allowedDomains: string[];
  commerceKind?: string;
  storeType?: string;
  tokens: Array<{ type: string; prefix: string }>;
  wooConnection: { siteUrl: string } | null;
  _count: { products: number };
};

export default async function SetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await api<{ store: Store }>(`/v1/stores/${id}`);
  const widget = store.tokens.find((t) => t.type === "widget");

  return (
    <>
      <p className="kicker">Install on your site</p>
      <h1>Getting started</h1>
      <p className="muted" style={{ maxWidth: 560, marginBottom: 22 }}>
        Four steps to put the shopping agent on {store.name}. Copy the snippet, keep your existing URLs.
      </p>
      <SetupGuide
        storeId={id}
        siteUrl={store.siteUrl}
        apiBase={publicApiBase()}
        allowedDomains={store.allowedDomains}
        widgetPrefix={widget?.prefix}
        productCount={store._count.products}
        hasWoo={Boolean(store.wooConnection)}
        wooDetected={store.storeType === "woocommerce" || store.commerceKind === "woocommerce"}
      />
    </>
  );
}
