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
import { ThemeProvider } from '@mui/material/styles';
import { fibersTheme } from './theme';

const milestones = [
  {
    label: 'Versió 1.0',
    date: '8 d’octubre de 2026',
    dateTime: '2026-10-08',
    title: 'La nova etapa de Fibers',
    description: 'La versió 1.0 consolida la renovació del projecte i la seva web.',
    side: 'left' as const,
    link: { href: '/history/fibers-v1/index.html', text: 'Obre Fibers v1' },
  },
  {
    label: 'Versió 0.1',
    date: '22 de setembre de 2026',
    dateTime: '2026-09-22',
    title: 'Primera publicació',
    description: 'Fibers reprèn el projecte amb una primera versió pública, gratuïta i oberta.',
    side: 'left' as const,
    link: { href: '/history/fibers-v0/index.html', text: 'Obre Fibers v0' },
  },
  {
    label: 'Versió 2',
    date: '8 de juliol de 2017',
    dateTime: '2017-07-08',
    title: 'Una nova versió de Fibers',
    description: 'Fibers publica una nova versió de la seva web.',
    side: 'left' as const,
    link: { href: '/history/fibers-v2/', text: 'Obre Fibers v2' },
  },
  {
    label: 'Primer aportador',
    date: '18 d’octubre de 2016',
    dateTime: '2016-10-18',
    title: 'Pau Risa comparteix material d’EEE',
    description: 'Pau Risa es converteix en el primer aportador de Fibers, amb material de l’assignatura EEE.',
    side: 'right' as const,
  },
  {
    label: 'Neix Fibers',
    date: '22 de setembre de 2016',
    dateTime: '2016-09-22',
    title: 'Una alternativa gratuïta i oberta',
    description: 'Es publica fibers.cat per mantenir accessibles a tothom els apunts i recursos que hi havia publicats a www.melocuenta.com.',
    side: 'right' as const,
  },
  {
    label: 'Fi d’una etapa',
    date: '2014–2016',
    title: 'Melocuenta anuncia el final del servei',
    description: 'Yeison Melo comunica que deixarà d’oferir el servei Melocuenta (www.melocuenta.com). El projecte dedicat a la divulgació.',
    side: 'right' as const,
    link: { href: '/history/melocuenta/', text: 'Obre la versió de Melocuenta' },
  },
];

export default function ProjectTimeline() {
  return (
    <ThemeProvider theme={fibersTheme}>
      <Timeline
        position="right"
        sx={{
          p: 0,
          [`& .MuiTimelineOppositeContent-root, & .MuiTimelineContent-root`]: { py: 1, px: { xs: 1, sm: 2 }, flex: 1 },
          [`& .MuiTimelineConnector-root`]: { bgcolor: '#e2e5e9', width: 2 },
          [`& .MuiTimelineDot-root`]: {
            bgcolor: '#e94b50',
            border: '2px solid #fff',
            outline: '1px solid rgba(233, 75, 80, .35)',
            boxShadow: 'none',
            my: 0.5,
          },
          '@media (max-width: 600px)': {
            [`& .MuiTimelineItem-root`]: { minHeight: 0 },
            [`& .MuiTimelineOppositeContent-root`]: { px: 0.5 },
            [`& .MuiTimelineContent-root`]: { px: 1 },
          },
        }}
      >
        {milestones.map((item, index) => (
          <TimelineItem key={`${item.dateTime ?? item.date}-${item.label}`} position={item.side}>
            <TimelineOppositeContent color="text.secondary" sx={{ textAlign: item.side === 'left' ? 'left' : 'right' }}>
              <Typography component="div" variant="overline" sx={{ color: '#158b84', fontWeight: 800, letterSpacing: '1px', lineHeight: 1.5 }}>
                {item.label}
              </Typography>
              <Typography component="time" dateTime={item.dateTime} variant="body2" sx={{ display: 'block', mt: 0.5, color: '#42536a', fontSize: 13 }}>
                {item.date}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color="primary" />
              {index < milestones.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, border: '1px solid #e1e4e9', borderRadius: '16px', bgcolor: '#fff', boxShadow: '0 8px 24px rgba(32, 36, 44, .035)' }}>
                <Typography component="h3" variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, fontWeight: 750, letterSpacing: '-.25px', mb: 0.75, color: '#20242c' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#52627a', fontSize: 14, lineHeight: 1.7 }}>
                  {item.description}
                </Typography>
                {item.link && (
                  <Box sx={{ mt: 1.5 }}>
                    <Button component="a" href={item.link.href} target="_blank" rel="noreferrer" variant="outlined" size="small" sx={{ minHeight: 48, px: 2, borderColor: '#e1e4e9', borderRadius: '12px', color: '#20242c', fontWeight: 700, '&:hover': { borderColor: '#c5cbd4', bgcolor: '#fafbfc' } }}>
                      {item.link.text} ↗
                    </Button>
                  </Box>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </ThemeProvider>
  );
}
