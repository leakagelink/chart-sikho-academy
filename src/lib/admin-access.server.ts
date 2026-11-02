import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { canAccess, resourceSections, type PanelAccess, type PermissionAction, type PanelPermission } from './admin-permissions';

export async function resolvePanelAccess(s: SupabaseClient<Database>, userId: string): Promise<PanelAccess> {
  const [role, permissions, profile] = await Promise.all([
    s.rpc('has_role', { _user_id:userId, _role:'admin' }),
    s.from('user_panel_permissions').select('section,action').eq('user_id',userId),
    s.from('profiles').select('account_status').eq('id',userId).single(),
  ]);
  if (role.error || permissions.error || profile.error || profile.data.account_status !== 'active') throw new Error('Forbidden');
  return { isAdmin:role.data === true, permissions:(permissions.data ?? []) as PanelPermission[] };
}
export async function assertPanelAction(s: SupabaseClient<Database>, userId: string, resource: string, action: PermissionAction) {
  const access = await resolvePanelAccess(s,userId);
  if (!resourceSections(resource).some(section => canAccess(access,section,action))) throw new Error('Forbidden');
  return access;
}