import { Video } from 'lucide-react';
export function LiveClassThumbnail({ title, thumbnailUrl }: { title: string; thumbnailUrl?: string }) {
  return <div className="live-class-cover relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
    {thumbnailUrl?<img src={thumbnailUrl} alt={title} loading="lazy" decoding="async" className="block h-full w-full object-contain" />:<div className="grid h-full place-items-center"><Video className="h-10 w-10 text-muted-foreground" /></div>}
  </div>;
}
