import { supabase } from "@/lib/supabase";

export type Contributor = { alias: string; count: number };

export async function fetchContributors(): Promise<Contributor[]> {
  if (!supabase) {
    throw new Error(
      "Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per llegir el rànquing.",
    );
  }

  const { data, error } = await supabase
    .from("contributor_ranking")
    .select("alias,material_count")
    .order("material_count", { ascending: false })
    .order("alias")
    .limit(50);

  if (error) {
    throw new Error(`No s’ha pogut carregar el rànquing: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    alias: item.alias,
    count: Number(item.material_count),
  }));
}
