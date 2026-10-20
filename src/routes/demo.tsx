import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Free Demo Class — Chartसीखो" },
      { name: "description", content: "Book a free stock-market demo class with Chartसीखो." },
      { property: "og:title", content: "Free Demo Class — Chartसीखो" },
      { property: "og:description", content: "Book a free stock-market demo class with Chartसीखो." },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  const { t } = useLang();
  const [f, setF] = useState({ full_name: "", phone: "", email: "", preferred_slot: "evening" });
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("saving");
    setErr("");
    const { error } = await supabase.from("demo_bookings").insert({
      full_name: f.full_name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      preferred_slot: f.preferred_slot,
    });
    if (error) {
      setState("error");
      setErr(error.message);
    } else {
      setState("done");
    }
  }

  const input = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm";

  if (state === "done") {
    return (
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">{t("demo_success_t")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("demo_success_s")}</p>
        <Link to="/courses" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {t("explore")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
          <PlayCircle className="h-4 w-4" /> {t("demo_free")}
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy">{t("demo_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("demo_sub")}</p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium">{t("full_name")}
            <input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className={`${input} mt-1`} />
          </label>
          <label className="block text-sm font-medium">{t("phone_req")}
            <input required type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={`${input} mt-1`} />
          </label>
          <label className="block text-sm font-medium">{t("email")}
            <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={`${input} mt-1`} />
          </label>
          <label className="block text-sm font-medium">{t("demo_slot")}
            <select value={f.preferred_slot} onChange={(e) => setF({ ...f, preferred_slot: e.target.value })} className={`${input} mt-1`}>
              <option value="morning">{t("slot_morning")}</option>
              <option value="evening">{t("slot_evening")}</option>
            </select>
          </label>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button disabled={state === "saving"} className="w-full rounded-lg bg-success py-2.5 font-semibold text-success-foreground hover:bg-success/90 disabled:opacity-60">
            {t("book_demo")}
          </button>
        </form>
      </div>
    </div>
  );
}
