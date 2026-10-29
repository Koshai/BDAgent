import { BRAND } from "@/lib/brand";

/** English + Bengali product name lockup */
export function BrandLockup({
  compact = false,
  as: Tag = "span",
}: {
  compact?: boolean;
  as?: "span" | "strong" | "p";
}) {
  return (
    <Tag className={compact ? "brand-lockup compact" : "brand-lockup"}>
      <span className="brand-en">{BRAND.name}</span>
      <span className="brand-sep" aria-hidden>
        ·
      </span>
      <span className="brand-bn">{BRAND.nameBn}</span>
    </Tag>
  );
}
