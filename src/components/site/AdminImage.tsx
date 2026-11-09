import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Draft artwork needs a signed preview; keep its durable file reference unchanged. */
export function AdminImage({ src, ...props }: { src: string; alt: string; className?: string }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    let active = true;
    if (!src.startsWith('/api/public/site-file/')) return;
    const path = src.replace('/api/public/site-file/', '');
    void supabase.storage.from('site-images').createSignedUrl(path, 3600).then(result => {
      if (active) setPreview(result.data?.signedUrl ?? '');
    });
    return () => { active = false; };
  }, [src]);
  const resolved = src.startsWith('/api/public/site-file/') ? preview : src;
  return resolved ? <img src={resolved} {...props} /> : null;
}