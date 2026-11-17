import { shareImageMeta } from "./share-image";

export function pageMeta(title: string, description: string, image = "") {
  return { meta: [
    { title: `${title} — Chartसीखो` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Chartसीखो` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex, nofollow" },
    ...shareImageMeta(image),
  ] };
}