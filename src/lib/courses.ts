import type { Lang } from "./i18n";

export type Course = {
  id: string;
  title: Record<Lang, string>;
  tag: "Bestseller" | "New" | "Hot" | "Free";
  category: "beginner" | "options" | "technical";
  lessons: number;
  language: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: string;
  hue: "primary" | "success" | "gold";
};

// Sample catalog for the MVP showcase — replace with real courses later.
export const courses: Course[] = [
  { id: "chart-reading", title: { en: "Chart Reading Masterclass", hi: "चार्ट रीडिंग मास्टरक्लास" }, tag: "Bestseller", category: "technical", lessons: 32, language: "Hindi", price: 1999, mrp: 3999, rating: 4.8, reviews: "2.1K", hue: "primary" },
  { id: "options-beginners", title: { en: "Options Trading for Beginners", hi: "बिगिनर्स के लिए ऑप्शंस ट्रेडिंग" }, tag: "New", category: "options", lessons: 24, language: "Hindi", price: 2499, mrp: 4999, rating: 4.7, reviews: "1.8K", hue: "success" },
  { id: "price-action", title: { en: "Price Action Strategy", hi: "प्राइस एक्शन स्ट्रैटेजी" }, tag: "Hot", category: "technical", lessons: 28, language: "Hindi", price: 2999, mrp: 5999, rating: 4.8, reviews: "3.4K", hue: "gold" },
  { id: "swing-trading", title: { en: "Swing Trading Complete Course", hi: "स्विंग ट्रेडिंग कम्प्लीट कोर्स" }, tag: "Bestseller", category: "technical", lessons: 45, language: "Hindi", price: 3999, mrp: 6999, rating: 4.6, reviews: "1.2K", hue: "primary" },
  { id: "basics", title: { en: "Stock Market Basics", hi: "शेयर मार्केट की बुनियाद" }, tag: "Free", category: "beginner", lessons: 12, language: "Hindi + English", price: 0, mrp: 0, rating: 4.9, reviews: "5.6K", hue: "success" },
  { id: "risk", title: { en: "Risk Management Essentials", hi: "रिस्क मैनेजमेंट एसेंशियल्स" }, tag: "New", category: "beginner", lessons: 18, language: "Hindi", price: 1499, mrp: 2999, rating: 4.7, reviews: "980", hue: "gold" },
];

export const liveClasses = [
  { id: "l1", title: { en: "Candlestick Basics for Beginners", hi: "बिगिनर्स के लिए कैंडलस्टिक बेसिक्स" }, day: "today" as const, time: "7:00 PM", joining: "1,248", live: true },
  { id: "l2", title: { en: "Options Trading Live Q&A", hi: "ऑप्शंस ट्रेडिंग लाइव Q&A" }, day: "tomorrow" as const, time: "7:00 PM", joining: "892", live: false },
  { id: "l3", title: { en: "Live Market Analysis", hi: "लाइव मार्केट एनालिसिस" }, day: "tomorrow" as const, time: "9:15 AM", joining: "1,530", live: false },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
