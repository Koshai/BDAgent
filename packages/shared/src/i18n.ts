import type { Locale } from "./locales.js";

export type WidgetCopy = {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  greeting: string;
  thinking: string;
  error: string;
  langEn: string;
  langBn: string;
  products: string;
  close: string;
  open: string;
  view: string;
  inStock: string;
  outOfStock: string;
  chipsHint: string;
  addToCart: string;
  added: string;
  trackOrder: string;
  orderId: string;
  orderEmail: string;
  orderLookup: string;
  waitingHuman: string;
};

export const widgetCopy: Record<Locale, WidgetCopy> = {
  en: {
    title: "Shopping assistant",
    subtitle: "Ask in English or বাংলা",
    placeholder: "Ask about a product, size, or price…",
    send: "Send",
    greeting: "Hi — I can help you find the right product and get you to checkout.",
    thinking: "Looking through the store…",
    error: "Something went wrong. Please try again.",
    langEn: "EN",
    langBn: "বাংলা",
    products: "Suggested for you",
    close: "Close chat",
    open: "Open shopping assistant",
    view: "View",
    inStock: "In stock",
    outOfStock: "Out of stock",
    chipsHint: "Try asking",
    addToCart: "Add to cart",
    added: "Added to cart",
    trackOrder: "Track an order",
    orderId: "Order number",
    orderEmail: "Email on the order",
    orderLookup: "Look up",
    waitingHuman: "A person from the store will reply here shortly.",
  },
  bn: {
    title: "কেনাকাটার সহকারী",
    subtitle: "ইংরেজি বা বাংলায় জিজ্ঞাসা করুন",
    placeholder: "পণ্য, সাইজ বা দাম সম্পর্কে জিজ্ঞাসা করুন…",
    send: "পাঠান",
    greeting: "হ্যালো — আমি আপনাকে সঠিক পণ্য খুঁজে চেকআউট পর্যন্ত সাহায্য করতে পারি।",
    thinking: "দোকান খুঁজে দেখছি…",
    error: "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    langEn: "EN",
    langBn: "বাংলা",
    products: "আপনার জন্য পরামর্শ",
    close: "চ্যাট বন্ধ করুন",
    open: "কেনাকাটার সহকারী খুলুন",
    view: "দেখুন",
    inStock: "স্টকে আছে",
    outOfStock: "স্টকে নেই",
    chipsHint: "জিজ্ঞাসা করে দেখুন",
    addToCart: "কার্টে যোগ করুন",
    added: "কার্টে যোগ হয়েছে",
    trackOrder: "অর্ডার খুঁজুন",
    orderId: "অর্ডার নম্বর",
    orderEmail: "অর্ডারের ইমেইল",
    orderLookup: "দেখুন",
    waitingHuman: "দোকানের কেউ এখানে উত্তর দেবেন।",
  },
};
