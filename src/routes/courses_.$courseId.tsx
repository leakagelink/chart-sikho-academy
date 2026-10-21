import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Lock, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MiniChart } from "@/components/site/CourseCard";
import { courses, inr } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/courses_/$courseId")({
  head: ({ params }) => {
    const c = courses.find((x) => x.id === params.courseId);
    const title = c ? `${c.title.en} — Chartसीखो` : "Course — Chartसीखो";
    return {
      meta: [
        { title },
        { name: "description", content: c ? `${c.title.en}: ${c.lessons} lessons in ${c.language}.` : "Stock-market course on Chartसीखो." },
        { property: "og:title", content: title },
        { property: "og:description", content: c ? `${c.title.en}: ${c.lessons} lessons in ${c.language}.` : "Stock-market course on Chartसीखो." },
      ],
    };
  },
  component: CourseDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 pt-16 text-center">
      <p className="text-muted-foreground">Course not found.</p>
      <Link to="/courses" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">All courses</Link>
    </div>
  ),
});

const hueBg = { primary: "from-navy to-primary", success: "from-navy to-success", gold: "from-navy to-gold" };

function CourseDetail() {
  const { courseId } = Route.useParams();
  const { t, lang } = useLang();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const course = courses.find((x) => x.id === courseId);
  if (!course) return null;
  const free = course.price === 0;
  const off = course.mrp ? Math.round((1 - course.price / course.mrp) * 100) : 0;

  async function enroll() {
    if (!session) {
      navigate({ to: "/auth", search: { redirect: `/courses/${courseId}` } });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("enrollments").insert({ user_id: session.user.id, course_id: courseId, progress: 0 });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("enrolled"));
    navigate({ to: "/dashboard" });
  }

  function buyPaid() {
    toast.info(t("payments_soon_s"), { description: t("payments_soon_t") });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {t("nav_courses")}
      </Link>
      <div className={`mt-4 flex h-44 items-end justify-end rounded-3xl bg-gradient-to-br p-6 ${hueBg[course.hue]}`}>
        <MiniChart />
      </div>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">{course.title[lang]}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold text-gold" /><b className="text-foreground">{course.rating}</b> ({course.reviews})</span>
            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{course.lessons} {t("lessons")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.language}</span>
          </div>
          <h2 className="mt-8 font-display text-xl font-bold text-navy">{t("what_learn")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(["wl_1", "wl_2", "wl_3", "wl_4"] as const).map((k) => (
              <li key={k} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{t(k)}</li>
            ))}
          </ul>
          <p className="mt-8 rounded-2xl bg-muted p-4 text-xs text-muted-foreground">{t("disclaimer")}</p>
        </div>
        <aside className="h-fit rounded-3xl border border-border bg-card p-5 shadow-card">
          <Button asChild variant="outline" className="mb-4 w-full"><Link to="/sandbox/learn">{t("preview_mock")}</Link></Button>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy">{free ? "FREE" : inr(course.price)}</span>
            {course.mrp > 0 && <span className="text-sm text-muted-foreground line-through">{inr(course.mrp)}</span>}
            {off > 0 && <span className="text-sm font-semibold text-success">{off}% off</span>}
          </div>
          {free ? (
            <button onClick={enroll} disabled={busy} className="mt-4 w-full rounded-lg bg-success py-2.5 font-semibold text-success-foreground hover:bg-success/90 disabled:opacity-60">
              {session ? t("enroll_free") : t("login_to_enroll")}
            </button>
          ) : (
            <>
              <button onClick={buyPaid} className="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90">
                {t("buy_now")}
              </button>
              <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t("payments_soon_t")}
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
