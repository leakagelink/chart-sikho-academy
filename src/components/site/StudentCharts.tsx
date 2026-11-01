import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { dailyCounts } from "@/lib/admin-dashboard";
import { useLang } from "@/lib/i18n";

type Props = { userId: string; progress: { name: string; progress: number }[] };
const tip = { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" };

export function StudentCharts({ userId, progress }: Props) {
  const { t } = useLang();
  const orders = useQuery({
    queryKey: ["my-orders-chart", userId],
    queryFn: async () => (await supabase.from("orders").select("amount,status,created_at").eq("user_id", userId)).data ?? [],
  });
  const comms = useQuery({
    queryKey: ["my-comm-chart", userId],
    queryFn: async () => (await supabase.from("commission_entries").select("amount,created_at").eq("user_id", userId)).data ?? [],
  });
  const spend = dailyCounts((orders.data ?? []).filter((o) => o.status === "paid").map((o) => ({ at: o.created_at, v: Number(o.amount) })));
  const earn = dailyCounts((comms.data ?? []).map((c) => ({ at: c.created_at, v: Number(c.amount) })));
  const empty = <p className="grid h-full place-items-center text-sm text-muted-foreground">{t("chart_no_data")}</p>;
  const box = "rounded-2xl border border-border bg-card p-4 shadow-card";

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-bold text-foreground">{t("my_analytics")}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className={box}><h3 className="mb-2 font-semibold">{t("chart_my_progress")}</h3><div className="h-52">{progress.length ? (
          <ResponsiveContainer width="100%" height="100%"><BarChart data={progress}><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" /><YAxis domain={[0, 100]} stroke="var(--muted-foreground)" /><Tooltip contentStyle={tip} /><Bar dataKey="progress" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        ) : empty}</div></div>
        <div className={box}><h3 className="mb-2 font-semibold">{t("chart_my_spend")}</h3><div className="h-52">{spend.length ? (
          <ResponsiveContainer width="100%" height="100%"><LineChart data={spend}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" stroke="var(--muted-foreground)" /><YAxis stroke="var(--muted-foreground)" /><Tooltip contentStyle={tip} /><Line type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={2} /></LineChart></ResponsiveContainer>
        ) : empty}</div></div>
        <div className={box}><h3 className="mb-2 font-semibold">{t("chart_my_commission")}</h3><div className="h-52">{earn.length ? (
          <ResponsiveContainer width="100%" height="100%"><LineChart data={earn}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" stroke="var(--muted-foreground)" /><YAxis stroke="var(--muted-foreground)" /><Tooltip contentStyle={tip} /><Line type="monotone" dataKey="value" stroke="var(--chart-4)" strokeWidth={2} /></LineChart></ResponsiveContainer>
        ) : empty}</div></div>
      </div>
    </section>
  );
}
