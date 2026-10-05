import { supabase } from "@/lib/supabase";

export async function fetchSubjectMaterialCounts(): Promise<
  Record<string, number>
> {
  if (!supabase) {
    throw new Error(
      "Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per llegir els comptadors de fitxers.",
    );
  }

  const { data, error } = await supabase
    .from("approved_material_counts")
    .select("subject_id,file_count");

  if (error) {
    throw new Error(`No s’han pogut carregar els comptadors: ${error.message}`);
  }

  const counts: Record<string, number> = {};
  for (const item of data ?? []) {
    counts[item.subject_id] = Number(item.file_count);
  }
  return counts;
}
