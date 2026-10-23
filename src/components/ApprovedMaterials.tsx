import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseRounded from "@mui/icons-material/CloseRounded";
import CodeBlock from "@/components/shared/CodeBlock";
import { detectLanguage } from "@/data/codeLanguage";
import VolunteerActivismOutlined from "@mui/icons-material/VolunteerActivismOutlined";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { hasSupabaseConfig } from "@/services/supabase";
import { fetchApprovedMaterials, type ApprovedContribution, type LegacyMaterial } from "@/services/contributions";
import { intlLocale, localizePath, useTranslations as createTranslator, type Locale } from "@/i18n";

type Props = {
  subjectId: string;
  subjectName: string;
  subjectAcronym?: string;
  hasLegacyMaterials: boolean;
  locale: Locale;
};

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

export default function ApprovedMaterials({
  subjectId,
  subjectName,
  subjectAcronym,
  hasLegacyMaterials,
  locale,
}: Props) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [items, setItems] = useState<ApprovedContribution[]>([]);
  const [legacyItems, setLegacyItems] = useState<LegacyMaterial[]>([]);
  const [previewLegacy, setPreviewLegacy] = useState<LegacyMaterial | null>(null);
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
  }, [subjectId, t]);

  const totalFiles =
    legacyItems.length +
    items.reduce((sum, item) => sum + item.files.length, 0);

  return (
    <section
      className="approved-materials"
      aria-labelledby="approved-materials-title"
    >
      <Stack direction="row" spacing={1.5} className="status-heading" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography component="h2" variant="h5" id="approved-materials-title">
            {t("approvedMaterials.heading")}
          </Typography>
          {!loading && (
            <Chip
              label={
                totalFiles === 1
                  ? t("subjectStatus.filesOne", { count: totalFiles })
                  : t("subjectStatus.filesMany", { count: totalFiles })
              }
              size="small"
              className="file-count-chip"
            />
          )}
        </Stack>
        {subjectAcronym && (
          <Button
            href={localizePath(`/aporta/?assignatura=${encodeURIComponent(subjectAcronym)}`, locale)}
            variant="contained"
            size="small"
            startIcon={<VolunteerActivismOutlined />}
          >
            {t("subjectStatus.contributeCta")}
          </Button>
        )}
      </Stack>
      {loading && (
        <div className="ranking-loading">
          <CircularProgress size={24} />
          <Typography>{t("approvedMaterials.loading")}</Typography>
        </div>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && totalFiles === 0 && !hasLegacyMaterials && (
        <Alert severity="info" className="review-alert">
          {t("approvedMaterials.emptyAlert", {
            name: subjectName,
            acronym: subjectAcronym ?? "",
          })}
        </Alert>
      )}
      <div className="approved-contribution-list">
        {legacyItems.map((item) => (
          <article className="approved-contribution" key={item.id}>
            {item.content_text &&
            subjectAcronym === "BD" &&
            item.title === "Consulta CtrlDadesPublic sobre despatxos" ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1.5,
                  minWidth: 0,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="h4" variant="subtitle1">
                    {item.title}
                  </Typography>
                  <Typography className="resource-meta">
                    {t("approvedMaterials.attributedTo", { alias: item.profiles?.alias ?? t("approvedMaterials.unknownAuthor") })} ·{" "}
                    {new Intl.DateTimeFormat(intlLocale(locale)).format(
                      new Date(`${item.contributed_at}T00:00:00`),
                    )}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<VisibilityRounded />}
                  onClick={() => setPreviewLegacy(item)}
                  aria-label={t("resourceCollection.previewAria", { title: item.title })}
                  sx={{ flexShrink: 0 }}
                >
                  {t("resourceCollection.preview")}
                </Button>
              </Box>
            ) : (
              <>
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
              </>
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
      <Drawer
        anchor="right"
        open={Boolean(previewLegacy)}
        onClose={() => setPreviewLegacy(null)}
        slotProps={{
          paper: {
            sx: {
              display: "flex",
              width: { xs: "100vw", sm: "min(760px, 94vw)" },
              maxWidth: "100vw",
              height: "100dvh",
            },
          },
        }}
      >
        {previewLegacy && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: { xs: 2, sm: 3 },
                py: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography component="h2" variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
                {previewLegacy.title}
              </Typography>
              <IconButton
                onClick={() => setPreviewLegacy(null)}
                aria-label={t("resourceCollection.closePreview")}
                edge="end"
              >
                <CloseRounded />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "#f6f7f9", p: { xs: 2, sm: 3 } }}>
              {previewLegacy.content_text && (
                <LegacyCode content={previewLegacy.content_text} locale={locale} />
              )}
            </Box>
          </>
        )}
      </Drawer>
    </section>
  );
}
