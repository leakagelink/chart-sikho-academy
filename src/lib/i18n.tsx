import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  nav_home: { en: "Home", hi: "होम" },
  nav_courses: { en: "Courses", hi: "कोर्स" },
  search: { en: "Search courses…", hi: "कोर्स खोजें…" },
  login: { en: "Login", hi: "लॉगिन" },
  signup: { en: "Sign Up", hi: "साइन अप" },
  offer: { en: "FLAT 40% OFF · ENDS TONIGHT", hi: "फ्लैट 40% छूट · आज रात तक" },
  hero_1: { en: "Seekho Share Market.", hi: "सीखो शेयर मार्केट।" },
  hero_2: { en: "Banao Apni Kamai.", hi: "बनाओ अपनी कमाई।" },
  hero_sub: {
    en: "Live classes, recorded courses and free content — beginner to pro, in Hindi & English.",
    hi: "लाइव क्लास, रिकॉर्डेड कोर्स और फ्री कंटेंट — बिगिनर से प्रो तक, हिंदी और इंग्लिश में।",
  },
  demo_cta: { en: "Join Free Demo Class", hi: "फ्री डेमो क्लास जॉइन करें" },
  explore: { en: "Explore Courses", hi: "कोर्स देखें" },
  cat_live: { en: "Live Classes", hi: "लाइव क्लास" },
  cat_recorded: { en: "Recorded Courses", hi: "रिकॉर्डेड कोर्स" },
  cat_free: { en: "Free Content", hi: "फ्री कंटेंट" },
  cat_popular: { en: "Popular Courses", hi: "लोकप्रिय कोर्स" },
  upcoming: { en: "Upcoming Live Classes", hi: "आने वाली लाइव क्लास" },
  popular: { en: "Most Popular Courses", hi: "सबसे लोकप्रिय कोर्स" },
  see_all: { en: "See all", hi: "सभी देखें" },
  join_live: { en: "Join Live", hi: "लाइव जॉइन करें" },
  remind: { en: "Remind Me", hi: "याद दिलाएँ" },
  joining: { en: "joining", hi: "जुड़ रहे हैं" },
  lessons: { en: "lessons", hi: "लेसन" },
  enroll: { en: "View Course", hi: "कोर्स देखें" },
  membership_t: { en: "Chartसीखो Membership", hi: "Chartसीखो मेंबरशिप" },
  membership_s: {
    en: "Unlock every recorded course, weekly live sessions and members-only market notes.",
    hi: "सभी रिकॉर्डेड कोर्स, साप्ताहिक लाइव सेशन और मेंबर्स-ओनली मार्केट नोट्स पाएँ।",
  },
  membership_cta: { en: "View Plans", hi: "प्लान देखें" },
  stats_students: { en: "Students", hi: "छात्र" },
  stats_courses: { en: "Courses", hi: "कोर्स" },
  stats_rating: { en: "Avg. rating", hi: "औसत रेटिंग" },
  disclaimer: {
    en: "Educational content only. Not investment advice. Market investments are subject to risk.",
    hi: "केवल शैक्षिक सामग्री। निवेश सलाह नहीं। मार्केट निवेश जोखिम के अधीन है।",
  },
  all_courses: { en: "All Courses", hi: "सभी कोर्स" },
  all_courses_sub: {
    en: "Pick a path — from candlestick basics to options strategies.",
    hi: "अपना रास्ता चुनें — कैंडलस्टिक बेसिक्स से ऑप्शंस स्ट्रैटेजी तक।",
  },
  filter_all: { en: "All", hi: "सभी" },
  filter_beginner: { en: "Beginner", hi: "बिगिनर" },
  filter_options: { en: "Options", hi: "ऑप्शंस" },
  filter_technical: { en: "Technical", hi: "टेक्निकल" },
  no_results: { en: "No courses match your search.", hi: "कोई कोर्स नहीं मिला।" },
  today: { en: "Today", hi: "आज" },
  tomorrow: { en: "Tomorrow", hi: "कल" },
  welcome_back: { en: "Welcome back", hi: "फिर से स्वागत है" },
  create_account: { en: "Create account", hi: "अकाउंट बनाएँ" },
  forgot_title: { en: "Reset your password", hi: "पासवर्ड रीसेट करें" },
  full_name: { en: "Full name", hi: "पूरा नाम" },
  phone: { en: "Phone (optional)", hi: "फ़ोन (वैकल्पिक)" },
  email: { en: "Email", hi: "ईमेल" },
  password: { en: "Password (min 6)", hi: "पासवर्ड (कम से कम 6)" },
  check_email: { en: "Check your email to confirm your account.", hi: "अकाउंट कन्फ़र्म करने के लिए अपना ईमेल देखें।" },
  reset_sent: { en: "Password reset link sent to your email.", hi: "पासवर्ड रीसेट लिंक आपके ईमेल पर भेजा गया।" },
  send_reset: { en: "Send reset link", hi: "रीसेट लिंक भेजें" },
  forgot_q: { en: "Forgot password?", hi: "पासवर्ड भूल गए?" },
  or: { en: "or", hi: "या" },
  continue_google: { en: "Continue with Google", hi: "Google से जारी रखें" },
  new_password: { en: "Set a new password", hi: "नया पासवर्ड सेट करें" },
  save: { en: "Save", hi: "सेव करें" },
  saved: { en: "Saved!", hi: "सेव हो गया!" },
  namaste: { en: "Namaste", hi: "नमस्ते" },
  my_courses: { en: "My Courses", hi: "मेरे कोर्स" },
  avg_progress: { en: "Avg. progress", hi: "औसत प्रगति" },
  upcoming_short: { en: "Upcoming live", hi: "आने वाली लाइव" },
  continue_learning: { en: "Continue Learning", hi: "पढ़ाई जारी रखें" },
  lesson: { en: "Lesson", hi: "लेसन" },
  no_enrollments: { en: "You haven't joined any course yet.", hi: "आपने अभी कोई कोर्स जॉइन नहीं किया।" },
  completed: { en: "Completed", hi: "पूरा हुआ" },
  mark_next_done: { en: "Mark next lesson done", hi: "अगला लेसन पूरा करें" },
  explore_more: { en: "Explore more courses", hi: "और कोर्स देखें" },
  my_learning: { en: "My Learning", hi: "मेरी पढ़ाई" },
  my_profile: { en: "My Profile", hi: "मेरी प्रोफ़ाइल" },
  state: { en: "State", hi: "राज्य" },
  city: { en: "City / District", hi: "शहर / ज़िला" },
  pref_lang: { en: "Preferred language", hi: "पसंदीदा भाषा" },
  logout: { en: "Log out", hi: "लॉग आउट" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल" },
} satisfies Record<string, Record<Lang, string>>;

export type DictKey = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("cs-lang");
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("cs-lang", l);
  };
  return (
    <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);
