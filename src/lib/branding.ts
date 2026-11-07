import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createContext, createElement, useContext, useEffect, type ReactNode } from 'react';
import defaultLogo from '@/assets/logo.png';

const InitialBranding = createContext<string | null>(null);

export function BrandingProvider({ initialLogo, children }: { initialLogo: string | null; children: ReactNode }) {
  return createElement(InitialBranding.Provider, { value: initialLogo }, createElement(BrandingIcon), children);
}

function BrandingIcon() {
  const logo = useBranding();
  useEffect(() => {
    if (!logo) return;
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.removeAttribute('type');
    icon.href = logo;
  }, [logo]);
  return null;
}

/** Undefined means not yet known: do not flash the old/default logo. */
export function useBranding() {
  const initialLogo = useContext(InitialBranding);
  const q = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('app_branding');
      if (error) throw error;
      return typeof data === 'string' ? data : '';
    },
    initialData: initialLogo === null ? undefined : initialLogo,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return q.data === undefined ? undefined : q.data || defaultLogo;
}
