import { supabase } from "@/services/supabase";

export type Contributor = { alias: string; count: number };

export type ContributorStanding = {
  /** Approved materials credited to the contributor. */
  materialCount: number;
  /** 1-based position, or `null` when the contributor has no approved material yet. */
  position: number | null;
  /** Number of contributors listed in the ranking. */
  total: number;
};

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

/**
 * Resolves the ranking position of a contributor from the public
 * `contributor_ranking` view. Positions are 1-based and shared by ties.
 */
export async function fetchContributorStanding(alias: string): Promise<ContributorStanding> {
  if (!supabase) {
    throw new Error(
      "Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per llegir el rànquing.",
    );
  }

  const [mine, total] = await Promise.all([
    supabase.from("contributor_ranking").select("material_count").eq("alias", alias).limit(1).maybeSingle(),
    supabase.from("contributor_ranking").select("*", { count: "exact", head: true }),
  ]);

  if (mine.error) throw new Error(`No s’ha pogut carregar el rànquing: ${mine.error.message}`);
  if (total.error) throw new Error(`No s’ha pogut carregar el rànquing: ${total.error.message}`);

  const materialCount = Number(mine.data?.material_count ?? 0);
  const contributorCount = total.count ?? 0;

  if (!mine.data || materialCount === 0) {
    return { materialCount, position: null, total: contributorCount };
  }

  const { count, error } = await supabase
    .from("contributor_ranking")
    .select("*", { count: "exact", head: true })
    .gt("material_count", materialCount);

  if (error) throw new Error(`No s’ha pogut carregar el rànquing: ${error.message}`);

  return {
    materialCount,
    position: (count ?? 0) + 1,
    total: contributorCount,
  };
}
