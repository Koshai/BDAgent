import { api } from "@/lib/api";
import { AgentForm } from "@/components/agent-form";

type Store = {
  id: string;
  name: string;
  agentTone?: string;
  agentLength?: string;
  suggestAlternatives?: boolean;
  askClarifying?: boolean;
  upsellEnabled?: boolean;
  collectEmail?: boolean;
  extraInstructions?: string;
};

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await api<{ store: Store }>(`/v1/stores/${id}`);
  return (
    <>
      <p className="kicker">{store.name}</p>
      <h1>Agent</h1>
      <p className="muted" style={{ maxWidth: 560, marginBottom: 18 }}>
        Every store starts with the same shop-bounded prompt: only this catalog, these policies, and indexed site notes.
        Tone and the options below change how it talks — not what it is allowed to know.
      </p>
      <AgentForm
        store={{
          id: store.id,
          agentTone: store.agentTone ?? "friendly",
          agentLength: store.agentLength ?? "balanced",
          suggestAlternatives: store.suggestAlternatives ?? true,
          askClarifying: store.askClarifying ?? true,
          upsellEnabled: store.upsellEnabled ?? false,
          collectEmail: store.collectEmail ?? false,
          extraInstructions: store.extraInstructions ?? "",
        }}
      />
    </>
  );
}
