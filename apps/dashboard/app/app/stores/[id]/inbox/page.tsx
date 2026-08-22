import Link from "next/link";
import { api } from "@/lib/api";

type Convo = {
  id: string;
  locale: string;
  visitorId: string;
  updatedAt: string;
  handoff?: boolean;
  _count: { messages: number };
  messages: Array<{ content: string; role: string }>;
};

export default async function InboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { conversations } = await api<{ conversations: Convo[] }>(`/v1/stores/${id}/conversations`);
  return (
    <>
      <p className="kicker">Shoppers</p>
      <h1>Inbox</h1>
      <div className="inbox">
        <div className="inbox-list">
          {!conversations.length ? (
            <p className="muted" style={{ padding: 16 }}>
              No chats yet. Open the demo shop and send a message.
            </p>
          ) : (
            conversations.map((c) => (
              <Link key={c.id} className="inbox-item" href={`/app/stores/${id}/inbox/${c.id}`}>
                <strong>
                  {c.locale === "bn" ? "বাংলা" : "English"}
                  {c.handoff ? " · needs you" : ""}
                </strong>
                <p className="muted">
                  {c.messages[0]?.content.slice(0, 80) || "—"} · {c._count.messages} msgs
                </p>
              </Link>
            ))
          )}
        </div>
        <div className="thread">
          <p className="muted">Select a conversation. Replies stay on your site — no WhatsApp or app-store review.</p>
        </div>
      </div>
    </>
  );
}
