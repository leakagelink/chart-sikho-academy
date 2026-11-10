import { createFileRoute } from "@tanstack/react-router";
import { siteImage } from '@/lib/site-image';
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { EbookPurchase } from "@/components/site/EbookPurchase";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/ebooks")({
  head: () => ({
    meta: [
      { title: "eBook Marketplace — Chartसीखो" },
      { name: "description", content: "Stock-market eBooks from Chartसीखो in Hindi and English." },
      { property: "og:title", content: "eBook Marketplace — Chartसीखो" },
      { property: "og:description", content: "Stock-market eBooks from Chartसीखो in Hindi and English." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EbooksPage,
});

function EbooksPage() {
  const { t } = useLang();
  const q = useQuery({
    queryKey: ["public-ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("id,title,description,price,cover_url,has_file").eq("status", "published").order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(e => ({ ...e, cover_url: siteImage('ebook', e.id, e.cover_url) }));
    },
  });
  return (
    <div className="w-full px-4 pt-8">
      <h1 className="font-display text-3xl font-bold text-foreground">{t("ebooks_t")}</h1>
      <p className="mt-1 text-muted-foreground">{t("ebooks_s")}</p>
      {q.isLoading ? <p className="mt-8 text-muted-foreground">…</p> : !q.data?.length ? <p className="mt-8 text-muted-foreground">{t("ebooks_empty")}</p> : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {q.data.map((b) => (
            <article key={b.id} id={`ebook-${b.id}`} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="aspect-[3/4] w-full bg-muted">
                {b.cover_url ? <img src={b.cover_url} alt={b.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><BookOpen className="h-10 w-10 text-muted-foreground" /></div>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h2 className="line-clamp-2 font-semibold text-foreground">{b.title}</h2>
                {b.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.description}</p>}
                <EbookPurchase book={b} />
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
