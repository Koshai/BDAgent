const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}\b/g;
const CARDISH = /\b(?:\d[ -]*?){13,19}\b/g;

export function redactPii(text: string): string {
  return text
    .replace(EMAIL, "[email]")
    .replace(CARDISH, "[number]")
    .replace(PHONE, "[phone]")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectLocaleHint(text: string, fallback: string): "en" | "bn" | "mixed" {
  const bangla = (text.match(/[\u0980-\u09FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  if (bangla > 8 && latin > 8) return "mixed";
  if (bangla > latin) return "bn";
  if (latin > bangla) return "en";
  return fallback === "bn" ? "bn" : "en";
}
