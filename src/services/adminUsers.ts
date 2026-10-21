import { supabase } from '@/services/supabase';

export type ManagedRole = 'user' | 'admin';

export type ManagedUser = {
  user_id: string;
  email: string | null;
  alias: string;
  role: 'user' | 'admin' | 'superadmin';
};

function client() {
  if (!supabase) {
    throw new Error(
      'Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per gestionar els usuaris.',
    );
  }
  return supabase;
}

/** Loads the user directory for superadmins (RPC `admin_list_users`). */
export async function fetchManagedUsers(): Promise<ManagedUser[]> {
  const { data, error } = await client().rpc('admin_list_users');
  if (error) throw error;
  return (data ?? []) as ManagedUser[];
}

/**
 * Updates a managed user's alias and role. Returns `false` when the row was not
 * found, `true` when it was updated.
 */
export async function updateManagedUser(
  userId: string,
  alias: string,
  role: ManagedRole,
): Promise<boolean> {
  const { data, error } = await client()
    .from('profiles')
    .update({ alias: alias.trim(), role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
