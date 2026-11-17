import { createFileRoute } from "@tanstack/react-router";
import { siteImage } from '@/lib/site-image';
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { EbookPurchase } from "@/components/site/EbookPurchase";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { MobilePageBar } from "@/components/site/MobilePageBar";
import { productQuery } from "@/lib/product-query";
import { shareDescription, shareImageMeta, shareImageUrl } from "@/lib/share-image";

const EBOOKS_TITLE = "eBook Marketplace — Chartसीखो";
const EBOOKS_DESC = "Stock-market eBooks from Chartसीखो in Hindi and English.";

export const Route = createFileRoute("/ebooks")({
  // ?item=<id> is the shared link for one eBook, so link previews show that eBook's cover.
  validateSearch: (search: Record<string, unknown>): { item?: string } =>
    typeof search['item'] === "string" && /^[0-9a-f-]{36}$/i.test(search['item']) ? { item: search['item'] } : {},
  loaderDeps: ({ search }) => ({ item: search.item }),
  loader: async ({ context, deps }) => {
    if (!deps.item) return { book: null };
    const data = await context.queryClient.ensureQueryData(productQuery()).catch(() => null);
    const book = data?.ebooks.find((e) => e.id === deps.item);
    return { book: book ? { title: book.title, description: book.description, cover_url: book.cover_url } : null };
  },
  head: ({ loaderData }) => {
    const book = loaderData?.book;
    const title = book ? `${book.title} — Chartसीखो` : EBOOKS_TITLE;
    const description = book ? shareDescription(book.description, EBOOKS_DESC) : EBOOKS_DESC;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: book ? "product" : "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...shareImageMeta(shareImageUrl(book?.cover_url)),
      ],
    };
  },
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
    <div className="ebook-screen w-full px-4 pt-8">
      <MobilePageBar title={t("nav_ebooks")} subtitle={t("ebooks_s")} />
      <h1 className="hidden font-display text-3xl font-bold text-foreground lg:block">{t("ebooks_t")}</h1>
      <p className="mt-1 hidden text-muted-foreground lg:block">{t("ebooks_s")}</p>
      {q.isLoading ? <p className="mt-8 text-muted-foreground">…</p> : !q.data?.length ? <p className="mt-8 text-muted-foreground">{t("ebooks_empty")}</p> : (
        <div className="ebook-grid mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {q.data.map((b) => (
            <article key={b.id} id={`ebook-${b.id}`} className="ebook-card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="ebook-cover aspect-[3/4] w-full bg-muted">
                {b.cover_url ? <img src={b.cover_url} alt={b.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><BookOpen className="h-10 w-10 text-muted-foreground" /></div>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h2 className="line-clamp-2 font-semibold text-foreground">{b.title}</h2>
                {b.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.description.replace(/^#+\s*/gm, '').replace(/\*\*|__|`/g, '')}</p>}
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
