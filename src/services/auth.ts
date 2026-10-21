import type { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

/**
 * Authentication helpers.
 *
 * Thin, framework-agnostic wrappers around Supabase auth so components do not
 * talk to the client directly. All functions throw when Supabase is not
 * configured, mirroring the `fetch*` helpers in this folder.
 */

export type AuthUser = User;

function client() {
  if (!supabase) {
    throw new Error(
      'Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per fer servir l’autenticació.',
    );
  }
  return supabase;
}

/** Returns the current session, or `null` when the visitor is signed out. */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await client().auth.getSession();
  if (error) throw error;
  return data.session;
}

/** Returns the signed-in user from the server, or `null`. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await client().auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

/** Sends a magic sign-in link to the given email address. */
export async function signInWithEmailLink(email: string, redirectTo: string): Promise<void> {
  const { error } = await client().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

/** Starts an OAuth sign-in flow for the given provider. */
export async function signInWithOAuth(provider: 'google' | 'github', redirectTo: string): Promise<void> {
  const { error } = await client().auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) throw error;
}

/** Signs the current user out. */
export async function signOut(): Promise<void> {
  const { error } = await client().auth.signOut();
  if (error) throw error;
}

/**
 * Subscribes to auth state changes. Returns an unsubscribe function so callers
 * can clean up inside a React effect.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  }) as { data: { subscription: Subscription } };
  return () => data.subscription.unsubscribe();
}
