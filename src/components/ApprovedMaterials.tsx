import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { supabase } from "../lib/supabase";

type Props = { subjectId: string };
type ApprovedFile = {
  id: string;
  original_name: string;
  size_bytes: number;
  url: string;
};
type ApprovedContribution = {
  id: string;
  title: string;
  description: string;
  profiles: { alias: string } | null;
  files: ApprovedFile[];
};
type LegacyMaterial = {
  id: string;
  title: string;
  path: string | null;
  external_url: string | null;
  content_text: string | null;
  contributed_at: string;
  profiles: { alias: string } | null;
};

export default function ApprovedMaterials({ subjectId }: Props) {
  const [items, setItems] = useState<ApprovedContribution[]>([]);
  const [legacyItems, setLegacyItems] = useState<LegacyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const [approvedResult, legacyResult] = await Promise.all([
        supabase
          .from("contributions")
          .select(
            "id,title,description,profiles(alias),contribution_files(id,original_name,storage_path,size_bytes)",
          )
          .eq("subject_id", subjectId)
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
        supabase
          .from("legacy_material_subjects")
          .select(
            "legacy_materials(id,title,path,external_url,content_text,contributed_at,profiles(alias))",
          )
          .eq("subject_id", subjectId),
      ]);
      if (approvedResult.error || legacyResult.error) {
        if (active) {
          setError("No s’han pogut carregar els materials aprovats.");
          setLoading(false);
        }
        return;
      }
      const entries = await Promise.all(
        (approvedResult.data ?? []).map(async (entry) => {
          const files = await Promise.all(
            (entry.contribution_files ?? []).map(async (file) => {
              const { data: signed } = await supabase.storage
                .from("contributions")
                .createSignedUrl(file.storage_path, 60 * 60);
              return {
                id: file.id,
                original_name: file.original_name,
                size_bytes: Number(file.size_bytes),
                url: signed?.signedUrl ?? "",
              };
            }),
          );
          return {
            id: entry.id,
            title: entry.title,
            description: entry.description,
            profiles: entry.profiles,
            files,
          };
        }),
      );
      if (active) {
        const historical = (legacyResult.data ?? [])
          .map((entry) => entry.legacy_materials)
          .filter((item) => item && !item.path) as unknown as LegacyMaterial[];
        setItems(entries);
        setLegacyItems(historical);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [subjectId]);

  return (
    <section
      className="approved-materials"
      aria-labelledby="approved-materials-title"
    >
      <Typography component="h3" variant="h6" id="approved-materials-title">
        Aportacions de la comunitat
      </Typography>
      {loading && (
        <div className="ranking-loading">
          <CircularProgress size={24} />
          <Typography>Carregant…</Typography>
        </div>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      <div className="approved-contribution-list">
        {legacyItems.map((item) => (
          <article className="approved-contribution" key={item.id}>
            <div>
              <Typography component="h4" variant="subtitle1">
                {item.title}
              </Typography>
              <Typography className="resource-meta">
                Aportat per {item.profiles?.alias ?? "Estudiant"} ·{" "}
                {new Intl.DateTimeFormat("ca-ES").format(
                  new Date(`${item.contributed_at}T00:00:00`),
                )}
              </Typography>
            </div>
            {item.path && (
              <a
                className="approved-file-link"
                href={`/files/${item.path.split("/").map(encodeURIComponent).join("/")}`}
                target="_blank"
                rel="noreferrer"
              >
                Descarrega el fitxer
              </a>
            )}
            {item.external_url && (
              <a
                className="approved-file-link"
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Obre l’enllaç extern
              </a>
            )}
            {item.content_text && (
              <pre className="legacy-code-content">{item.content_text}</pre>
            )}
          </article>
        ))}
        {items.map((item) => (
          <article className="approved-contribution" key={item.id}>
            <div>
              <Typography component="h4" variant="subtitle1">
                {item.title}
              </Typography>
              <Typography>{item.description}</Typography>
              <Typography className="resource-meta">
                Aportat per {item.profiles?.alias ?? "Estudiant"}
              </Typography>
            </div>
            {item.files.map(
              (file) =>
                file.url && (
                  <a
                    className="approved-file-link"
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {file.original_name} ·{" "}
                    {(file.size_bytes / 1024 / 1024).toFixed(1)} MB
                  </a>
                ),
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
