import { supabase } from '@/services/supabase';
import { isAppRole, type AppRole } from '@/services/roles';

export type UserProfile = {
  alias: string | null;
  avatarUrl: string | null;
  role: AppRole | null;
};

function client() {
  if (!supabase) {
    throw new Error(
      'Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per llegir els perfils.',
    );
  }
  return supabase;
}

/** Loads the alias, avatar and role for a signed-in user. */
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await client()
    .from('profiles')
    .select('alias,avatar_url,role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return {
    alias: data?.alias ?? null,
    avatarUrl: data?.avatar_url ?? null,
    role: isAppRole(data?.role) ? data.role : null,
  };
}

/** Saves the alias of a signed-in user. */
export async function updateAlias(userId: string, alias: string): Promise<void> {
  const { error } = await client()
    .from('profiles')
    .update({ alias: alias.trim(), updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

/** Stores the avatar URL resolved from the user's social account. */
export async function saveSocialAvatar(userId: string, avatarUrl: string): Promise<void> {
  const { error } = await client()
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  if (error) throw error;
}
