import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { supabase } from "@/lib/supabase";

type Contributor = { alias: string; count: number };

export default function ContributorRanking() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!supabase) {
      setError("Falta configurar Supabase.");
      setLoading(false);
      return;
    }

    let active = true;
    const loadContributors = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from("contributor_ranking")
          .select("alias,material_count")
          .order("material_count", { ascending: false })
          .order("alias")
          .limit(50);

        if (!active) return;
        if (queryError) {
          console.error(
            "Failed to load contributor ranking from Supabase.",
            queryError,
          );
          setError(
            "No s’ha pogut carregar el rànquing. Revisa la configuració de Supabase.",
          );
          return;
        }
        setContributors(
          (data ?? []).map((item) => ({
            alias: item.alias,
            count: Number(item.material_count),
          })),
        );
      } catch (queryError) {
        console.error(
          "Could not connect to Supabase while loading the contributor ranking.",
          queryError,
        );
        if (active) setError("No s’ha pogut connectar amb Supabase.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadContributors();
    return () => {
      active = false;
    };
  }, []);

  if (loading)
    return (
      <div className="ranking-loading">
        <CircularProgress size={28} />
        <Typography>Carregant rànquing…</Typography>
      </div>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!contributors.length)
    return (
      <Alert severity="info">
        Encara no hi ha aportacions aprovades. Sigues la primera persona a
        compartir material.
      </Alert>
    );
  return (
    <ol className="contributor-ranking">
      {contributors.map((person, index) => (
        <li key={`${person.alias}-${index}`}>
          <span className="ranking-position">{index + 1}</span>
          <span className="ranking-alias">{person.alias}</span>
          <span className="ranking-count">
            {person.count} {person.count === 1 ? "material" : "materials"}
          </span>
        </li>
      ))}
    </ol>
  );
}
