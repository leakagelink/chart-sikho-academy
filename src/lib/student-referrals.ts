import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const studentReferralsOptions = (userId: string) => queryOptions({
  queryKey: ['student-referrals', userId],
  queryFn: async () => {
    const [profile, team] = await Promise.all([
      supabase.from('profiles').select('full_name,referral_code').eq('id', userId).maybeSingle(),
      supabase.from('referral_relationships').select('id,referred_id,created_at').eq('referrer_id', userId).order('created_at', { ascending: false }),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    if (team.error) throw new Error(team.error.message);
    return { profile: profile.data, members: team.data };
  },
});