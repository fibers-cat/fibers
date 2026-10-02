import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseRounded from '@mui/icons-material/CloseRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import { ThemeProvider } from '@mui/material/styles';
import type { Material } from '../data/materials';
import { formatFileSize, getMaterialGroups, materialUrl } from '../data/materials';
import { fibersTheme } from './theme';

type Props = { materials: Material[] };

const textExtensions = new Set(['txt', 'c', 'cpp']);
const imageExtensions = new Set(['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);

function supportsPreview(material: Material) {
  return textExtensions.has(material.extension.toLowerCase())
    || imageExtensions.has(material.extension.toLowerCase())
    || material.extension.toLowerCase() === 'pdf';
}

function Collection({ materials }: Props) {
  const groups = getMaterialGroups(materials);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState(false);

  useEffect(() => {
    if (!selectedMaterial || !textExtensions.has(selectedMaterial.extension.toLowerCase())) return;

    let cancelled = false;
    setLoadingText(true);
    setTextError(false);
    setTextContent('');

    fetch(materialUrl(selectedMaterial))
      .then((response) => {
        if (!response.ok) throw new Error('No s’ha pogut carregar el fitxer.');
        return response.arrayBuffer();
      })
      .then((bytes) => {
        let content: string;
        try {
          content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch {
          content = new TextDecoder('windows-1252').decode(bytes);
        }
        if (!cancelled) setTextContent(content);
      })
      .catch(() => {
        if (!cancelled) setTextError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingText(false);
      });

    return () => { cancelled = true; };
  }, [selectedMaterial]);

  const selectedExtension = selectedMaterial?.extension.toLowerCase();
  const isText = Boolean(selectedExtension && textExtensions.has(selectedExtension));
  const closePreview = () => setSelectedMaterial(null);

  return (
    <>
      <div className="resource-groups">
        {groups.map((group) => (
          <section className="resource-group" key={group.title}>
            <div className="resource-group-heading">
              <Typography component="h3" variant="subtitle1">{group.title}</Typography>
              <span>{group.materials.length}</span>
            </div>
            <div className="resource-list">
              {group.materials.map((material) => {
                const previewable = supportsPreview(material);
                return (
                  <Card className="resource-card" key={material.path} elevation={0}>
                    <CardContent className="resource-card-content">
                      <span className="resource-extension">{material.extension.toUpperCase()}</span>
                      <div className="resource-copy">
                        <Typography component="h4" variant="body1">{material.title}</Typography>
                        <Typography className="resource-meta">{material.extension.toUpperCase()} · {formatFileSize(material.sizeBytes)}</Typography>
                      </div>
                      {previewable ? (
                        <Button
                          className="resource-open"
                          size="small"
                          endIcon={<VisibilityRounded />}
                          onClick={() => setSelectedMaterial(material)}
                          aria-label={`Obre la vista prèvia de ${material.title}`}
                        >
                          Vista prèvia
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
                          Obre
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
              display: 'flex',
              width: { xs: '100vw', sm: 'min(760px, 94vw)' },
              maxWidth: '100vw',
              height: '100dvh',
            },
          },
        }}
      >
        {selectedMaterial && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: { xs: 2, sm: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography component="h2" variant="h6" sx={{ overflowWrap: 'anywhere', fontSize: 17, fontWeight: 700 }}>
                  {selectedMaterial.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedMaterial.extension.toUpperCase()} · {formatFileSize(selectedMaterial.sizeBytes)}
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
                Abrir aparte
              </Button>
              <IconButton onClick={closePreview} aria-label="Tanca la vista prèvia" edge="end">
                <CloseRounded />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', bgcolor: '#f6f7f9' }}>
              {isText && (
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  {loadingText && <Box sx={{ display: 'grid', minHeight: 180, placeItems: 'center' }}><CircularProgress size={28} /></Box>}
                  {textError && <Alert severity="error">No s’ha pogut carregar aquest fitxer. Pots obrir-lo en una pestanya nova.</Alert>}
                  {!loadingText && !textError && (
                    <Box component="pre" sx={{ m: 0, p: { xs: 2, sm: 3 }, overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', color: 'text.primary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {textContent || 'Aquest fitxer no conté text.'}
                    </Box>
                  )}
                </Box>
              )}

              {selectedExtension === 'pdf' && (
                <Box component="iframe" src={materialUrl(selectedMaterial)} title={selectedMaterial.title} sx={{ display: 'block', width: '100%', height: '100%', minHeight: '70vh', border: 0, bgcolor: 'background.paper' }} />
              )}

              {selectedExtension && imageExtensions.has(selectedExtension) && (
                <Box sx={{ display: 'grid', minHeight: '100%', p: { xs: 2, sm: 3 }, placeItems: 'center' }}>
                  <Box component="img" src={materialUrl(selectedMaterial)} alt={selectedMaterial.title} sx={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100dvh - 110px)', objectFit: 'contain', borderRadius: 1, bgcolor: 'background.paper' }} />
                </Box>
              )}
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
}

export default function ResourceCollection({ materials }: Props) {
  return (
    <ThemeProvider theme={fibersTheme}>
      <Collection materials={materials} />
    </ThemeProvider>
  );
}
