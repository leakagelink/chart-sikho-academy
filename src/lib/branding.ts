import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Custom app logo set from the admin panel; empty string means use the bundled logo. */
export function useBranding() {
  const q = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('app_branding');
      if (error || !data) return '';
      return String(data);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return q.data ?? '';
}
