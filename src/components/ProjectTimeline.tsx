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
import { fibersTheme } from '@/components/shared/theme';
import { getDictionary, useTranslations, type Locale } from '@/i18n';

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

export default function ProjectTimeline({ locale }: { locale: Locale }) {
  const t = useTranslations(locale);
  const milestones = getDictionary(locale).timeline.milestones as Milestone[];
  const [preview, setPreview] = useState<{
    href: string;
    label: string;
    title: string;
    openLink?: { href: string; text: string } | undefined;
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
            <IconButton aria-label={t('timeline.closePreview')} onClick={() => setPreview(null)} sx={{ flexShrink: 0 }}>
              <CloseRounded />
            </IconButton>
          </Box>
          {preview && <iframe title={t('timeline.previewTitle', { title: preview.title })} src={preview.href} style={{ flex: 1, width: '100%', border: 0 }} />}
        </Box>
      </Drawer>
      </>
    </ThemeProvider>
  );
}
