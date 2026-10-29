export const EVENT_TYPES = [
  "page_view",
  "product_view",
  "product_impression",
  "add_to_cart",
  "chat_open",
  "message",
  "product_click",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
