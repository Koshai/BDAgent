export const widgetCss = `
:host {
  all: initial;
  font-family: "Segoe UI", "Noto Sans Bengali", system-ui, sans-serif;
  --bd-primary: #0b6e4f;
  --bd-primary-contrast: #ffffff;
  --bd-primary-soft: #e6f4ee;
  --bd-primary-shadow: rgba(11, 110, 79, 0.35);
  --bd-ink: #14221c;
  --bd-paper: #fffcf7;
}
[hidden] { display: none !important; }
.wrap {
  position: fixed;
  z-index: 2147483000;
  right: 20px;
  bottom: 20px;
  color: var(--bd-ink);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.fab {
  width: 58px;
  height: 58px;
  border: 0;
  border-radius: 18px;
  background: var(--bd-primary);
  color: var(--bd-primary-contrast);
  cursor: pointer;
  box-shadow: 0 12px 30px var(--bd-primary-shadow);
  display: grid;
  place-items: center;
  position: relative;
}
.fab .pulse {
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  border: 2px solid var(--bd-primary);
  animation: pulse 2s ease-out infinite;
  pointer-events: none;
}
@keyframes pulse {
  from { transform: scale(0.92); opacity: 0.7; }
  to { transform: scale(1.18); opacity: 0; }
}
.fab svg { width: 26px; height: 26px; }
.panel {
  position: absolute;
  right: 0;
  bottom: 70px;
  display: flex;
  flex-direction: column;
  width: min(380px, calc(100vw - 32px));
  height: min(640px, calc(100vh - 110px));
  margin-bottom: 12px;
  background: var(--bd-paper);
  border: 1px solid #e4d9c5;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(20, 34, 28, 0.18);
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  pointer-events: none;
  transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.panel.open {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
.head {
  background: var(--bd-ink);
  color: #f6f1e8;
  padding: 14px 14px 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.live { width: 8px; height: 8px; border-radius: 50%; background: var(--bd-primary); margin-top: 6px; }
.brand { flex: 1; min-width: 0; }
.brand h2 { margin: 0; font-size: 15px; font-weight: 700; }
.brand p { margin: 4px 0 0; font-size: 12px; color: #c9d6cf; }
.langs button, .icon-btn {
  border: 0; background: transparent; color: #f6f1e8; border-radius: 999px;
  padding: 5px 8px; font-size: 11px; cursor: pointer; min-height: 32px;
}
.langs button.active { background: var(--bd-primary); color: var(--bd-primary-contrast); }
.messages {
  flex: 1; overflow-y: auto; padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
  background: linear-gradient(#f7f1e6, var(--bd-paper) 40%);
}
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  border: 1px solid #eadfcb; background: #fff; border-radius: 999px;
  padding: 6px 10px; font-size: 12px; cursor: pointer; color: inherit;
}
.bubble {
  max-width: 88%; padding: 10px 12px; border-radius: 14px;
  font-size: 13.5px; line-height: 1.5; white-space: pre-wrap;
}
.bubble.user { align-self: flex-end; background: var(--bd-primary); color: var(--bd-primary-contrast); border-bottom-right-radius: 4px; }
.bubble.assistant { align-self: flex-start; background: #fff; border: 1px solid #eadfcb; border-bottom-left-radius: 4px; }
.bubble.thinking::after { content: " …"; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.2; } }
.cards { display: flex; flex-direction: column; gap: 8px; }
.chips-hint { font-size: 12px; color: #6a7a72; width: 100%; }
.card {
  display: grid; grid-template-columns: 64px 1fr; gap: 10px; align-items: center;
  padding: 8px; background: #fff; border: 1px solid #eadfcb; border-radius: 14px;
  color: inherit;
}
.card img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; background: #eee7d8; }
.card strong { display: block; font-size: 13px; }
.card span { font-size: 12px; color: #5b6b63; }
.card-actions { grid-column: 1 / -1; display: flex; gap: 8px; }
.card .cta, .cart-btn {
  font-size: 12px; font-weight: 700; color: var(--bd-primary); background: var(--bd-primary-soft);
  border: 0; border-radius: 10px; padding: 8px 10px; cursor: pointer; text-decoration: none;
}
.cart-btn { background: var(--bd-primary); color: var(--bd-primary-contrast); }
.bubble.merchant { align-self: flex-start; background: var(--bd-ink); color: #f6f1e8; border-bottom-left-radius: 4px; }
.tools { padding: 0 10px 8px; background: #fff; border-top: 1px solid #eadfcb; }
.tools button {
  border: 1px dashed #eadfcb; background: var(--bd-paper); border-radius: 10px;
  padding: 8px 10px; font-size: 12px; cursor: pointer; color: inherit; width: 100%;
}
.order {
  display: grid; gap: 6px; padding: 8px 10px; background: #fff; border-top: 1px solid #eadfcb;
}
.order input {
  border: 1px solid #eadfcb; border-radius: 10px; padding: 8px 10px; font: inherit; font-size: 13px;
}
.order button { border: 0; background: var(--bd-ink); color: #fff; border-radius: 10px; min-height: 40px; cursor: pointer; font-weight: 700; }
.form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eadfcb; background: #fff; }
.form textarea {
  flex: 1; resize: none; border: 1px solid #eadfcb; border-radius: 12px;
  padding: 10px; font: inherit; font-size: 13px; min-height: 44px; max-height: 96px; background: var(--bd-paper);
}
.form button[type="submit"] {
  border: 0; background: var(--bd-primary); color: var(--bd-primary-contrast); border-radius: 12px; padding: 0 14px; font-weight: 700; cursor: pointer; min-height: 44px;
}
@media (prefers-reduced-motion: reduce) {
  .panel, .fab .pulse { transition: none; animation: none; }
}
`;
