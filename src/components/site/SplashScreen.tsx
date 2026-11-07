import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useBranding } from "@/lib/branding";

export function SplashScreen({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const brandLogo = useBranding();
  const [phase, setPhase] = useState<"visible" | "exiting" | "hidden">("visible");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPhase("exiting"), reducedMotion ? 350 : 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "exiting") return;
    const timer = window.setTimeout(() => setPhase("hidden"), 400);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "hidden") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [phase]);

  return <>
    <div inert={phase !== "hidden"} aria-hidden={phase !== "hidden" ? true : undefined} className={phase === "hidden" ? "app-reveal" : "app-hidden"}>
      {children}
    </div>
    {phase !== "hidden" && <div className={`brand-splash ${phase === "exiting" ? "brand-splash-exit" : ""}`} data-testid="brand-splash">
      <div className="splash-topline" aria-hidden="true" />
      <Button variant="ghost" size="icon" className="absolute right-5 top-5 text-muted-foreground" onClick={() => setPhase("exiting")} aria-label={t("splash_skip")} title={t("splash_skip")}><ArrowRight /></Button>
      <div className="splash-center" role="status" aria-label={t("splash_loading")}>
        <div className="splash-candles" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className={`splash-candle splash-candle-${i}`} />)}
        </div>
        {brandLogo ? <img src={brandLogo} alt="" width={112} height={112} className="splash-logo" /> : <span className="splash-logo h-28 w-28" aria-hidden="true" />}
        <h1 className="splash-name font-display font-bold text-foreground">Chart<span className="text-primary">सीखो</span></h1>
        <p className="splash-tagline text-base text-muted-foreground">{t("splash_tagline")}</p>
        <div className="splash-loader" aria-hidden="true"><span /></div>
      </div>
      <p className="splash-disclaimer text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>}
  </>;
}