"use client";

import { useState } from "react";
import { detectWidgetColor, updateStore } from "@/app/actions";

const PRESETS = ["#0b6e4f", "#1d4ed8", "#b45309", "#be123c", "#7c3aed", "#0f766e", "#334155"];

export function WidgetColorForm({
  store,
}: {
  store: {
    id: string;
    widgetPrimaryColor?: string | null;
    widgetColorManual?: boolean;
  };
}) {
  const initial = store.widgetPrimaryColor || "#0b6e4f";
  const [color, setColor] = useState(initial);
  const [msg, setMsg] = useState("");

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 className="panel-title">Widget color</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        We detect a brand color from the site on create and scan. You can override it anytime; manual picks are not
        overwritten by later scans.
      </p>
      <div className="row" style={{ alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label htmlFor="widgetPrimaryColor" style={{ margin: 0 }}>
          Primary
        </label>
        <input
          id="widgetPrimaryColor"
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#0b6e4f"}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: 48, height: 40, padding: 0, border: "1px solid var(--line)", borderRadius: 8 }}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          pattern="^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
          style={{ width: 110 }}
          aria-label="Primary color hex"
        />
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: color,
            border: "1px solid var(--line)",
          }}
        />
        <span className="muted" style={{ fontSize: 13 }}>
          {store.widgetColorManual ? "Manual override" : "Auto from site"}
        </span>
      </div>
      <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className="btn secondary"
            style={{ padding: 0, width: 32, height: 32, background: p, borderColor: "transparent" }}
            title={p}
            onClick={() => setColor(p)}
            aria-label={`Use ${p}`}
          />
        ))}
      </div>
      <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            setMsg("Saving…");
            try {
              await updateStore(store.id, {
                widgetPrimaryColor: color,
                widgetColorManual: true,
              });
              setMsg("Saved. Reload the storefront to see the widget color.");
            } catch (err) {
              setMsg(err instanceof Error ? err.message : "Save failed");
            }
          }}
        >
          Save color
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={async () => {
            setMsg("Detecting from site…");
            try {
              const res = await detectWidgetColor(store.id);
              setColor(res.detectedColor);
              setMsg(
                res.usedFallback
                  ? `No strong brand color found; using ${res.detectedColor}.`
                  : `Detected ${res.detectedColor}. Auto mode restored.`,
              );
            } catch (err) {
              setMsg(err instanceof Error ? err.message : "Detect failed");
            }
          }}
        >
          Detect from site
        </button>
      </div>
      {msg ? <p className="muted">{msg}</p> : null}
    </div>
  );
}
