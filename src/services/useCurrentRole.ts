import { useEffect, useState } from 'react';
import { hasSupabaseConfig } from '@/services/supabase';
import { getSession, onAuthStateChange } from '@/services/auth';
import { fetchUserProfile } from '@/services/profiles';
import type { AppRole } from '@/services/roles';

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
    if (!hasSupabaseConfig) {
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
      try {
        const profile = await fetchUserProfile(userId);
        if (!active) return;
        if (!profile.role) {
          setState({ role: null, loading: false, error: 'El teu perfil no té un rol vàlid.' });
          return;
        }
        setState({ role: profile.role, loading: false, error: null });
      } catch (error) {
        console.error('Could not load the signed-in user role.', error);
        if (active) {
          setState({ role: null, loading: false, error: 'No s’ha pogut comprovar el teu rol.' });
        }
      }
    };

    const loadSession = async () => {
      try {
        const session = await getSession();
        if (!active) return;
        await loadRole(session?.user.id ?? null);
      } catch (error) {
        console.error('Could not load the current authentication session.', error);
        if (active) {
          setState({ role: null, loading: false, error: 'No s’ha pogut carregar la sessió.' });
        }
      }
    };

    void loadSession();
    const unsubscribe = onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void loadRole(session?.user.id ?? null);
      }, 0);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}
