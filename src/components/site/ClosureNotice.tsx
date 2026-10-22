import { BellRing } from "lucide-react";
import { translate } from "@/lib/i18n";

export function ClosureNotice() {
  return (
    <main className="grid min-h-dvh place-items-center border-t-4 border-destructive bg-background px-6 py-12">
      <section aria-labelledby="closure-heading" className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true">
          <BellRing className="h-8 w-8" />
        </div>
        <p lang="hi" className="font-display text-lg font-semibold text-destructive">{translate("closure_notice", "hi")}</p>
        <p lang="en" className="mt-1 text-xs font-semibold tracking-widest text-destructive">{translate("closure_notice", "en")}</p>
        <h1 id="closure-heading" lang="hi" className="mt-7 font-display text-3xl font-bold leading-snug text-foreground sm:text-4xl">{translate("closure_title", "hi")}</h1>
        <p lang="hi" className="mt-4 text-lg leading-relaxed text-muted-foreground">{translate("closure_message", "hi")}</p>
        <p lang="hi" className="mt-6 font-display text-xl font-semibold text-foreground">{translate("closure_thanks", "hi")}</p>
        <div lang="en" className="mt-8 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">{translate("closure_title", "en")}</p>
          <p className="mt-2">{translate("closure_message", "en")}</p>
          <p className="mt-2">{translate("closure_thanks", "en")}</p>
        </div>
      </section>
    </main>
  );
}