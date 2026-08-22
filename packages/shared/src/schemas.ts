import { z } from "zod";
import { EVENT_TYPES } from "./events.js";
import { LOCALES } from "./locales.js";

export const localeSchema = z.enum(LOCALES);

export const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const agentToneSchema = z.enum(["friendly", "professional", "warm", "concise", "playful"]);
export const agentLengthSchema = z.enum(["brief", "balanced", "detailed"]);

export const storeCreateSchema = z.object({
  name: z.string().min(1).max(120),
  siteUrl: z.string().url(),
  defaultLocale: localeSchema.default("en"),
  currency: z.enum(["USD", "BDT"]).default("USD"),
  allowedDomains: z.array(z.string().min(1)).default([]),
  policies: z.string().max(4000).optional(),
  storeType: z.enum(["custom", "woocommerce"]).default("custom"),
  agentTone: agentToneSchema.default("friendly"),
  agentLength: agentLengthSchema.default("balanced"),
  suggestAlternatives: z.boolean().default(true),
  askClarifying: z.boolean().default(true),
  upsellEnabled: z.boolean().default(false),
  collectEmail: z.boolean().default(false),
  extraInstructions: z.string().max(2000).optional(),
  autoSyncDaily: z.boolean().default(false),
  autoSyncHourUtc: z.number().int().min(0).max(23).default(0),
  widgetPrimaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .default("#0b6e4f"),
  widgetColorManual: z.boolean().default(false),
});

export const storeUpdateSchema = storeCreateSchema.partial();

export const pageContextSchema = z.object({
  url: z.string().min(1).max(2000),
  title: z.string().max(500).optional(),
  locale: localeSchema,
});

export const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  visitorId: z.string().min(8).max(80),
  message: z.string().min(1).max(2000),
  locale: localeSchema,
  page: pageContextSchema,
});

export const widgetEventSchema = z.object({
  visitorId: z.string().min(8).max(80),
  type: z.enum(EVENT_TYPES),
  path: z.string().max(2000).optional(),
  productId: z.string().optional(),
  locale: localeSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const wooConnectSchema = z.object({
  siteUrl: z.string().url(),
  consumerKey: z.string().min(8),
  consumerSecret: z.string().min(8),
});

export const orderLookupSchema = z.object({
  visitorId: z.string().min(8).max(80),
  orderId: z.string().min(1).max(40),
  email: z.string().email(),
  locale: localeSchema.optional(),
});

export const merchantReplySchema = z.object({
  content: z.string().min(1).max(4000),
  handoff: z.boolean().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type WidgetEvent = z.infer<typeof widgetEventSchema>;
export type StoreCreate = z.infer<typeof storeCreateSchema>;

