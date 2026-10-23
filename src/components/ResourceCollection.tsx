import { useEffect, useMemo, useRef, useState } from "react";
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import CloseRounded from "@mui/icons-material/CloseRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import CodeBlock from "@/components/shared/CodeBlock";
import { renderAsync } from "docx-preview";
import { detectLanguage, languageFromFileName } from "@/data/codeLanguage";
import type { Material } from "@/data/materials";
import {
  formatFileSize,
  getMaterialGroups,
  materialUrl,
} from "@/data/materials";
import { hasSupabaseConfig } from "@/services/supabase";
import { fetchMaterialAttributionRows } from "@/services/materialAttributions";
import { intlLocale, useTranslations as createTranslator, type Locale } from "@/i18n";

type Props = {
  materials: Material[];
  attributions?: Record<string, string> | undefined;
  locale: Locale;
};

const textExtensions = new Set(["txt", "c", "cpp"]);
const imageExtensions = new Set(["gif", "jpeg", "jpg", "png", "svg", "webp"]);

function attributionDate(value?: string): number {
  if (!value) return 0;
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return 0;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}

function supportsPreview(material: Material) {
  const extension = material.extension.toLowerCase();
  return (
    textExtensions.has(extension) ||
    imageExtensions.has(extension) ||
    extension === "pdf" ||
    extension === "docx"
  );
}

function Collection({ materials, attributions: initialAttributions, locale }: Props) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(intlLocale(locale)), [locale]);
  const [attributions, setAttributions] = useState<Record<string, string>>(
    initialAttributions ?? {},
  );
  const groups = useMemo(() => {
    const sortedMaterials = [...materials].sort((a, b) => {
      const dateA = attributionDate(attributions[a.path]);
      const dateB = attributionDate(attributions[b.path]);
      if (dateB !== dateA) return dateB - dateA;
      return 0;
    });
    return getMaterialGroups(sortedMaterials);
  }, [materials, attributions]);
  const [attributionsLoading, setAttributionsLoading] = useState(
    !initialAttributions && hasSupabaseConfig && materials.length > 0,
  );
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );
  const [textContent, setTextContent] = useState("");
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState(false);

  useEffect(() => {
    if (initialAttributions || !hasSupabaseConfig || materials.length === 0) return;
    fetchMaterialAttributionRows(materials)
      .then((rows) => {
        const next: Record<string, string> = {};
        for (const item of rows) {
          if (item.path)
            next[item.path] = t("resourceCollection.attributedTo", {
              alias: item.profiles?.alias ?? t("resourceCollection.unknownAuthor"),
              date: dateFormatter.format(new Date(`${item.contributed_at}T00:00:00`)),
            });
        }
        setAttributions(next);
      })
      .catch((error: unknown) => {
        console.error("Could not load material attributions.", error);
      })
      .finally(() => {
        setAttributionsLoading(false);
      });
  }, [initialAttributions, materials, t, dateFormatter]);

  useEffect(() => {
    if (
      !selectedMaterial ||
      !textExtensions.has(selectedMaterial.extension.toLowerCase())
    )
      return;

    let cancelled = false;
    setLoadingText(true);
    setTextError(false);
    setTextContent("");

    fetch(materialUrl(selectedMaterial))
      .then((response) => {
        if (!response.ok) throw new Error(t("resourceCollection.loadError"));
        return response.arrayBuffer();
      })
      .then((bytes) => {
        let content: string;
        try {
          content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          content = new TextDecoder("windows-1252").decode(bytes);
        }
        if (!cancelled) setTextContent(content);
      })
      .catch(() => {
        if (!cancelled) setTextError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingText(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMaterial, t]);

  const selectedExtension = selectedMaterial?.extension.toLowerCase();
  const isText = Boolean(
    selectedExtension && textExtensions.has(selectedExtension),
  );
  /** Language of the preview: by extension, or guessed from the content. */
  const previewLanguage = useMemo(() => {
    if (!selectedMaterial) return { language: "text", label: "Text" };
    const byName = languageFromFileName(selectedMaterial.path);
    if (byName.language !== "text") return byName;
    return detectLanguage(textContent);
  }, [selectedMaterial, textContent]);
  const closePreview = () => setSelectedMaterial(null);

  return (
    <>
      <div className="resource-groups">
        {groups.map((group) => (
          <section className="resource-group" key={group.titleKey}>
            <div className="resource-group-heading">
              <Typography component="h3" variant="subtitle1">
                {t(group.titleKey)}
              </Typography>
              <span>{group.materials.length}</span>
            </div>
            <div className="resource-list">
              {group.materials.map((material) => {
                const previewable = supportsPreview(material);
                return (
                  <Card
                    className="resource-card"
                    key={material.path}
                    elevation={0}
                  >
                    <CardContent className="resource-card-content">
                      <span className="resource-extension">
                        {material.extension.toUpperCase()}
                      </span>
                      <div className="resource-copy">
                        <Typography component="h4" variant="body1">
                          {material.titleKey ? t(material.titleKey) : material.title}
                        </Typography>
                        <Typography className="resource-meta">
                          {material.extension.toUpperCase()} ·{" "}
                          {formatFileSize(material.sizeBytes)}
                        </Typography>
                        {attributions[material.path] ? (
                          <Typography className="resource-meta">
                            {attributions[material.path]}
                          </Typography>
                        ) : attributionsLoading ? (
                          <Skeleton
                            variant="text"
                            width={170}
                            height={18}
                            sx={{ mt: '3px', borderRadius: '4px' }}
                          />
                        ) : null}
                      </div>
                      {previewable ? (
                        <Button
                          className="resource-open"
                          size="small"
                          endIcon={<VisibilityRounded />}
                          onClick={() => setSelectedMaterial(material)}
                          aria-label={t("resourceCollection.previewAria", { title: material.titleKey ? t(material.titleKey) : material.title })}
                        >
                          {t("resourceCollection.preview")}
                        </Button>
                      ) : (
                        <Button
                          component="a"
                          href={materialUrl(material)}
                          target="_blank"
                          rel="noreferrer"
                          className="resource-open"
                          size="small"
                          endIcon={<OpenInNewRounded />}
                        >
                          {t("resourceCollection.open")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Drawer
        anchor="right"
        open={Boolean(selectedMaterial)}
        onClose={closePreview}
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
        {selectedMaterial && (
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
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{
                    overflowWrap: "anywhere",
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {selectedMaterial.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedMaterial.extension.toUpperCase()} ·{" "}
                  {formatFileSize(selectedMaterial.sizeBytes)}
                </Typography>
              </Box>
              <Button
                component="a"
                href={materialUrl(selectedMaterial)}
                target="_blank"
                rel="noreferrer"
                size="small"
                endIcon={<OpenInNewRounded />}
                sx={{ flexShrink: 0 }}
              >
                {t("resourceCollection.openSeparately")}
              </Button>
              <IconButton
                onClick={closePreview}
                aria-label={t("resourceCollection.closePreview")}
                edge="end"
              >
                <CloseRounded />
              </IconButton>
            </Box>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                bgcolor: "#f6f7f9",
              }}
            >
              {isText && (
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  {loadingText && (
                    <Box
                      sx={{
                        display: "grid",
                        minHeight: 180,
                        placeItems: "center",
                      }}
                    >
                      <CircularProgress size={28} />
                    </Box>
                  )}
                  {textError && (
                    <Alert severity="error">
                      {t("resourceCollection.loadError")}
                    </Alert>
                  )}
                  {!loadingText && !textError && (
                    <CodeBlock
                      code={textContent || t("resourceCollection.emptyText")}
                      language={previewLanguage.language}
                      label={previewLanguage.label}
                      wrap={previewLanguage.language === "text"}
                      showLabel
                      locale={locale}
                    />
                  )}
                </Box>
              )}

              {selectedExtension === "pdf" && (
                <Box
                  component="iframe"
                  src={materialUrl(selectedMaterial)}
                  title={selectedMaterial.title}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    minHeight: "70vh",
                    border: 0,
                    bgcolor: "background.paper",
                  }}
                />
              )}

              {selectedExtension === "docx" && (
                 <DocxViewer
                   url={materialUrl(selectedMaterial)}
                   errorLabel={t("resourceCollection.loadError")}
                 />
               )}

               {selectedExtension && imageExtensions.has(selectedExtension) && (
                <Box
                  sx={{
                    display: "grid",
                    minHeight: "100%",
                    p: { xs: 2, sm: 3 },
                    placeItems: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={materialUrl(selectedMaterial)}
                    alt={selectedMaterial.title}
                    sx={{
                      display: "block",
                      maxWidth: "100%",
                      maxHeight: "calc(100dvh - 110px)",
                      objectFit: "contain",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                    }}
                  />
                </Box>
              )}
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
}

function DocxViewer({ url, errorLabel }: { url: string; errorLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    container.innerHTML = "";
    setLoading(true);
    setError(false);

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("loadError");
        return response.blob();
      })
      .then((blob) => {
        if (cancelled || !containerRef.current) return;
        return renderAsync(blob, containerRef.current);
      })
      .then(() => {
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [url]);

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "background.paper", p: 0 }}>
      <style>{`
        .docx-wrapper { background: transparent !important; padding: 0 !important; }
        .docx-wrapper > section.docx { box-shadow: none !important; margin-bottom: 16px !important; }
      `}</style>
      {loading && (
        <Box sx={{ display: "grid", minHeight: 180, placeItems: "center" }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {error && <Alert severity="error">{errorLabel}</Alert>}
      <div ref={containerRef} />
    </Box>
  );
}

export default function ResourceCollection({ materials, attributions, locale }: Props) {
  return (
    <AppThemeProvider>
      <Collection materials={materials} attributions={attributions} locale={locale} />
    </AppThemeProvider>
  );
}
