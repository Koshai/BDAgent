import { prisma } from "../db.js";
import { crawlSite, crawlSiteWithStats } from "./crawl.js";
import { probeCommerce } from "./probe.js";
import { buildSiteBrief } from "./site-context.js";
import { DEFAULT_WIDGET_PRIMARY, detectSitePrimaryColor, normalizeHex } from "./brand-color.js";
import { credentialsForStore, fetchWooProducts } from "./woo.js";

export async function upsertProducts(
  storeId: string,
  drafts: Array<{
    title: string;
    description: string;
    price: number | null;
    currency: string;
    url: string;
    imageUrl: string | null;
    source: string;
    inStock?: boolean;
    categories?: string[];
    externalId?: string;
    rawJson?: unknown;
  }>,
) {
  let count = 0;
  for (const draft of drafts) {
    const url = draft.url.split("?")[0];
    const existing = await prisma.product.findUnique({
      where: { storeId_url: { storeId, url } },
    });
    const description =
      (draft.description?.length ?? 0) >= (existing?.description.length ?? 0)
        ? draft.description
        : existing!.description;
    await prisma.product.upsert({
      where: { storeId_url: { storeId, url } },
      create: {
        storeId,
        title: draft.title,
        description: draft.description,
        price: draft.price,
        currency: draft.currency,
        url,
        imageUrl: draft.imageUrl,
        source: draft.source,
        inStock: draft.inStock ?? true,
        categories: draft.categories ?? [],
        externalId: draft.externalId,
        rawJson: draft.rawJson as object | undefined,
      },
      update: {
        title: draft.title,
        description,
        price: draft.price,
        currency: draft.currency,
        imageUrl: draft.imageUrl ?? existing?.imageUrl,
        source: draft.source,
        inStock: draft.inStock ?? true,
        categories: (draft.categories?.length ? draft.categories : existing?.categories) ?? [],
        externalId: draft.externalId ?? existing?.externalId,
        rawJson: (draft.rawJson as object | undefined) ?? (existing?.rawJson as object | undefined),
      },
    });
    count += 1;
  }
  return count;
}

export async function syncCatalog(storeId: string, mode: "crawl" | "woo") {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Store not found");

  if (mode === "woo") {
    const creds = await credentialsForStore(storeId);
    if (!creds) throw new Error("Connect WooCommerce first");
    const drafts = await fetchWooProducts(creds);
    const count = await upsertProducts(
      storeId,
      drafts.map((d) => ({ ...d, currency: store.currency })),
    );
    await prisma.wooConnection.update({
      where: { storeId },
      data: { lastSyncedAt: new Date() },
    });
    return { count, source: "woo" as const };
  }

  const drafts = await crawlSite(store.siteUrl);
  const count = await upsertProducts(
    storeId,
    drafts.map((d) => ({ ...d, currency: d.currency || store.currency })),
  );
  return { count, source: "crawl" as const };
}

export async function scanStore(storeId: string) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Store not found");
  const probe = await probeCommerce(store.siteUrl);
  const { pages, products } = await crawlSiteWithStats(store.siteUrl, probe.seedRoutes);
  const count = await upsertProducts(
    storeId,
    products.map((d) => ({ ...d, currency: d.currency || store.currency })),
  );
  const storeType = probe.kind === "woocommerce" || store.storeType === "woocommerce" ? "woocommerce" : "custom";
  const siteBrief = await buildSiteBrief(store.name, store.siteUrl);

  let widgetPrimaryColor = store.widgetPrimaryColor || DEFAULT_WIDGET_PRIMARY;
  let detectedColor: string | null = null;
  if (!store.widgetColorManual) {
    detectedColor = await detectSitePrimaryColor(store.siteUrl);
    if (detectedColor) widgetPrimaryColor = detectedColor;
  }

  await prisma.store.update({
    where: { id: storeId },
    data: {
      commerceKind: probe.kind,
      storeType,
      cartDetected: probe.cartDetected,
      pagesScanned: pages,
      offersFound: count,
      lastScannedAt: new Date(),
      siteBrief,
      widgetPrimaryColor,
      scanSignals: {
        confidence: probe.confidence,
        signals: probe.signals,
        notes: probe.notes,
        seedRoutes: probe.seedRoutes,
        briefChars: siteBrief.length,
        detectedColor,
      },
    },
  });
  return {
    probe,
    pages,
    count,
    storeType,
    siteBrief: siteBrief.slice(0, 280),
    widgetPrimaryColor,
    detectedColor,
  };
}

export async function applyDetectedWidgetColor(storeId: string, force = false) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Store not found");
  if (store.widgetColorManual && !force) {
    return {
      skipped: true as const,
      widgetPrimaryColor: store.widgetPrimaryColor || DEFAULT_WIDGET_PRIMARY,
      reason: "manual",
    };
  }
  const detected = await detectSitePrimaryColor(store.siteUrl);
  const color = normalizeHex(detected ?? "") ?? store.widgetPrimaryColor ?? DEFAULT_WIDGET_PRIMARY;
  const updated = await prisma.store.update({
    where: { id: storeId },
    data: {
      widgetPrimaryColor: color,
      widgetColorManual: force ? false : store.widgetColorManual,
    },
  });
  return {
    skipped: false as const,
    widgetPrimaryColor: updated.widgetPrimaryColor,
    detectedColor: detected,
  };
}
