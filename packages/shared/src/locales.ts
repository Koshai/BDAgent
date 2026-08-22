export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

export function parseLocale(value: string | null | undefined): Locale {
  if (!value) return "en";
  const lower = value.toLowerCase();
  if (lower === "bn" || lower.startsWith("bn-") || lower === "bengali" || lower === "bangla") {
    return "bn";
  }
  return "en";
}

export function detectBrowserLocale(language: string | undefined, fallback: Locale = "en"): Locale {
  if (!language) return fallback;
  const lower = language.toLowerCase();
  if (lower === "bn" || lower.startsWith("bn-") || lower === "bengali" || lower === "bangla") {
    return "bn";
  }
  if (lower === "en" || lower.startsWith("en-")) return "en";
  return fallback;
}
