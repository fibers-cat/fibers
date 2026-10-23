import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/services/database.types';

export type { Subject } from '@/data/subjects';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(url && key);
export const supabase = url && key
  ? createClient<Database>(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
