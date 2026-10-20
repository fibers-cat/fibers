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
import { supabase } from '@/lib/supabase';
import { useCurrentRole } from '@/lib/useCurrentRole';
import { intlLocale, localizePath, useTranslations, type Locale } from '@/i18n';

type ContributionFile = {
  id: string;
  original_name: string;
  size_bytes: number;
  storage_path: string;
  url: string;
};

type PendingContribution = {
  id: string;
  title: string;
  description: string;
  review_note: string | null;
  created_at: string;
  profiles: { alias: string } | null;
  subjects: { acronym: string; name: string } | null;
  contribution_files: ContributionFile[];
};

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
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('contributions')
      .select('id,title,description,review_note,created_at,profiles(alias),subjects(acronym,name),contribution_files(id,original_name,size_bytes,storage_path)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (queryError) {
      console.error('Could not load pending contributions.', queryError);
      setError(t('admin.contributions.loadError'));
      setLoading(false);
      return;
    }

    try {
      const withSignedFiles = await Promise.all(
        ((data ?? []) as unknown as PendingContribution[]).map(async (item) => {
          const files = await Promise.all(
            item.contribution_files.map(async (file) => {
              if (!supabase) throw new Error(t('admin.supabaseMissing'));
              const { data: signed, error: signedError } = await supabase.storage
                .from('contributions')
                .createSignedUrl(file.storage_path, 60 * 60);
              if (signedError) throw signedError;
              return { ...file, url: signed.signedUrl };
            }),
          );
          return { ...item, contribution_files: files };
        }),
      );
      setItems(withSignedFiles);
    } catch (loadError) {
      console.error('Could not create review links for contribution files.', loadError);
      setError(t('admin.contributions.filesError'));
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    if (role === 'admin' || role === 'superadmin') void loadPending();
  }, [loadPending, role]);

  const review = async (item: PendingContribution, status: 'approved' | 'rejected') => {
    if (!supabase) return;
    setActionId(item.id);
    setMessage('');
    setError('');

    const { data, error: updateError } = await supabase
      .from('contributions')
      .update({
        status,
        review_note: notes[item.id]?.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Could not review the contribution.', updateError);
      setError(t('admin.contributions.saveError'));
    } else if (!data) {
      setError(t('admin.contributions.staleError'));
    } else {
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setMessage(status === 'approved' ? t('admin.contributions.approved') : t('admin.contributions.rejected'));
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
