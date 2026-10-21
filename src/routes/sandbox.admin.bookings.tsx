import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useMock } from "@/lib/mock-store";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/admin/bookings")({ head: () => pageMeta("Mock Demo Bookings", "Confirm a fictional demo booking in the isolated preview."), component: Screen });
function Screen() { const { t } = useLang(); const { state, update } = useMock(); return <><h1 className="font-display text-3xl font-bold">{t("admin_bookings")}</h1><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-border py-5"><div><p className="font-semibold">{t("test_profile")} · SAMPLE-BOOKING-001</p><p className="mt-1 text-sm text-muted-foreground">{t("slot_evening")}</p><p className="mt-2 text-sm text-success">{t(state.bookingConfirmed ? "confirmed" : "pending")}</p></div><Button disabled={state.bookingConfirmed} onClick={() => update((s) => ({ ...s, bookingConfirmed: true }))}>{t("confirm_booking")}</Button></div></>; }