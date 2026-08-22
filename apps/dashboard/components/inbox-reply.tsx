"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replyToConversation, setConversationHandoff } from "@/app/actions";

export function InboxReply({
  storeId,
  conversationId,
  handoff,
}: {
  storeId: string;
  conversationId: string;
  handoff: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="composer">
      <p className="muted">
        {handoff
          ? "Shopper messages stay in this thread until you return the conversation to the agent."
          : "Reply here to take over. The agent pauses until you hand it back."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const content = String(new FormData(form).get("content") || "").trim();
          if (!content) return;
          setBusy(true);
          setMsg("");
          try {
            await replyToConversation(storeId, conversationId, content);
            form.reset();
            router.refresh();
          } catch (err) {
            setMsg(err instanceof Error ? err.message : "Could not send");
          } finally {
            setBusy(false);
          }
        }}
      >
        <textarea name="content" required placeholder="Reply to the shopper…" />
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send reply"}
          </button>
          {handoff ? (
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await setConversationHandoff(storeId, conversationId, false);
                  router.refresh();
                } finally {
                  setBusy(false);
                }
              }}
            >
              Return to agent
            </button>
          ) : null}
        </div>
      </form>
      {msg ? <p className="error">{msg}</p> : null}
    </div>
  );
}
