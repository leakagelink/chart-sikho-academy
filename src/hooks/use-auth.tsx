import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isRecoveryHash } from '@/lib/password-recovery';

const Ctx = createContext<{ session: Session | null; ready: boolean; recovery: boolean }>({ session: null, ready: false, recovery: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (isRecoveryHash(window.location.hash)) setRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') setRecovery(false);
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") qc.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [router, qc]);

  return <Ctx.Provider value={{ session, ready, recovery }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
