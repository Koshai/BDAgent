import { BRAND, PROD_HOSTS } from "@/lib/brand";

export const metadata = { title: `Inbox & orders · ${BRAND.name}` };

export default function DocsInbox() {
  return (
    <>
      <p className="kicker">Docs</p>
      <h1>Inbox &amp; orders</h1>
      <p className="lede">Shopper threads land in Inbox. You can take over from the model when a human should reply.</p>

      <h2>Reply and handoff</h2>
      <p>
        Open a conversation and send a reply. The widget polls for merchant messages. Handoff pauses the LLM for that
        thread so the shopper is not answered by both you and the model.
      </p>

      <h2>Order status</h2>
      <p>
        On a Woo-connected store, shoppers can look up an order with the order number and the{" "}
        <strong>billing email</strong> on the order. Mismatched email returns nothing.
      </p>
      <p>
        Hosted demo: order <code>1001</code>, email <code>shopper@example.com</code> on{" "}
        <a href={`${PROD_HOSTS.api}/demo/woo/`} target="_blank" rel="noreferrer">
          Ghor Mart
        </a>
        .
      </p>

      <h2>Languages</h2>
      <p>
        The bubble follows the browser language (<code>bn</code> / <code>bn-BD</code> → Bengali) or the store default.
        Shoppers can toggle EN / বাংলা.
      </p>

      <h2>Analytics</h2>
      <p>
        The dashboard shows conversation volume, language mix, and popular products. Product views, clicks, and chat
        impressions also help rank catalog matches for later shoppers—{BRAND.name} does not fine-tune a private model
        from your traffic yet.
      </p>
    </>
  );
}
