import { api } from "@/lib/api";
import { SettingsForm } from "@/components/store-actions";

type Store = {
  id: string;
  name: string;
  siteUrl: string;
  defaultLocale: string;
  currency: string;
  allowedDomains: string[];
  policies: string | null;
  storeType?: string;
  autoSyncDaily?: boolean;
  autoSyncHourUtc?: number;
};

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await api<{ store: Store }>(`/v1/stores/${id}`);
  return (
    <>
      <p className="kicker">Store</p>
      <h1>Settings</h1>
      <p className="muted" style={{ maxWidth: 560, marginBottom: 16 }}>
        Shopper chat runs on Dyotona&apos;s (দ্যোতনা) API. Merchants do not add an OpenAI key. The widget only sends the
        message and page URL; catalog lookup and the model run here.
      </p>
      <SettingsForm store={store} />
    </>
  );
}
