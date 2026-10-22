import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import CodeBlock from "@/components/shared/CodeBlock";
import { detectLanguage } from "@/data/codeLanguage";
import { hasSupabaseConfig } from "@/services/supabase";
import { fetchApprovedMaterials, type ApprovedContribution, type LegacyMaterial } from "@/services/contributions";
import { intlLocale, useTranslations, type Locale } from "@/i18n";

type Props = { subjectId: string; locale: Locale };

/** Inline code of a legacy material, highlighted with the detected language. */
function LegacyCode({ content, locale }: { content: string; locale: Locale }) {
  const language = useMemo(() => detectLanguage(content), [content]);
  return (
    <CodeBlock
      code={content.trim()}
      language={language.language}
      label={language.label}
      showLabel
      locale={locale}
    />
  );
}

export default function ApprovedMaterials({ subjectId, locale }: Props) {
  const t = useTranslations(locale);
  const [items, setItems] = useState<ApprovedContribution[]>([]);
  const [legacyItems, setLegacyItems] = useState<LegacyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { contributions, legacyMaterials } = await fetchApprovedMaterials(subjectId);
        if (!active) return;
        setItems(contributions);
        setLegacyItems(legacyMaterials);
      } catch (loadError) {
        console.error("Could not load approved materials.", loadError);
        if (active) setError(t("approvedMaterials.error"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [subjectId, locale, t]);

  return (
    <section
      className="approved-materials"
      aria-labelledby="approved-materials-title"
    >
      <Typography component="h3" variant="h6" id="approved-materials-title">
        {t("approvedMaterials.heading")}
      </Typography>
      {loading && (
        <div className="ranking-loading">
          <CircularProgress size={24} />
          <Typography>{t("approvedMaterials.loading")}</Typography>
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
                {t("approvedMaterials.attributedTo", { alias: item.profiles?.alias ?? t("approvedMaterials.unknownAuthor") })} ·{" "}
                {new Intl.DateTimeFormat(intlLocale(locale)).format(
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
                {t("approvedMaterials.downloadFile")}
              </a>
            )}
            {item.external_url && (
              <a
                className="approved-file-link"
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("approvedMaterials.openExternal")}
              </a>
            )}
            {item.content_text && (
              <LegacyCode content={item.content_text} locale={locale} />
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
                {t("approvedMaterials.attributedTo", { alias: item.profiles?.alias ?? t("approvedMaterials.unknownAuthor") })}
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
