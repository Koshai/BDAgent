import { auth } from "@/auth";
import { api } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let stores: Array<{ id: string; name: string }> = [];
  try {
    const data = await api<{ stores: Array<{ id: string; name: string; storeType?: string }> }>("/v1/stores");
    stores = data.stores;
  } catch {
    stores = [];
  }
  return (
    <AppShell email={session?.user?.email} stores={stores}>
      {children}
    </AppShell>
  );
}
