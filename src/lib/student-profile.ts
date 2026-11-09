import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const profilePhotoAllowed = (file: Pick<File, 'size' | 'type'>) =>
  ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size > 0 && file.size <= 5 * 1024 * 1024;

export const profileValues = (f: { full_name: string; phone: string; state: string; city: string; preferred_language: string; address: string; bio: string; date_of_birth: string }, avatarPath: string) => ({
  _full_name: f.full_name.trim(), _phone: f.phone.trim(), _state: f.state.trim(), _city: f.city.trim(),
  _preferred_language: f.preferred_language, _address: f.address.trim(), _bio: f.bio.trim(),
  _date_of_birth: f.date_of_birth, _avatar_path: avatarPath,
});

export const studentProfileOptions = (userId: string) => queryOptions({
  queryKey: ['profile-full', userId],
  queryFn: async () => {
    const { data, error } = await supabase.from('profiles').select('full_name,phone,state,city,preferred_language,address,bio,date_of_birth,avatar_path,referral_code,short_referral_code,account_status,verification_status,created_at').eq('id', userId).maybeSingle();
    if (error) throw error;
    let photoUrl = '';
    if (data?.avatar_path) {
      const photo = await supabase.storage.from('profile-photos').createSignedUrl(data.avatar_path, 3600);
      if (photo.error) throw photo.error;
      photoUrl = photo.data.signedUrl;
    }
    return { ...data, referral_code: data?.short_referral_code || data?.referral_code, photoUrl };
  },
  staleTime: 60_000,
});