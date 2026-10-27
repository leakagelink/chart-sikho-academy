import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { CourseCard } from "@/components/site/CourseCard";
import { courses } from "@/lib/courses";
import { useLang, type DictKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from '@tanstack/react-query';
import { catalogQuery } from '@/lib/catalog-query';

export const Route = createFileRoute("/courses")({
  loader:({context})=>context.queryClient.ensureQueryData(catalogQuery()),
  errorComponent:CatalogError,
  notFoundComponent:CatalogError,
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
  { key: "beginner", label: "filter_basics" },
  { key: "technical", label: "filter_technical" },
  { key: "options", label: "filter_options" },
];

function CoursesPage() {
  const { t, lang } = useLang();
  const {data:cloud}=useSuspenseQuery(catalogQuery());
  const [f, setF] = useState<(typeof filters)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const list = courses.filter(
    (c) =>
      (f === "all" || c.category === f) &&
      (c.title.en + " " + c.title.hi).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <h1 className="font-display text-3xl font-bold text-foreground">{t("all_courses")}</h1>
      <p className="mt-1 text-muted-foreground">{t("all_courses_sub")}</p>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input aria-label={t("search")} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full rounded-full border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <div className="flex flex-wrap gap-2">
          {filters.map((x) => (
            <Button variant={f === x.key ? "default" : "secondary"} aria-pressed={f === x.key} key={x.key} onClick={() => setF(x.key)} className="rounded-full">
              {t(x.label)}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cloud.filter(c=>(f==='all'||c.category===f||(f==='beginner'&&c.category==='basics'))&&c.title.toLowerCase().includes(q.toLowerCase())).map(c=><article key={c.id} className="rounded-lg border border-border bg-card p-5"><h2 className="font-display text-xl font-bold">{c.title}</h2><p className="my-4 text-xl font-bold text-primary">₹{c.price}</p><Button asChild><Link to="/courses/$courseId" params={{courseId:c.id}}>{t('enroll')}</Link></Button></article>)}
        {list.map((c) => <CourseCard key={c.id} course={c} />)}
      </div>
      {list.length === 0 && <p className="mt-10 text-center text-muted-foreground">{t("no_results")}</p>}
    </div>
  );
}
function CatalogError(){const {t}=useLang();return <p className="p-8">{t('admin_error')}</p>;}
