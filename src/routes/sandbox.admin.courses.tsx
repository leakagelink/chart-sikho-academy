import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { courses, inr } from "@/lib/courses";
import { useMock } from "@/lib/mock-store";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/admin/courses")({ head: () => pageMeta("Mock Course Management", "Add and hide local-only sample course entries."), component: Screen });
function Screen() {
  const { t, lang } = useLang(); const { state, update } = useMock(); const [title, setTitle] = useState(""); const [price, setPrice] = useState("0");
  return <><h1 className="font-display text-3xl font-bold">{t("admin_courses")}</h1>
    <form className="my-6 grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto]" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; update((s) => ({ ...s, catalog: [...s.catalog, { id: `sample-${Date.now()}`, title: title.trim(), price: Number(price), visible: false }] })); setTitle(""); }}>
      <label className="flex min-w-0 flex-col gap-1 text-sm">{t("course_title")}<input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3"/></label><label className="flex flex-col gap-1 text-sm">{t("sample_price")}<input type="number" min="0" max="100000" required value={price} onChange={(e) => setPrice(e.target.value)} className="h-10 w-32 rounded-md border border-input bg-background px-3"/></label><Button type="submit"><Plus/>{t("add_course")}</Button>
    </form>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="p-3">{t("course_title")}</th><th className="p-3">{t("sample_price")}</th><th className="p-3">{t("status")}</th><th/></tr></thead><tbody>{state.catalog.map((c) => <tr key={c.id} className="border-b border-border"><td className="max-w-72 break-words p-3">{courses.find((x) => x.id === c.id)?.title[lang] || c.title}</td><td className="p-3">{inr(c.price)}</td><td className="p-3">{t(c.visible ? "published" : "draft")}</td><td className="p-3"><Button variant="ghost" size="sm" onClick={() => update((s) => ({ ...s, catalog: s.catalog.map((v) => v.id === c.id ? { ...v, visible: !v.visible } : v) }))}>{c.visible ? <EyeOff/> : <Eye/>}{t(c.visible ? "hide_course" : "show_course")}</Button></td></tr>)}</tbody></table></div>
  </>;
}