import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { CourseCard } from "@/components/site/CourseCard";
import { courses } from "@/lib/courses";
import { useLang, type DictKey } from "@/lib/i18n";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Courses — Chartसीखो" },
      { name: "description", content: "Browse stock-market courses: chart reading, options trading, price action, swing trading and more." },
      { property: "og:title", content: "Courses — Chartसीखो" },
      { property: "og:description", content: "Browse stock-market courses from beginner to pro." },
    ],
  }),
  component: CoursesPage,
});

const filters: { key: "all" | "beginner" | "options" | "technical"; label: DictKey }[] = [
  { key: "all", label: "filter_all" },
  { key: "beginner", label: "filter_beginner" },
  { key: "options", label: "filter_options" },
  { key: "technical", label: "filter_technical" },
];

function CoursesPage() {
  const { t, lang } = useLang();
  const [f, setF] = useState<(typeof filters)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const list = courses.filter(
    (c) =>
      (f === "all" || c.category === f) &&
      (c.title.en + " " + c.title.hi).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <h1 className="font-display text-3xl font-bold text-navy">{t("all_courses")}</h1>
      <p className="mt-1 text-muted-foreground">{t("all_courses_sub")}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full rounded-full border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((x) => (
            <button key={x.key} onClick={() => setF(x.key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${f === x.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {t(x.label)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" key={lang}>
        {list.map((c) => <CourseCard key={c.id} course={c} />)}
      </div>
      {list.length === 0 && <p className="mt-10 text-center text-muted-foreground">{t("no_results")}</p>}
    </div>
  );
}
