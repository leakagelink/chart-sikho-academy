import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { permissionSchema } from './admin-permissions';
import { resolvePanelAccess } from './admin-access.server';

export const getPanelAccess = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => resolvePanelAccess(context.supabase,context.userId));
export const savePanelPermissions = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>permissionSchema.parse(input)).handler(async ({context,data})=>{
  const access = await resolvePanelAccess(context.supabase,context.userId);
  if (!access.isAdmin || data.userId === context.userId) throw new Error('Forbidden');
  const result = await context.supabase.rpc('set_panel_permissions',{_user_id:data.userId,_permissions:data.permissions});
  if(result.error) throw new Error('Unable to save permissions');
  return {ok:true};
});