import { supabase, type Subject } from '@/lib/supabase';

export async function fetchSubjects(): Promise<Subject[]> {
  if (!supabase) throw new Error('Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per llegir les assignatures.');
  const { data, error } = await supabase.from('subjects').select('id,slug,code,name,category,description').order('code');
  if (error) throw new Error(`No s’han pogut carregar les assignatures: ${error.message}`);
  return (data ?? []) as Subject[];
}
