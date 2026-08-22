import Link from "next/link";
import { api } from "@/lib/api";
import { InboxReply } from "@/components/inbox-reply";

type Msg = { id: string; role: string; content: string; products?: unknown; createdAt: string };
type Convo = {
  id: string;
  locale: string;
  visitorId: string;
  handoff?: boolean;
  messages: Msg[];
};
type ListItem = {
  id: string;
  locale: string;
  handoff?: boolean;
  messages: Array<{ content: string }>;
  _count: { messages: number };
};

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string; cid: string }>;
}) {
  const { id, cid } = await params;
  const [{ conversations }, { conversation }] = await Promise.all([
    api<{ conversations: ListItem[] }>(`/v1/stores/${id}/conversations`),
    api<{ conversation: Convo }>(`/v1/stores/${id}/conversations/${cid}`),
  ]);
  return (
    <>
      <p className="kicker">Shoppers</p>
      <h1>Inbox</h1>
      <div className="inbox">
        <div className="inbox-list">
          {conversations.map((c) => (
            <Link
              key={c.id}
              className={`inbox-item ${c.id === cid ? "active" : ""}`}
              href={`/app/stores/${id}/inbox/${c.id}`}
            >
              <strong>
                {c.locale === "bn" ? "বাংলা" : "English"}
                {c.handoff ? " · human" : ""}
              </strong>
              <p className="muted">{c.messages[0]?.content.slice(0, 80)}</p>
            </Link>
          ))}
        </div>
        <div className="thread">
          {conversation.messages.map((m) => (
            <div
              key={m.id}
              className={`bubble ${m.role}`}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background:
                  m.role === "user" ? "var(--jade)" : m.role === "merchant" ? "var(--ink)" : "var(--surface-2)",
                color: m.role === "user" || m.role === "merchant" ? "#fff" : "inherit",
                padding: "10px 12px",
                borderRadius: 14,
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))}
          <InboxReply storeId={id} conversationId={cid} handoff={Boolean(conversation.handoff)} />
        </div>
      </div>
    </>
  );
}
