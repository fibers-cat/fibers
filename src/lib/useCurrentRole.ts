import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isAppRole, type AppRole } from '@/lib/roles';

type RoleState = {
  role: AppRole | null;
  loading: boolean;
  error: string | null;
};

export function useCurrentRole(): RoleState {
  const [state, setState] = useState<RoleState>({
    role: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!supabase) {
      setState({ role: null, loading: false, error: 'Falta configurar Supabase.' });
      return;
    }

    let active = true;
    const loadRole = async (userId: string | null) => {
      if (!userId) {
        if (active) setState({ role: null, loading: false, error: null });
        return;
      }

      if (active) setState({ role: null, loading: true, error: null });
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!active) return;
      if (error) {
        console.error('Could not load the signed-in user role.', error);
        setState({ role: null, loading: false, error: 'No s’ha pogut comprovar el teu rol.' });
        return;
      }
      if (!data || !isAppRole(data.role)) {
        setState({ role: null, loading: false, error: 'El teu perfil no té un rol vàlid.' });
        return;
      }
      setState({ role: data.role, loading: false, error: null });
    };

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        console.error('Could not load the current authentication session.', error);
        setState({ role: null, loading: false, error: 'No s’ha pogut carregar la sessió.' });
        return;
      }
      await loadRole(data.session?.user.id ?? null);
    };

    void loadSession();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void loadRole(session?.user.id ?? null);
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
