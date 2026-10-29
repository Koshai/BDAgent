import { detectBrowserLocale, widgetCopy, type Locale } from "@bdagent/shared";
import { widgetCss } from "./styles";

type ProductCard = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl: string | null;
  inStock?: boolean;
  externalId?: string | null;
  source?: string;
};

type Bootstrap = {
  store: { id: string; name: string; defaultLocale: string; currency: string; primaryColor?: string };
  suggestions?: string[];
  hasWoo?: boolean;
};

function hexToRgb(hex: string): [number, number, number] | null {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function contrastOn(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? "#14221c" : "#ffffff";
}

function softTint(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#e6f4ee";
  const [r, g, b] = rgb.map((c) => Math.round(c + (255 - c) * 0.85));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function applyPrimaryColor(root: HTMLElement, color?: string) {
  const primary = color && hexToRgb(color) ? (color.startsWith("#") ? color : `#${color}`) : "#0b6e4f";
  const rgb = hexToRgb(primary)!;
  root.style.setProperty("--bd-primary", primary);
  root.style.setProperty("--bd-primary-contrast", contrastOn(primary));
  root.style.setProperty("--bd-primary-soft", softTint(primary));
  root.style.setProperty("--bd-primary-shadow", `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.35)`);
}

function scriptEl(): HTMLScriptElement | null {
  return document.currentScript as HTMLScriptElement | null;
}

function visitorId(): string {
  const key = "bdagent_vid";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function money(price: number | null, currency: string, locale: Locale): string {
  if (price == null) return locale === "bn" ? "দাম দেখুন" : "See price";
  try {
    return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

function demoCartPush(title: string) {
  const key = "bdagent_demo_cart";
  try {
    const items = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    items.push(title);
    localStorage.setItem(key, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("bdagent-cart", { detail: { count: items.length } }));
  } catch {
    /* ignore */
  }
}

export function mountWidget() {
  const script = scriptEl() || document.querySelector<HTMLScriptElement>("script[data-token]");
  if (!script) return;
  const token = script.dataset.token;
  if (!token) return;
  const apiBase = new URL(script.src, location.href).origin;
  const vid = visitorId();

  const host = document.createElement("div");
  host.id = "bdagent-root";
  const shadow = host.attachShadow({ mode: "open" });
  document.body.appendChild(host);

  let locale: Locale = detectBrowserLocale(navigator.language);
  let conversationId: string | undefined;
  let boot: Bootstrap | null = null;
  let handoff = false;
  let lastMerchantAt = new Date().toISOString();

  const style = document.createElement("style");
  style.textContent = widgetCss;
  const wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.innerHTML = `
    <div class="panel" role="dialog" aria-label="Dyotona">
      <div class="head">
        <span class="live"></span>
        <div class="brand"><h2></h2><p></p></div>
        <div class="langs">
          <button type="button" data-lang="en">EN</button>
          <button type="button" data-lang="bn">বাংলা</button>
        </div>
        <button type="button" class="icon-btn" data-close>×</button>
      </div>
      <div class="messages"></div>
      <form class="order" hidden>
        <input name="orderId" autocomplete="off" />
        <input name="email" type="email" autocomplete="email" />
        <button type="submit"></button>
      </form>
      <div class="tools">
        <button type="button" data-track></button>
      </div>
      <form class="form">
        <textarea rows="1"></textarea>
        <button type="submit"></button>
      </form>
    </div>
    <button type="button" class="fab">
      <span class="pulse"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M4 6h16v12H4z" /><path d="M8 10h8M8 14h5" />
      </svg>
    </button>
  `;
  shadow.append(style, wrap);

  const panel = wrap.querySelector(".panel") as HTMLElement;
  const fab = wrap.querySelector(".fab") as HTMLButtonElement;
  const messages = wrap.querySelector(".messages") as HTMLElement;
  const form = wrap.querySelector(".form") as HTMLFormElement;
  const orderForm = wrap.querySelector(".order") as HTMLFormElement;
  const textarea = wrap.querySelector("textarea") as HTMLTextAreaElement;
  const sendBtn = form.querySelector("button[type='submit']") as HTMLButtonElement;
  const titleEl = wrap.querySelector(".brand h2") as HTMLElement;
  const subEl = wrap.querySelector(".brand p") as HTMLElement;
  const trackBtn = wrap.querySelector("[data-track]") as HTMLButtonElement;
  const orderIdInput = orderForm.querySelector('input[name="orderId"]') as HTMLInputElement;
  const orderEmailInput = orderForm.querySelector('input[name="email"]') as HTMLInputElement;
  const orderSubmit = orderForm.querySelector("button") as HTMLButtonElement;

  function copy() {
    return widgetCopy[locale];
  }

  function applyCopy() {
    const c = copy();
    titleEl.textContent = boot?.store.name || c.title;
    subEl.textContent = handoff ? c.waitingHuman : c.subtitle;
    textarea.placeholder = c.placeholder;
    sendBtn.textContent = c.send;
    fab.setAttribute("aria-label", c.open);
    trackBtn.textContent = c.trackOrder;
    orderIdInput.placeholder = c.orderId;
    orderEmailInput.placeholder = c.orderEmail;
    orderSubmit.textContent = c.orderLookup;
    wrap.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.classList.toggle("active", (btn as HTMLElement).dataset.lang === locale);
    });
  }

  function addBubble(role: "user" | "assistant" | "merchant", text: string) {
    const el = document.createElement("div");
    el.className = `bubble ${role}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function renderChips(list: string[]) {
    if (!list.length) return;
    const box = document.createElement("div");
    box.className = "chips";
    const hint = document.createElement("span");
    hint.className = "chips-hint";
    hint.textContent = copy().chipsHint;
    box.appendChild(hint);
    for (const label of list) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = label;
      b.addEventListener("click", () => {
        textarea.value = label;
        form.requestSubmit();
      });
      box.appendChild(b);
    }
    messages.appendChild(box);
  }

  async function addToCart(p: ProductCard) {
    if ((p.source === "woo" && p.externalId) || (p.externalId && /^\d+$/.test(p.externalId))) {
      try {
        await fetch(`${location.origin}/?add-to-cart=${encodeURIComponent(p.externalId)}`, {
          credentials: "include",
        });
      } catch {
        /* same-origin Woo cart; ignore CORS on other hosts */
      }
    } else {
      demoCartPush(p.title);
    }
    void emit("add_to_cart", {
      productId: p.id,
      metadata: { source: p.source ?? "demo", externalId: p.externalId ?? undefined },
    });
  }

  function addCards(products: ProductCard[]) {
    if (!products.length) return;
    const box = document.createElement("div");
    box.className = "cards";
    for (const p of products) {
      const row = document.createElement("div");
      row.className = "card";
      const img = document.createElement("img");
      img.alt = "";
      if (p.imageUrl) img.src = p.imageUrl;
      const meta = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = p.title;
      const price = document.createElement("span");
      price.textContent = `${money(p.price, p.currency, locale)} · ${p.inStock === false ? copy().outOfStock : copy().inStock}`;
      meta.append(title, price);
      const actions = document.createElement("div");
      actions.className = "card-actions";
      const view = document.createElement("a");
      view.href = p.url;
      view.target = "_blank";
      view.rel = "noopener";
      view.className = "cta";
      view.textContent = copy().view;
      view.addEventListener("click", () => {
        void emit("product_click", { productId: p.id, metadata: { url: p.url } });
      });
      const cart = document.createElement("button");
      cart.type = "button";
      cart.className = "cart-btn";
      cart.textContent = copy().addToCart;
      cart.addEventListener("click", async () => {
        cart.disabled = true;
        await addToCart(p);
        cart.textContent = copy().added;
      });
      actions.append(view, cart);
      row.append(img, meta, actions);
      box.appendChild(row);
    }
    messages.appendChild(box);
    messages.scrollTop = messages.scrollHeight;
  }

  async function emit(type: string, extra: { productId?: string; metadata?: Record<string, unknown> } = {}) {
    try {
      await fetch(`${apiBase}/v1/widget/events`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          visitorId: vid,
          type,
          path: location.pathname + location.search,
          locale,
          ...extra,
        }),
      });
    } catch {
      /* ignore */
    }
  }

  async function pollMerchant() {
    if (!conversationId || !panel.classList.contains("open")) return;
    try {
      const res = await fetch(
        `${apiBase}/v1/widget/messages?conversationId=${encodeURIComponent(conversationId)}&visitorId=${encodeURIComponent(vid)}&after=${encodeURIComponent(lastMerchantAt)}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        handoff?: boolean;
        messages: Array<{ content: string; createdAt: string }>;
      };
      if (typeof data.handoff === "boolean" && data.handoff !== handoff) {
        handoff = data.handoff;
        applyCopy();
      }
      for (const m of data.messages) {
        addBubble("merchant", m.content);
        lastMerchantAt = m.createdAt;
      }
    } catch {
      /* ignore */
    }
  }

  async function bootstrap() {
    const res = await fetch(`${apiBase}/v1/widget/bootstrap`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("bootstrap failed");
    boot = (await res.json()) as Bootstrap;
    locale = detectBrowserLocale(navigator.language, boot.store.defaultLocale as Locale);
    applyPrimaryColor(host, boot.store.primaryColor);
    applyCopy();
    addBubble("assistant", copy().greeting);
    renderChips(boot.suggestions ?? []);
    orderForm.hidden = true;
    trackBtn.hidden = !boot.hasWoo;
    wrap.querySelector(".tools")?.toggleAttribute("hidden", !boot.hasWoo);
    void emit("page_view");
    const productNode = document.querySelector("[data-product_id], [data-product-id]");
    const productIdAttr =
      productNode?.getAttribute("data-product_id") || productNode?.getAttribute("data-product-id") || undefined;
    if (productIdAttr || /product|item|p=\d+/i.test(location.pathname + location.search)) {
      void emit("product_view", {
        metadata: { externalId: productIdAttr, url: location.href },
      });
    }
  }

  fab.addEventListener("click", () => {
    panel.classList.add("open");
    void emit("chat_open");
    textarea.focus();
  });
  wrap.querySelector("[data-close]")?.addEventListener("click", () => panel.classList.remove("open"));
  wrap.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      locale = ((btn as HTMLElement).dataset.lang as Locale) || "en";
      applyCopy();
    });
  });
  trackBtn.addEventListener("click", () => {
    orderForm.hidden = !orderForm.hidden;
    orderForm.classList.toggle("show", !orderForm.hidden);
  });

  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const orderId = orderIdInput.value.trim();
    const email = orderEmailInput.value.trim();
    if (!orderId || !email) return;
    addBubble("user", `${copy().orderId} ${orderId}`);
    const thinking = addBubble("assistant", copy().thinking);
    thinking.classList.add("thinking");
    try {
      const res = await fetch(`${apiBase}/v1/widget/order-status`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ visitorId: vid, orderId, email, locale }),
      });
      const data = (await res.json()) as {
        found?: boolean;
        order?: { number: string; status: string; total: string | null; currency: string };
        error?: string;
      };
      thinking.classList.remove("thinking");
      if (data.found && data.order) {
        thinking.textContent =
          locale === "bn"
            ? `অর্ডার #${data.order.number}: অবস্থা ${data.order.status}${data.order.total ? `, মোট ${data.order.currency} ${data.order.total}` : ""}.`
            : `Order #${data.order.number}: status ${data.order.status}${data.order.total ? `, total ${data.order.currency} ${data.order.total}` : ""}.`;
      } else {
        thinking.textContent =
          typeof data.error === "string"
            ? data.error
            : locale === "bn"
              ? "এই ইমেইল ও অর্ডার নম্বর মিলেনি।"
              : "No order matched that number and email.";
      }
    } catch {
      thinking.classList.remove("thinking");
      thinking.textContent = copy().error;
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = textarea.value.trim();
    if (!message) return;
    textarea.value = "";
    addBubble("user", message);
    const thinking = addBubble("assistant", copy().thinking);
    thinking.classList.add("thinking");
    try {
      const res = await fetch(`${apiBase}/v1/widget/chat`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          conversationId,
          visitorId: vid,
          message,
          locale,
          page: { url: location.href, title: document.title, locale },
        }),
      });
      if (!res.ok || !res.body) throw new Error("chat failed");
      thinking.textContent = "";
      thinking.classList.remove("thinking");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let products: ProductCard[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const block of parts) {
          const line = block.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          const ev = JSON.parse(line) as {
            type: string;
            text?: string;
            conversationId?: string;
            products?: ProductCard[];
            active?: boolean;
          };
          if (ev.type === "meta" && ev.conversationId) conversationId = ev.conversationId;
          if (ev.type === "token" && ev.text) {
            thinking.textContent = (thinking.textContent || "") + ev.text;
            messages.scrollTop = messages.scrollHeight;
          }
          if (ev.type === "products" && ev.products) products = ev.products;
          if (ev.type === "handoff") {
            handoff = Boolean(ev.active);
            applyCopy();
          }
        }
      }
      if (!thinking.textContent) thinking.textContent = copy().error;
      addCards(products);
    } catch {
      thinking.classList.remove("thinking");
      thinking.textContent = copy().error;
    }
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  document.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    const cart = target.closest("[data-bdagent-add-to-cart], .add-to-cart, .ajax_add_to_cart");
    if (cart) {
      demoCartPush((cart as HTMLElement).innerText?.slice(0, 80) || "item");
      void emit("add_to_cart", { metadata: { text: (cart as HTMLElement).innerText?.slice(0, 80) } });
    }
  });

  window.setInterval(() => {
    void pollMerchant();
  }, 4000);

  void bootstrap().catch(() => {
    applyCopy();
    addBubble("assistant", copy().error);
  });
}
