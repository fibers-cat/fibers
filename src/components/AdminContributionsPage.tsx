import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ThemeProvider } from '@mui/material/styles';
import { fibersTheme } from '@/components/shared/theme';
import { hasSupabaseConfig } from '@/services/supabase';
import { fetchPendingContributions, reviewContribution, type PendingContribution } from '@/services/contributions';
import { useCurrentRole } from '@/services/useCurrentRole';
import { intlLocale, localizePath, useTranslations, type Locale } from '@/i18n';

export default function AdminContributionsPage({ locale }: { locale: Locale }) {
  const t = useTranslations(locale);
  const { role, loading: roleLoading, error: roleError } = useCurrentRole();
  const [items, setItems] = useState<PendingContribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPending = useCallback(async () => {
    if (!hasSupabaseConfig) return;
    setLoading(true);
    setError('');
    try {
      setItems(await fetchPendingContributions());
    } catch (loadError) {
      console.error('Could not load pending contributions.', loadError);
      setError(t('admin.contributions.loadError'));
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    if (role === 'admin' || role === 'superadmin') void loadPending();
  }, [loadPending, role]);

  const review = async (item: PendingContribution, status: 'approved' | 'rejected') => {
    if (!hasSupabaseConfig) return;
    setActionId(item.id);
    setMessage('');
    setError('');

    try {
      const updated = await reviewContribution(item.id, status, notes[item.id]?.trim() || null);
      if (!updated) {
        setError(t('admin.contributions.staleError'));
      } else {
        setItems((current) => current.filter((candidate) => candidate.id !== item.id));
        setMessage(status === 'approved' ? t('admin.contributions.approved') : t('admin.contributions.rejected'));
      }
    } catch (updateError) {
      console.error('Could not review the contribution.', updateError);
      setError(t('admin.contributions.saveError'));
    }
    setActionId(null);
  };

  return (
    <ThemeProvider theme={fibersTheme}>
      <Stack spacing={2.5} className="admin-page">
        <header className="page-heading">
          <span className="eyebrow">{t('admin.eyebrow')}</span>
          <Typography component="h1" variant="h3">{t('admin.contributions.title')}</Typography>
          <Typography>{t('admin.contributions.lead')}</Typography>
        </header>

        {roleLoading && <CircularProgress aria-label={t('admin.checkingPermissions')} />}
        {roleError && <Alert severity="error">{roleError}</Alert>}
        {!roleLoading && !role && !roleError && (
          <Alert severity="info">{t('admin.contributions.signInPrompt')} <a href={localizePath(`/perfil/?returnTo=${encodeURIComponent('/admin/aportacions/')}`, locale)}>{t('admin.signIn')}</a></Alert>
        )}
        {!roleLoading && role === 'user' && (
          <Alert severity="error">{t('admin.contributions.noPermission')}</Alert>
        )}
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {(role === 'admin' || role === 'superadmin') && (
          <>
            <Button onClick={() => void loadPending()} disabled={loading} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              {t('admin.refreshList')}
            </Button>
            {loading && <CircularProgress aria-label={t('admin.contributions.loading')} />}
            {!loading && !error && items.length === 0 && (
              <Alert severity="info">{t('admin.contributions.empty')}</Alert>
            )}
            {items.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <div>
                      <Typography component="h2" variant="h5">{item.title}</Typography>
                      <Typography color="text.secondary">
                        {item.subjects ? `${item.subjects.acronym} — ${item.subjects.name}` : t('admin.contributions.subjectUnavailable')}
                        {' · '}{t('approvedMaterials.attributedTo', { alias: item.profiles?.alias ?? t('approvedMaterials.unknownAuthor') })}
                        {' · '}{new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium' }).format(new Date(item.created_at))}
                      </Typography>
                    </div>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{item.description}</Typography>
                    {item.contribution_files.map((file) => (
                      <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer">
                        {file.original_name} · {(Number(file.size_bytes) / 1024 / 1024).toFixed(1)} MB
                      </a>
                    ))}
                    <TextField
                      label={t('admin.contributions.noteLabel')}
                      value={notes[item.id] ?? item.review_note ?? ''}
                      onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" disabled={actionId !== null} onClick={() => void review(item, 'approved')}>
                        {t('admin.contributions.approve')}
                      </Button>
                      <Button variant="outlined" color="error" disabled={actionId !== null} onClick={() => void review(item, 'rejected')}>
                        {t('admin.contributions.reject')}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}
