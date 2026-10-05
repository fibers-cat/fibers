import type { Material } from "@/data/materials";
import { supabase } from "@/lib/supabase";

export async function fetchMaterialAttributions(
  materials: Material[],
): Promise<Record<string, string>> {
  if (materials.length === 0) return {};
  if (!supabase) {
    throw new Error(
      "Configura PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY per llegir les atribucions.",
    );
  }

  const { data, error } = await supabase
    .from("legacy_materials")
    .select("path,contributed_at,profiles(alias)")
    .in(
      "path",
      materials.map((material) => material.path),
    );

  if (error) {
    throw new Error(`No s’han pogut carregar les atribucions: ${error.message}`);
  }

  const dateFormatter = new Intl.DateTimeFormat("ca-ES");
  const attributions: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path) {
      const date = dateFormatter.format(
        new Date(`${item.contributed_at}T00:00:00`),
      );
      attributions[item.path] =
        `Aportat per ${item.profiles?.alias ?? "Estudiant"} · ${date}`;
    }
  }
  return attributions;
}
