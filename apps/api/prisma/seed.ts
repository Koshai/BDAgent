import "../src/env.js";
import { prisma } from "../src/db.js";
import { hashPassword } from "../src/lib/password.js";
import { hashToken } from "../src/lib/tokens.js";
import { encryptSecret } from "../src/lib/crypto.js";

const DEMO_WIDGET = "wgt_local_demo_token_abcdefghijk123";
const DEMO_SECRET = "sec_local_demo_secret_abcdefghijk123";
const WOO_WIDGET = "wgt_local_woo_token_abcdefghijk123";
const WOO_SECRET = "sec_local_woo_secret_abcdefghijk123";
const WOO_CK = "ck_demo_key_local";
const WOO_CS = "cs_demo_secret_local";

const products = [
  {
    title: "Jamdani Saree — Midnight Indigo",
    description: "Handwoven jamdani on muslin, midnight indigo extra weft. Ships in Bangladesh and the US.",
    price: 12500,
    currency: "BDT",
    url: "http://localhost:4000/demo/jamdani.html",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
    categories: ["saree", "textiles"],
  },
  {
    title: "Kantha Throw — Mustard",
    description: "Hand-stitched kantha throw, mustard and ivory. 50x70 inches.",
    price: 85,
    currency: "USD",
    url: "http://localhost:4000/demo/kantha.html",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    categories: ["home", "textiles"],
  },
  {
    title: "Vegetable-tanned tote",
    description: "Full-grain leather tote, unlined, stitched in Dhaka. Fits a 13 inch laptop.",
    price: 6400,
    currency: "BDT",
    url: "http://localhost:4000/demo/tote.html",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
    categories: ["leather", "bags"],
  },
  {
    title: "Sylhet Orthodox Tea",
    description: "50g small-batch orthodox black tea from the Sylhet hills. Honey and malt.",
    price: 450,
    currency: "BDT",
    url: "http://localhost:4000/demo/tea.html",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800",
    categories: ["tea", "food"],
  },
];

async function main() {
  const email = "merchant@bdagent.dev";
  const passwordHash = await hashPassword("password123");
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Demo Merchant",
      passwordHash,
    },
    create: {
      email,
      name: "Demo Merchant",
      passwordHash,
    },
  });

  let store = await prisma.store.findFirst({ where: { userId: user.id, name: "Naksha Ghor" } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        userId: user.id,
        name: "Naksha Ghor",
        siteUrl: "http://localhost:4000/demo/",
        defaultLocale: "bn",
        currency: "BDT",
        allowedDomains: ["localhost"],
        policies: "We ship inside Bangladesh in 3–5 days and to the US in 10–14 days. Returns within 7 days if unused.",
        storeType: "custom",
        commerceKind: "generic",
      },
    });
  } else {
    await prisma.store.update({
      where: { id: store.id },
      data: { storeType: "custom", commerceKind: store.commerceKind === "woocommerce" ? "generic" : store.commerceKind },
    });
  }
  await prisma.apiToken.deleteMany({ where: { storeId: store.id } });
  await prisma.apiToken.createMany({
    data: [
      { storeId: store.id, type: "widget", tokenHash: hashToken(DEMO_WIDGET), prefix: DEMO_WIDGET.slice(0, 12) },
      { storeId: store.id, type: "secret", tokenHash: hashToken(DEMO_SECRET), prefix: DEMO_SECRET.slice(0, 12) },
    ],
  });

  for (const p of products) {
    await prisma.product.upsert({
      where: { storeId_url: { storeId: store.id, url: p.url } },
      create: { storeId: store.id, source: "crawl", inStock: true, ...p },
      update: { ...p, source: "crawl", inStock: true },
    });
  }

  let wooStore = await prisma.store.findFirst({ where: { userId: user.id, name: "Ghor Mart" } });
  if (!wooStore) {
    wooStore = await prisma.store.create({
      data: {
        userId: user.id,
        name: "Ghor Mart",
        siteUrl: "http://localhost:4000/demo/woo/",
        defaultLocale: "bn",
        currency: "BDT",
        allowedDomains: ["localhost"],
        policies: "Local Woo stand-in. Sample order 1001 is billed to shopper@example.com.",
        commerceKind: "woocommerce",
        storeType: "woocommerce",
        cartDetected: true,
      },
    });
  } else {
    await prisma.store.update({
      where: { id: wooStore.id },
      data: {
        siteUrl: "http://localhost:4000/demo/woo/",
        commerceKind: "woocommerce",
        storeType: "woocommerce",
        cartDetected: true,
      },
    });
  }

  await prisma.apiToken.deleteMany({ where: { storeId: wooStore.id } });
  await prisma.apiToken.createMany({
    data: [
      { storeId: wooStore.id, type: "widget", tokenHash: hashToken(WOO_WIDGET), prefix: WOO_WIDGET.slice(0, 12) },
      { storeId: wooStore.id, type: "secret", tokenHash: hashToken(WOO_SECRET), prefix: WOO_SECRET.slice(0, 12) },
    ],
  });

  const wooProducts = [
    {
      externalId: "101",
      title: "Copper lota",
      description: "Hand-beaten copper water pot. 1 litre.",
      price: 890,
      currency: "BDT",
      url: "http://localhost:4000/demo/woo/product-lota.html",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f50103eca2?w=800",
      categories: ["kitchen"],
    },
    {
      externalId: "102",
      title: "Mustard oil 1L",
      description: "Cold-pressed mustard oil from Bogura.",
      price: 420,
      currency: "BDT",
      url: "http://localhost:4000/demo/woo/product-oil.html",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800",
      categories: ["pantry"],
    },
    {
      externalId: "103",
      title: "Clay kulhar set",
      description: "Set of six unglazed tea cups.",
      price: 180,
      currency: "BDT",
      url: "http://localhost:4000/demo/woo/product-kulhar.html",
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800",
      categories: ["kitchen"],
    },
  ];

  for (const p of wooProducts) {
    await prisma.product.upsert({
      where: { storeId_url: { storeId: wooStore.id, url: p.url } },
      create: { storeId: wooStore.id, source: "woo", inStock: true, ...p },
      update: { ...p, source: "woo", inStock: true },
    });
  }

  await prisma.wooConnection.upsert({
    where: { storeId: wooStore.id },
    create: {
      storeId: wooStore.id,
      siteUrl: "http://localhost:4000",
      consumerKeyEnc: encryptSecret(WOO_CK),
      consumerSecretEnc: encryptSecret(WOO_CS),
    },
    update: {
      siteUrl: "http://localhost:4000",
      consumerKeyEnc: encryptSecret(WOO_CK),
      consumerSecretEnc: encryptSecret(WOO_CS),
    },
  });

  console.log("Seeded merchant@bdagent.dev / password123");
  console.log("Handloom demo: http://localhost:4000/demo/");
  console.log("  Widget:", DEMO_WIDGET);
  console.log("Woo demo:     http://localhost:4000/demo/woo/");
  console.log("  Widget:", WOO_WIDGET);
  console.log("  REST keys (local mock):", WOO_CK, "/", WOO_CS);
  console.log("  Sample order: 1001 / shopper@example.com");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
