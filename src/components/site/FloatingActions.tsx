import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, MessageCircle, Users, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLang } from "@/lib/i18n";

export function FloatingActions() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return <>
    <div className="wallet-float fixed left-0 top-1/2 z-40 -translate-y-1/2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button aria-label={t(open ? "hide_wallet" : "show_wallet")} title={t(open ? "hide_wallet" : "show_wallet")} className="h-14 gap-1 rounded-l-none rounded-r-lg px-2 shadow-card">
            <Wallet className="size-5" />
            {open ? <X className="size-3" /> : <ChevronRight className="size-3" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="center" sideOffset={8} className="w-56 max-w-[calc(100vw-4.5rem)] p-3 shadow-card motion-reduce:animate-none" aria-label={t("wallet")}>
          <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
            <p className="font-display text-lg font-bold">{t("wallet")}</p>
            <Button variant="ghost" size="icon" className="size-8" aria-label={t("hide_wallet")} onClick={() => setOpen(false)}><X /></Button>
          </div>
          <div className="grid gap-1">
            <Button asChild variant="ghost" className="justify-start"><Link to="/sandbox/wallet" onClick={() => setOpen(false)}><Wallet />{t("wallet")}<ArrowRight className="ml-auto" /></Link></Button>
            <Button asChild variant="ghost" className="justify-start"><Link to="/sandbox/referrals" onClick={() => setOpen(false)}><Users />{t("referrals")}<ArrowRight className="ml-auto" /></Link></Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
    <Button asChild className="support-float fixed right-4 z-40 h-11 rounded-full px-4 shadow-card"><Link to="/sandbox/support" aria-label={t("support")} title={t("support")}><MessageCircle className="size-5" />{t("support")}</Link></Button>
  </>;
}