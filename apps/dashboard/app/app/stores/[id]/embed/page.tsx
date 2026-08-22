import { api } from "@/lib/api";
import { publicApiBase } from "@/lib/public";
import { CopyButton } from "@/components/copy-button";
import { RotateToken } from "@/components/store-actions";
import { WidgetColorForm } from "@/components/widget-color-form";

type Store = {
  id: string;
  name: string;
  siteUrl: string;
  storeType?: string;
  widgetPrimaryColor?: string | null;
  widgetColorManual?: boolean;
  tokens: Array<{ type: string; prefix: string }>;
};

function previewUrl(store: Store, apiBase: string): string {
  const site = store.siteUrl?.trim();
  if (site) return site;
  if (store.storeType === "woocommerce") return `${apiBase}/demo/woo/`;
  return `${apiBase}/demo/`;
}

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await api<{ store: Store }>(`/v1/stores/${id}`);
  const widget = store.tokens.find((t) => t.type === "widget");
  const secret = store.tokens.find((t) => t.type === "secret");
  const apiBase = publicApiBase();
  const preview = previewUrl(store, apiBase);
  const snippet = `<script
  src="${apiBase}/widget.js"
  data-token="YOUR_WIDGET_TOKEN"
  async>
</script>`;
  return (
    <>
      <p className="kicker">Install</p>
      <h1>Embed widget</h1>
      <div className="card">
        <p>Paste this before the closing body tag. Prefer the step-by-step install on Getting started.</p>
        <div className="snippet">{snippet}</div>
        <div className="row" style={{ marginTop: 12 }}>
          <CopyButton text={snippet} label="Copy snippet" />
          <a className="btn" href={`/app/stores/${id}/setup`}>
            Getting started
          </a>
          <a className="btn secondary" href={preview} target="_blank" rel="noreferrer">
            Open storefront
          </a>
        </div>
        <p className="muted" style={{ marginTop: 16 }}>
          Current widget prefix <code>{widget?.prefix}</code> · secret prefix <code>{secret?.prefix}</code>
        </p>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Preview for <strong>{store.name}</strong>
        </p>
        <iframe
          key={store.id}
          title={`${store.name} preview`}
          src={preview}
          style={{ width: "100%", height: 380, border: "1px solid var(--line)", borderRadius: 16, marginTop: 12 }}
        />
        <RotateToken storeId={id} apiBase={apiBase} />
      </div>
      <WidgetColorForm store={store} />
    </>
  );
}
