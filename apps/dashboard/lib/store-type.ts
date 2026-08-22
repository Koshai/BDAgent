export type StoreType = "custom" | "woocommerce";

export function storeTypeLabel(type?: string | null) {
  return type === "woocommerce" ? "WooCommerce" : "Custom site";
}
