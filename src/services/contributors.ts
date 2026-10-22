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

type ProfileAlias = { alias: string } | { alias: string }[] | null;

function profileAlias(profiles: ProfileAlias): string | null {
  return Array.isArray(profiles) ? profiles[0]?.alias ?? null : profiles?.alias ?? null;
}

/** Keeps the ranking usable while an older database view awaits its migration. */
async function fetchContributorsWithLegacyView(
  client: NonNullable<typeof supabase>,
): Promise<Contributor[]> {
  const [ranking, contributions, legacyMaterials] = await Promise.all([
    client
      .from("contributor_ranking")
      .select("alias,material_count")
      .order("material_count", { ascending: false })
      .order("alias")
      .limit(50),
    client
      .from("contributions")
      .select("reviewed_at,created_at,profiles(alias)")
      .eq("status", "approved"),
    client.from("legacy_materials").select("contributed_at,profiles(alias)"),
  ]);

  if (ranking.error) throw new Error(`No s’ha pogut carregar el rànquing: ${ranking.error.message}`);
  if (contributions.error) throw contributions.error;
  if (legacyMaterials.error) throw legacyMaterials.error;

  const latestByAlias = new Map<string, number>();
  const recordDate = (profiles: ProfileAlias, date: string | null) => {
    const alias = profileAlias(profiles);
    const timestamp = date ? Date.parse(date) : Number.NaN;
    if (!alias || Number.isNaN(timestamp)) return;
    latestByAlias.set(alias, Math.max(latestByAlias.get(alias) ?? Number.NEGATIVE_INFINITY, timestamp));
  };

  for (const row of (contributions.data ?? []) as unknown as {
    reviewed_at: string | null;
    created_at: string;
    profiles: ProfileAlias;
  }[]) {
    recordDate(row.profiles, row.reviewed_at ?? row.created_at);
  }
  for (const row of (legacyMaterials.data ?? []) as unknown as {
    contributed_at: string;
    profiles: ProfileAlias;
  }[]) {
    recordDate(row.profiles, row.contributed_at);
  }

  return (ranking.data ?? [])
    .map((item) => ({ alias: item.alias, count: Number(item.material_count) }))
    .sort((a, b) => {
      const countDifference = b.count - a.count;
      if (countDifference !== 0) return countDifference;
      const aLatest = latestByAlias.get(a.alias) ?? Number.NEGATIVE_INFINITY;
      const bLatest = latestByAlias.get(b.alias) ?? Number.NEGATIVE_INFINITY;
      if (aLatest !== bLatest) return bLatest > aLatest ? 1 : -1;
      return a.alias.localeCompare(b.alias);
    });
}

export async function fetchContributors(): Promise<Contributor[]> {
  if (!supabase) {
    throw new Error(
      "Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per llegir el rànquing.",
    );
  }

  const { data, error } = await supabase
    .from("contributor_ranking")
    .select("alias,material_count,latest_material_at")
    .order("material_count", { ascending: false })
    .order("latest_material_at", { ascending: false })
    .order("alias")
    .limit(50);

  if (error) {
    const missingLatestDateColumn =
      error.code === "42703" ||
      error.code === "PGRST204" ||
      /latest_material_at.*(does not exist|not found)/i.test(error.message);
    if (missingLatestDateColumn) return fetchContributorsWithLegacyView(supabase);
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
