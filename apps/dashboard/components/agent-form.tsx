"use client";

import { useState } from "react";
import { updateStore } from "@/app/actions";

export type AgentSettings = {
  id: string;
  agentTone: string;
  agentLength: string;
  suggestAlternatives: boolean;
  askClarifying: boolean;
  upsellEnabled: boolean;
  collectEmail: boolean;
  extraInstructions: string;
};

export function AgentForm({ store }: { store: AgentSettings }) {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setMsg("Saving…");
        try {
          await updateStore(store.id, {
            agentTone: String(form.get("agentTone") || "friendly"),
            agentLength: String(form.get("agentLength") || "balanced"),
            suggestAlternatives: form.get("suggestAlternatives") === "on",
            askClarifying: form.get("askClarifying") === "on",
            upsellEnabled: form.get("upsellEnabled") === "on",
            collectEmail: form.get("collectEmail") === "on",
            extraInstructions: String(form.get("extraInstructions") || ""),
          });
          setMsg("Saved. New chats use this voice immediately.");
        } catch (err) {
          setMsg(err instanceof Error ? err.message : "Save failed");
        }
      }}
    >
      <h2 className="panel-title">Voice</h2>
      <div className="grid cols-2">
        <div>
          <label htmlFor="agentTone">Tone</label>
          <select id="agentTone" name="agentTone" defaultValue={store.agentTone || "friendly"}>
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="warm">Warm / shopkeeper</option>
            <option value="concise">Concise</option>
            <option value="playful">Playful</option>
          </select>
        </div>
        <div>
          <label htmlFor="agentLength">Reply length</label>
          <select id="agentLength" name="agentLength" defaultValue={store.agentLength || "balanced"}>
            <option value="brief">Brief</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">More detail</option>
          </select>
        </div>
      </div>

      <h2 className="panel-title" style={{ marginTop: 8 }}>
        Shopping experience
      </h2>
      <label className="check-row">
        <input type="checkbox" name="suggestAlternatives" defaultChecked={store.suggestAlternatives} />
        <span>
          Suggest alternatives
          <em>Offer 1–2 similar items from this catalog when a match is imperfect.</em>
        </span>
      </label>
      <label className="check-row">
        <input type="checkbox" name="askClarifying" defaultChecked={store.askClarifying} />
        <span>
          Ask one clarifying question
          <em>Budget, size, or occasion — only when it would change the pick.</em>
        </span>
      </label>
      <label className="check-row">
        <input type="checkbox" name="upsellEnabled" defaultChecked={store.upsellEnabled} />
        <span>
          Mention a complement
          <em>Once, from this shop only (e.g. oil with a clay cup set). Off by default.</em>
        </span>
      </label>
      <label className="check-row">
        <input type="checkbox" name="collectEmail" defaultChecked={store.collectEmail} />
        <span>
          May ask for email
          <em>Only if they want a follow-up the chat cannot finish. Off by default.</em>
        </span>
      </label>

      <label htmlFor="extraInstructions">Extra instructions</label>
      <textarea
        id="extraInstructions"
        name="extraInstructions"
        defaultValue={store.extraInstructions ?? ""}
        placeholder="e.g. Prefer in-stock items. Mention Eid gift wrapping if they ask."
        maxLength={2000}
      />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        These notes cannot override the shop-only rules. The agent still cannot talk about other businesses or invent
        products.
      </p>
      <button type="submit">Save agent</button>
      {msg ? <p className="muted">{msg}</p> : null}
    </form>
  );
}
