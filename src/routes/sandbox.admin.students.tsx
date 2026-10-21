import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useMock } from "@/lib/mock-store";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/admin/students")({ head: () => pageMeta("Mock Student Management", "Preview a fictional student and a local-only status change."), component: Screen });
function Screen() { const { t } = useLang(); const { state, update } = useMock(); return <><h1 className="font-display text-3xl font-bold">{t("admin_students")}</h1><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-border py-5"><div><p className="font-semibold">{t("test_profile")}</p><p className="text-sm text-muted-foreground">SAMPLE-001 · {t(state.studentActive ? "active" : "paused")}</p><p className="mt-2 text-sm">{state.completed.length}/3 {t("completed")}</p></div><Button variant="outline" onClick={() => update((s) => ({ ...s, studentActive: !s.studentActive }))}>{t(state.studentActive ? "pause" : "activate")}</Button></div></>; }