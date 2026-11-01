import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Calendar, PlayCircle, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CourseCard, MiniChart } from "@/components/site/CourseCard";
import { courses, liveClasses } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { StudentCharts } from "@/components/site/StudentCharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Learning — Chartसीखो" },
      { name: "description", content: "Your Chartसीखो student portal: courses, progress and live classes." },
      { property: "og:title", content: "My Learning — Chartसीखो" },
      { property: "og:description", content: "Your Chartसीखो student portal." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useLang();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()).data,
  });
  const enrolls = useQuery({
    queryKey: ["enrollments", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("enrollments").select("course_id, progress, last_lesson").eq('user_id',user.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const cloudCourses=useQuery({queryKey:['my-cloud-courses',user.id],queryFn:async()=>{const r=await supabase.from('courses').select('id,title');if(r.error)throw r.error;return r.data;}});

  const advance = useMutation({
    mutationFn: async (e: { course_id: string; progress: number; last_lesson: number; total: number }) => {
      const next = Math.min(e.last_lesson + 1, e.total);
      const { error } = await supabase
        .from("enrollments")
        .update({ last_lesson: next, progress: Math.round((next / e.total) * 100), updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("course_id", e.course_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments", user.id] }),
  });

  const mine = (enrolls.data ?? []).flatMap((e) => { const course = courses.find((c) => c.id === e.course_id); return course ? [{ ...e, course }] : []; });
  const enrolledIds = new Set(mine.map((m) => m.course_id));
  const name = profile.data?.full_name || user.email?.split("@")[0];
  const avg = mine.length ? Math.round(mine.reduce((s, m) => s + m.progress, 0) / mine.length) : 0;
  const cont = mine[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <p className="text-muted-foreground">{t("namaste")} 👋</p>
      <h1 className="font-display text-3xl font-bold text-foreground">{name}</h1>
      <Button asChild variant="outline" className="mt-4"><Link to="/sandbox">{t("sandbox")}</Link></Button>

      <div className="mt-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
        {[
          { icon: BookOpen, v: mine.length, l: t("my_courses") },
          { icon: Trophy, v: `${avg}%`, l: t("avg_progress") },
          { icon: Calendar, v: liveClasses.length, l: t("upcoming_short") },
        ].map(({ icon: I, v, l }) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <I className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold text-foreground">{v}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      {cont && (
        <section className="mt-8 flex flex-col gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-navy to-royal p-6 text-navy-foreground sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-sm opacity-80">{t("continue_learning")}</p>
            <h2 className="font-display text-2xl font-bold">{cont.course.title[lang]}</h2>
            <p className="mt-1 text-sm opacity-80">{t("lesson")} {Math.min(cont.last_lesson + 1, cont.course.lessons)} / {cont.course.lessons}</p>
            <div className="mt-3 h-2 w-full max-w-sm rounded-full bg-navy-foreground/20"><div className="h-2 rounded-full bg-success" style={{ width: `${cont.progress}%` }} /></div>
          </div>
          <MiniChart />
        </section>
      )}

      <StudentCharts userId={user.id} progress={[...mine.map((m) => ({ name: m.course.title[lang].slice(0, 22), progress: m.progress })), ...(enrolls.data ?? []).flatMap((e) => { const c = cloudCourses.data?.find((x) => x.id === e.course_id); return c ? [{ name: c.title.slice(0, 22), progress: e.progress }] : []; })]} />

      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold text-foreground">{t("my_courses")}</h2>
        {(enrolls.data??[]).filter(e=>cloudCourses.data?.some(c=>c.id===e.course_id)).map(e=><article key={e.course_id} className="mt-4 border-b border-border py-4"><h3 className="font-semibold">{cloudCourses.data?.find(c=>c.id===e.course_id)?.title}</h3><Button asChild className="mt-3"><Link to="/courses/$courseId" params={{courseId:e.course_id}}>{t('open_lesson')}</Link></Button></article>)}
        {enrolls.isLoading ? (
          <p className="mt-4 text-muted-foreground">…</p>
        ) : mine.length === 0 ? (
          <p className="mt-4 text-muted-foreground">{t("no_enrollments")}</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {mine.map((m) => (
              <article key={m.course_id} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-card sm:flex-row">
                <div className="flex h-20 w-24 shrink-0 items-end justify-center rounded-xl bg-gradient-to-br from-navy to-royal p-2"><MiniChart /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{m.course.title[lang]}</h3>
                  <p className="text-xs text-muted-foreground">{m.last_lesson} / {m.course.lessons} {t("lessons")} · {m.progress}%</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-success" style={{ width: `${m.progress}%` }} /></div>
                  <button
                    disabled={m.progress >= 100 || advance.isPending}
                    onClick={() => advance.mutate({ ...m, total: m.course.lessons })}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <PlayCircle className="h-4 w-4" /> {m.progress >= 100 ? t("completed") : t("mark_next_done")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-foreground">{t("upcoming")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {liveClasses.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              {c.live && <span className="rounded bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">● LIVE</span>}
              <h3 className="mt-2 font-semibold">{c.title[lang]}</h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                <span>{t(c.day)}, {c.time}</span><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.joining}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("explore_more")}</h2>
          <Link to="/courses" className="text-sm font-semibold text-primary">{t("see_all")} →</Link>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.filter((c) => !enrolledIds.has(c.id)).slice(0, 4).map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>
    </div>
  );
}
