import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { ThemeProvider } from '@mui/material/styles';
import CloseRounded from '@mui/icons-material/CloseRounded';
import GitHub from '@mui/icons-material/GitHub';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { fibersTheme } from './theme';

type MilestoneLink = {
  href: string;
  text?: string;
  ariaLabel?: string;
  kind: 'external' | 'preview';
  icon?: 'github';
};

type Milestone = {
  label: string;
  date: string;
  dateTime?: string;
  title: string;
  description: string[];
  note?: string;
  side: 'left' | 'right';
  links?: MilestoneLink[];
};

const milestones: Milestone[] = [
    {
    label: 'Versió 3.0',
    date: '2 d’octubre de 2026',
    dateTime: '2026-10-02',
    title: 'Reinici del projecte',
    description: [
      'En 2026, 10 anys després, amb l’experiència acumulada i els avenços de la IA, es decideix reiniciar-lo amb Astro, MUI i Supabase.',
    ],
    side: 'left' as const,
    links: [
      { href: 'https://github.com/fibers-cat/fibers/', ariaLabel: 'Obre el repositori actual de Fibers a GitHub', kind: 'external' as const, icon: 'github' as const },
    ],
  },
  {
    label: 'Intent de rellançament',
    date: '20 de setembre de 2022',
    dateTime: '2022-09-20',
    title: 'Un nou intent amb Next.js',
    description: ['S’intenta rellançar Fibers amb Next.js, MUI i Firebase, però el projecte no arriba a materialitzar-se.'],
    side: 'right' as const,
  },
  {
    label: 'Versió 2.0',
    date: '8 de juliol de 2017',
    dateTime: '2017-07-08',
    title: 'Publicació dinàmica amb PHP',
    description: [
      'S’intenta crear una nova web en PHP amb un sistema de publicació de continguts que mostra els usuaris col·laboradors com a autors i deixa enrere la gestió de les aportacions per correu electrònic.',
      'Es treballa en un redisseny de la web, amb una nova navegació i una nova manera d’interactuar.',
    ],
    note: 'Aquesta versió, no arribará a publicarse.',
    side: 'left' as const,
    links: [
      { href: 'https://github.com/fibers-cat/fibers-old/tree/v-2017', ariaLabel: 'Obre el repositori de Fibers a GitHub', kind: 'external' as const, icon: 'github' as const },
      { href: '/history/fibers-v2/index.html', ariaLabel: 'Previsualitza Fibers v2.0', kind: 'preview' as const },
      { href: '/history/fibers-v2/index.html', text: 'Fibers v2.0', kind: 'external' as const }
    ],
  },
  {
    label: 'Primer aportador',
    date: '18 d’octubre de 2016',
    dateTime: '2016-10-18',
    title: 'Pau Risa comparteix material d’EEE',
    description: ['Pau Risa es converteix en el primer aportador de Fibers, amb material de l’assignatura EEE.'],
    side: 'right' as const,
  },
  {
    label: 'Versió 1.0',
    date: '8 d’octubre de 2026',
    dateTime: '2026-10-08',
    title: 'La nova etapa de Fibers',
    description: ['La versió 1.0 estrena una nova web feta amb Materialize i obre el correu fiberscat@gmail.com per rebre i compartir material dels estudiants.'],
    side: 'left' as const,
    links: [
      { href: 'https://github.com/fibers-cat/fibers-old/tree/v-2016', ariaLabel: 'Obre el repositori de Fibers a GitHub', kind: 'external' as const, icon: 'github' as const },
      { href: '/history/fibers-v1/index.html', ariaLabel: 'Previsualitza Fibers v1.0', kind: 'preview' as const },
      { href: '/history/fibers-v1/index.html', text: 'Fibers v1.0', kind: 'external' as const }
    ],
  },
  {
    label: 'Versió 0.1',
    date: '22 de setembre de 2026',
    dateTime: '2026-09-22',
    title: 'Primera publicació',
    description: ['Fibers reprèn el projecte amb una primera versió pública, gratuïta i oberta, feta amb Bootstrap.'],
    side: 'left' as const,
    links: [
      { href: '/history/fibers-v0/index.html', ariaLabel: 'Previsualitza Fibers v0', kind: 'preview' as const },
      { href: '/history/fibers-v0/index.html', text: 'Fibers v0.1', kind: 'external' as const },
    ],
  },
  {
    label: 'Neix Fibers',
    date: '22 de setembre de 2016',
    dateTime: '2016-09-22',
    title: 'Una alternativa gratuïta i oberta',
    description: [
      'Alex Calle (estudiant de la FIB) i Paul Guillamón (estudiant de DAW) s’uneixen per mantenir una web amb el mateix propòsit.',
      'Es publica fibers.cat per mantenir accessibles a tothom els apunts i recursos que hi havia publicats a www.melocuenta.com.',
    ],
    side: 'right' as const,
  },
  {
    label: 'Fi d’una etapa',
    date: '2014–2016',
    title: 'Melocuenta anuncia el final del servei',
    description: ['Yeison Melo comunica que deixarà d’oferir el servei Melocuenta (www.melocuenta.com). El seu projecte dedicat a la divulgació.'],
    side: 'right' as const,
    links: [
      { href: '/history/melocuenta/index.html', ariaLabel: 'Previsualitza Melocuenta', kind: 'preview' as const },
      { href: '/history/melocuenta/index.html', text: 'Obre la versió de Melocuenta', kind: 'external' as const }
    ],
  },
];

export default function ProjectTimeline() {
  const [preview, setPreview] = useState<{
    href: string;
    label: string;
    title: string;
    openLink?: { href: string; text: string };
  } | null>(null);

  return (
    <ThemeProvider theme={fibersTheme}>
      <>
      <Timeline
        position="right"
        sx={{
          p: 0,
          [`& .MuiTimelineOppositeContent-root, & .MuiTimelineContent-root`]: { py: 1, px: { xs: 1, sm: 2 }, flex: 1 },
          [`& .MuiTimelineConnector-root`]: { bgcolor: '#e2e5e9', width: 2 },
          [`& .MuiTimelineDot-root`]: {
            width: 16,
            height: 16,
            p: 0,
            boxSizing: 'border-box',
            bgcolor: '#e94b50',
            border: '2px solid #fff',
            outline: '1px solid rgba(233, 75, 80, .35)',
            boxShadow: 'none',
            my: 0.5,
          },
          '@media (max-width: 600px)': {
            [`& .MuiTimelineItem-root`]: { minHeight: 0, flexDirection: 'row' },
            [`& .MuiTimelineOppositeContent-root`]: { display: 'none' },
            [`& .MuiTimelineContent-root`]: { px: 1, textAlign: 'left' },
          },
        }}
      >
        {milestones.map((item, index) => (
          <TimelineItem key={`${item.dateTime ?? item.date}-${item.label}`} position={item.side}>
            <TimelineOppositeContent color="text.secondary" sx={{ textAlign: item.side === 'left' ? 'left' : 'right' }}>
              <Typography component="div" variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '1px', lineHeight: 1.5 }}>
                {item.label}
              </Typography>
              <Typography component="time" dateTime={item.dateTime} variant="body2" sx={{ display: 'block', mt: 0.5, color: '#42536a', fontSize: 14 }}>
                {item.date}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color="primary" />
              {index < milestones.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, border: '1px solid #e1e4e9', borderRadius: '16px', bgcolor: '#fff', boxShadow: '0 8px 24px rgba(32, 36, 44, .035)' }}>
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '1px', lineHeight: 1.5 }}>
                    {item.label}
                  </Typography>
                  <Typography component="time" dateTime={item.dateTime} variant="body2" sx={{ flexShrink: 0, color: '#42536a', fontSize: 14 }}>
                    {item.date}
                  </Typography>
                </Box>
                <Typography component="h3" variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, fontWeight: 750, letterSpacing: '-.25px', mb: 0.75, color: '#20242c' }}>
                  {item.title}
                </Typography>
                {item.description.map((paragraph, paragraphIndex) => (
                  <Typography
                    key={`${item.label}-description-${paragraphIndex}`}
                    component="p"
                    variant="body2"
                    sx={{ mb: paragraphIndex < item.description.length - 1 ? 1 : 0, color: '#52627a', fontSize: 14, lineHeight: 1.7 }}
                  >
                    {paragraph}
                  </Typography>
                ))}
                {item.note && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {item.note}
                  </Alert>
                )}
                {item.links && (
                  <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: item.side === 'left' ? 'flex-end' : 'flex-start' }, gap: 1 }}>
                    {item.links.map((link: MilestoneLink) => {
                      const icon = link.icon === 'github' ? <GitHub /> : <VisibilityOutlined />;
                      const ariaLabel = link.ariaLabel ?? link.text ?? item.title;
                      const iconButtonSx = { width: 48, height: 48, border: '1px solid #e1e4e9', borderRadius: '12px', color: '#20242c', '&:hover': { borderColor: '#c5cbd4', bgcolor: '#fafbfc' } };
                      const openPreview = () => {
                        const openLink = item.links?.find((itemLink) => itemLink.href === link.href && itemLink.kind === 'external' && itemLink.text);
                        setPreview({
                          href: link.href,
                          label: item.label,
                          title: item.title,
                          openLink: openLink?.text ? { href: openLink.href, text: openLink.text } : undefined,
                        });
                      };

                      if (!link.text) {
                        return link.kind === 'preview' ? (
                          <IconButton key={`${link.kind}-${link.href}`} aria-label={ariaLabel} title={ariaLabel} onClick={openPreview} sx={iconButtonSx}>
                            {icon}
                          </IconButton>
                        ) : (
                          <IconButton key={`${link.kind}-${link.href}`} component="a" href={link.href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} title={ariaLabel} sx={iconButtonSx}>
                            {icon}
                          </IconButton>
                        );
                      }

                      return link.kind === 'preview' ? (
                        <Button
                          key={`${link.kind}-${link.href}`}
                          onClick={openPreview}
                          startIcon={icon}
                          variant="outlined"
                          size="small"
                          sx={{ minHeight: 48, px: 2, borderColor: '#e1e4e9', borderRadius: '12px', color: '#20242c', fontWeight: 700, '&:hover': { borderColor: '#c5cbd4', bgcolor: '#fafbfc' } }}
                        >
                          {link.text}
                        </Button>
                      ) : (
                        <Button
                          key={`${link.kind}-${link.href}`}
                          component="a"
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={link.icon === 'github' ? icon : undefined}
                          variant="outlined"
                          size="small"
                          sx={{ minHeight: 48, px: 2, borderColor: '#e1e4e9', borderRadius: '12px', color: '#20242c', fontWeight: 700, '&:hover': { borderColor: '#c5cbd4', bgcolor: '#fafbfc' } }}
                        >
                          {link.text} ↗
                        </Button>
                      );
                    })}
                  </Box>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
      <Drawer anchor="right" open={Boolean(preview)} onClose={() => setPreview(null)}>
        <Box sx={{ width: { xs: '100vw', sm: 'min(1100px, 92vw)' }, height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e1e4e9' }}>
            <Typography component="h2" variant="subtitle1" sx={{ minWidth: 0, flex: 1, overflow: 'hidden', fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {preview && `${preview.label} · ${preview.title}`}
            </Typography>
            {preview?.openLink && (
              <Button
                component="a"
                href={preview.openLink.href}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                sx={{ flexShrink: 0, minHeight: 40, borderColor: '#e1e4e9', borderRadius: '10px', color: '#20242c', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {preview.openLink.text} ↗
              </Button>
            )}
            <IconButton aria-label="Tanca la previsualització" onClick={() => setPreview(null)} sx={{ flexShrink: 0 }}>
              <CloseRounded />
            </IconButton>
          </Box>
          {preview && <iframe title={`Previsualització: ${preview.title}`} src={preview.href} style={{ flex: 1, width: '100%', border: 0 }} />}
        </Box>
      </Drawer>
      </>
    </ThemeProvider>
  );
}
