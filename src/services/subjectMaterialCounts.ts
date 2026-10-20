import { supabase } from "@/services/supabase";

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

/** Latest published material date per subject, combining new and legacy material. */
export async function fetchLatestMaterialDates(): Promise<Record<string, string>> {
  if (!supabase) {
    throw new Error(
      "Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per llegir les dates dels materials.",
    );
  }

  const [contributionsResult, legacyResult] = await Promise.all([
    supabase
      .from('contributions')
      .select('subject_id,reviewed_at')
      .eq('status', 'approved')
      .not('reviewed_at', 'is', null),
    supabase
      .from('legacy_material_subjects')
      .select('subject_id,legacy_materials!inner(contributed_at)'),
  ]);

  if (contributionsResult.error) throw contributionsResult.error;
  if (legacyResult.error) throw legacyResult.error;

  const latestDates: Record<string, string> = {};
  const recordDate = (subjectId: string, date: string | null | undefined) => {
    if (date && (!latestDates[subjectId] || date > latestDates[subjectId])) {
      latestDates[subjectId] = date;
    }
  };
  for (const item of contributionsResult.data ?? []) {
    recordDate(item.subject_id, item.reviewed_at);
  }
  for (const item of legacyResult.data ?? []) {
    const material = item.legacy_materials;
    const contributedAt = Array.isArray(material)
      ? material[0]?.contributed_at
      : material?.contributed_at;
    recordDate(item.subject_id, contributedAt);
  }
  return latestDates;
}
