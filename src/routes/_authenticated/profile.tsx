import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Award, Bell, ChevronRight, ClipboardList, IndianRupee, LifeBuoy, LogOut, Settings, Users, Wallet, Camera, Pencil, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { studentProfileOptions, profilePhotoAllowed, profileValues } from '@/lib/student-profile';
import { usePanelAccess } from '@/hooks/use-panel-access';

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Profile — Chartसीखो" },
      { name: "description", content: "Manage your Chartसीखो student profile." },
      { property: "og:title", content: "My Profile — Chartसीखो" },
      { property: "og:description", content: "Manage your Chartसीखो student profile." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(studentProfileOptions(context.user.id)),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, setLang, lang } = useLang();
  const panelAccess = usePanelAccess();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useSuspenseQuery(studentProfileOptions(user.id));
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(() => formFromProfile(q.data));
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function edit() {
    setF(formFromProfile(q.data)); setPhoto(null); setRemovePhoto(false); setMessage(''); setEditing(true);
  }
  async function save(e: FormEvent) {
    e.preventDefault(); if (saving) return;
    setSaving(true); setMessage(''); setFailed(false);
    let newPath = '';
    try {
      let avatarPath = removePhoto ? '' : q.data.avatar_path || '';
      if (photo) {
        const ext = photo.type === 'image/jpeg' ? 'jpg' : photo.type === 'image/png' ? 'png' : 'webp';
        newPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const upload = await supabase.storage.from('profile-photos').upload(newPath, photo, { contentType: photo.type });
        if (upload.error) throw upload.error;
        avatarPath = newPath;
      }
      const result = await supabase.rpc('save_my_profile', profileValues(f, avatarPath));
      if (result.error) throw result.error;
      if (q.data.avatar_path && q.data.avatar_path !== avatarPath) {
        await supabase.storage.from('profile-photos').remove([q.data.avatar_path]);
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['profile-full', user.id] }),
        qc.invalidateQueries({ queryKey: ['profile', user.id] }),
        qc.invalidateQueries({ queryKey: ['student-referrals', user.id] }),
      ]);
      setLang(f.preferred_language === 'hi' ? 'hi' : 'en');
      setEditing(false); setPhoto(null); setRemovePhoto(false); setMessage(t('saved'));
    } catch {
      if (newPath) await supabase.storage.from('profile-photos').remove([newPath]);
      setFailed(true); setMessage(t('profile_save_error'));
    } finally { setSaving(false); }
  }
  async function signOut() {
    await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut();
    navigate({ to: '/auth', search: { redirect: undefined }, replace: true });
  }
  const name = q.data.full_name || user.email?.split('@')[0] || t('student_fallback');
  const photoUrl = editing ? preview || (removePhoto ? '' : q.data.photoUrl) : q.data.photoUrl;
  const input = 'mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground';
  const field = (k: 'full_name' | 'phone' | 'state' | 'city' | 'address' | 'bio' | 'date_of_birth', label: string) => (
    <label className="block text-sm font-medium">{label}
      {k === 'bio' || k === 'address' ? <textarea className={input} rows={3} maxLength={500} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /> :
      <input className={input} type={k === 'date_of_birth' ? 'date' : k === 'phone' ? 'tel' : 'text'} maxLength={k === 'full_name' ? 120 : k === 'phone' ? 25 : 100} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />}
    </label>
  );
  const detail = (label: string, value?: string | null) => <div className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 break-words whitespace-pre-wrap text-sm font-medium">{value || t('profile_empty')}</dd></div>;
  const status = (value?: string | null) => {
    if (value === 'active') return t('profile_active');
    if (value === 'suspended') return t('profile_suspended');
    if (value === 'blocked') return t('profile_blocked');
    if (value === 'verified') return t('profile_verified');
    if (value === 'pending') return t('profile_pending');
    if (value === 'unverified') return t('profile_unverified');
    return value || t('profile_empty');
  };
  const menu = [
    { icon: Settings, label: t('admin_go'), to: '/admin' },
    { icon: ClipboardList, label: t('my_courses'), to: '/dashboard' },
    { icon: Award, label: t('my_certificates'), to: '/sandbox/certificates' },
    { icon: Users, label: t('referral_dashboard'), to: '/referrals' },
    { icon: IndianRupee, label: t('my_earnings'), to: '/earnings' },
    { icon: Wallet, label: t('payout_requests'), to: '/earnings' },
    { icon: Bell, label: t('notifications'), to: '/notifications' },
    { icon: LifeBuoy, label: t('support'), to: '/sandbox/support' },
  ] as const;
  return (
    <div className="profile-screen w-full px-4 pb-8 pt-0">
      <div className="profile-banner flex flex-wrap items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gold font-display text-2xl font-bold text-navy">
          {photoUrl ? <img src={photoUrl} alt={t('profile_photo')} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1"><h1 className="break-words font-display text-2xl font-bold text-foreground">{name}</h1><p className="break-all text-sm text-muted-foreground">{user.email}</p></div>
        {!editing && <Button onClick={edit}><Pencil className="h-4 w-4" />{t('edit_profile')}</Button>}
      </div>
      {message && <p role={failed ? 'alert' : 'status'} className={`mt-4 text-sm ${failed ? 'text-destructive' : 'text-success'}`}>{message}</p>}
      <div className="mt-6 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <section className="min-w-0">
          <h2 className="mb-5 font-display text-xl font-semibold">{t('profile_personal')}</h2>
          {editing ? <form onSubmit={save} className="space-y-5">
            <fieldset disabled={saving} className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} aria-label={t('profile_photo')} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
                  if (!profilePhotoAllowed(file)) { setFailed(true); setMessage(t('profile_photo_error')); return; }
                  setPhoto(file); setRemovePhoto(false); setMessage('');
                }} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Camera className="h-4 w-4" />{t('profile_photo_change')}</Button>
                {(photoUrl || photo) && <Button type="button" variant="ghost" onClick={() => { setPhoto(null); setRemovePhoto(true); }}><Trash2 className="h-4 w-4" />{t('profile_photo_remove')}</Button>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">{field('full_name', t('full_name'))}{field('phone', t('phone'))}{field('date_of_birth', t('profile_dob'))}
                <label className="block text-sm font-medium">{t('pref_lang')}<select className={input} value={f.preferred_language} onChange={e => setF({ ...f, preferred_language: e.target.value })}><option value="en">English</option><option value="hi">हिंदी</option></select></label>
                {field('state', t('state'))}{field('city', t('city'))}
              </div>
              {field('address', t('profile_address'))}{field('bio', t('profile_bio'))}
              <div className="flex gap-3"><Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? t('profile_saving') : t('save')}</Button><Button type="button" variant="outline" onClick={() => { setEditing(false); setPhoto(null); setRemovePhoto(false); setMessage(''); }}>{t('pay_cancel')}</Button></div>
            </fieldset>
          </form> : <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {detail(t('full_name'), q.data.full_name)}{detail(t('phone'), q.data.phone)}{detail(t('profile_dob'), q.data.date_of_birth)}{detail(t('pref_lang'), q.data.preferred_language === 'hi' ? 'हिंदी' : 'English')}{detail(t('state'), q.data.state)}{detail(t('city'), q.data.city)}{detail(t('profile_address'), q.data.address)}{detail(t('profile_bio'), q.data.bio)}
          </dl>}
          <h2 className="mb-5 mt-8 border-t border-border pt-6 font-display text-xl font-semibold">{t('profile_account')}</h2>
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{detail(t('email'), user.email)}{detail(t('student_member_id'), user.id)}{detail(t('profile_status'), status(q.data.account_status))}{detail(t('profile_verification'), status(q.data.verification_status))}{detail(t('referral_code'), q.data.referral_code)}{detail(t('profile_joined'), q.data.created_at ? new Date(q.data.created_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN') : '')}</dl>
        </section>
        <nav className="profile-menu min-w-0" aria-label={t('my_profile')}>
          {menu.filter(item => item.to !== '/admin' || panelAccess).map(({ icon: Icon, label, to }) => <Link key={label} to={to} className="flex items-center gap-3 border-b border-border p-4 text-sm hover:bg-muted/50"><Icon className="h-5 w-5 shrink-0" /><span className="flex-1">{label}</span><ChevronRight className="h-4 w-4" /></Link>)}
          <Button onClick={signOut} variant="ghost" className="mt-3 w-full justify-start text-destructive"><LogOut className="h-4 w-4" />{t('logout')}</Button>
        </nav>
      </div>
    </div>
  );
}

function formFromProfile(p: { full_name?: string | null; phone?: string | null; state?: string | null; city?: string | null; preferred_language?: string; address?: string; bio?: string; date_of_birth?: string | null }) {
  return { full_name: p.full_name || '', phone: p.phone || '', state: p.state || '', city: p.city || '', preferred_language: p.preferred_language || 'en', address: p.address || '', bio: p.bio || '', date_of_birth: p.date_of_birth || '' };
}
