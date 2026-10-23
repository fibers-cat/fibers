import { useCallback, useEffect, useMemo, useState } from 'react';
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { hasSupabaseConfig } from '@/services/supabase';
import { fetchPendingContributions, reviewContribution, type PendingContribution } from '@/services/contributions';
import { useCurrentRole } from '@/services/useCurrentRole';
import { intlLocale, localizePath, useTranslations as createTranslator, type Locale } from '@/i18n';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CancelRounded from '@mui/icons-material/CancelRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import InsertDriveFileRounded from '@mui/icons-material/InsertDriveFileRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';

type SortKey = 'title' | 'subject' | 'author' | 'date' | 'files';

export default function AdminContributionsPage({ locale }: { locale: Locale }) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const { role, loading: roleLoading, error: roleError } = useCurrentRole();
  const [items, setItems] = useState<PendingContribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [drawerItem, setDrawerItem] = useState<PendingContribution | null>(null);
  const [orderBy, setOrderBy] = useState<SortKey>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

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
  }, [t]);

  useEffect(() => {
    if (role === 'admin' || role === 'superadmin') void loadPending();
  }, [loadPending, role]);

  const handleSort = (key: SortKey) => {
    if (orderBy === key) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(key);
      setOrder('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const direction = order === 'asc' ? 1 : -1;
    const getValue = (item: PendingContribution) => {
      switch (orderBy) {
        case 'title':
          return item.title.toLowerCase();
        case 'subject':
          return (item.subjects?.acronym ?? '').toLowerCase();
        case 'author':
          return (item.profiles?.alias ?? '').toLowerCase();
        case 'date':
          return new Date(item.created_at).getTime() || 0;
        case 'files':
          return item.contribution_files.length;
        default:
          return 0;
      }
    };
    const va = getValue(a);
    const vb = getValue(b);
    if (va < vb) return -1 * direction;
    if (va > vb) return 1 * direction;
    return 0;
  });

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
        if (drawerItem?.id === item.id) setDrawerItem(null);
      }
    } catch (updateError) {
      console.error('Could not review the contribution.', updateError);
      setError(t('admin.contributions.saveError'));
    }
    setActionId(null);
  };

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

  return (
    <AppThemeProvider>
      <Stack spacing={2.5} className="admin-page">
        <header className="page-heading">
          <span className="eyebrow">{t('admin.eyebrow')}</span>
          <Typography component="h1" variant="h3">{t('admin.contributions.title')}</Typography>
          <Typography>{t('admin.contributions.lead')}</Typography>
        </header>

        {roleLoading && <CircularProgress aria-label={t('admin.checkingPermissions')} />}
        {roleError && <Alert severity="error">{roleError}</Alert>}
        {!roleLoading && !role && !roleError && (
          <Alert severity="info">{t('admin.contributions.signInPrompt')} <a href={`${localizePath('/perfil/', locale)}?returnTo=${encodeURIComponent(localizePath('/admin/aportacions/', locale))}`}>{t('admin.signIn')}</a></Alert>
        )}
        {!roleLoading && role === 'user' && (
          <Alert severity="error">{t('admin.contributions.noPermission')}</Alert>
        )}
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {(role === 'admin' || role === 'superadmin') && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
              <Button onClick={() => void loadPending()} disabled={loading} variant="outlined">
                {t('admin.refreshList')}
              </Button>
            </Stack>
            {loading && <CircularProgress aria-label={t('admin.contributions.loading')} />}
            {!loading && !error && items.length === 0 && (
              <Alert severity="info">{t('admin.contributions.empty')}</Alert>
            )}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'title'} direction={orderBy === 'title' ? order : 'asc'} onClick={() => handleSort('title')}>
                        Títol
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'subject'} direction={orderBy === 'subject' ? order : 'asc'} onClick={() => handleSort('subject')}>
                        Assignatura
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'author'} direction={orderBy === 'author' ? order : 'asc'} onClick={() => handleSort('author')}>
                        Autor
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'date'} direction={orderBy === 'date' ? order : 'asc'} onClick={() => handleSort('date')}>
                        Data i hora
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'files'} direction={orderBy === 'files' ? order : 'asc'} onClick={() => handleSort('files')}>
                        Fitxers
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Accions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} hover onClick={() => setDrawerItem(item)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={item.subjects ? item.subjects.acronym : '—'} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.profiles?.alias ?? t('approvedMaterials.unknownAuthor')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(item.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={<InsertDriveFileRounded sx={{ fontSize: 14 }} />}
                          label={item.contribution_files.length}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" startIcon={<VisibilityRounded />} onClick={(e) => { e.stopPropagation(); setDrawerItem(item); }}>
                          Revisa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Stack>

      <Drawer anchor="right" open={Boolean(drawerItem)} onClose={() => setDrawerItem(null)} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 560 } } } }}>
        {drawerItem && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Aportació pendent</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{drawerItem.title}</Typography>
                </Box>
                <IconButton onClick={() => setDrawerItem(null)} size="small">
                  <CloseRounded />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5 }}>
                <Chip size="small" label={drawerItem.subjects ? drawerItem.subjects.acronym : '—'} color="primary" variant="outlined" sx={{ borderRadius: 1.5 }} />
                <Chip size="small" label={formatDateTime(drawerItem.created_at)} variant="outlined" sx={{ borderRadius: 1.5 }} />
                <Chip size="small" label={`${drawerItem.contribution_files.length} fitxers`} color="secondary" variant="outlined" sx={{ borderRadius: 1.5 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('approvedMaterials.attributedTo', { alias: drawerItem.profiles?.alias ?? t('approvedMaterials.unknownAuthor') })}
              </Typography>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
                    Descripció
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{drawerItem.description}</Typography>
                </Box>

                {drawerItem.contribution_files.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
                      Fitxers adjunts
                    </Typography>
                    <Stack spacing={1}>
                      {drawerItem.contribution_files.map((file) => (
                        <Paper key={file.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                            <InsertDriveFileRounded color="action" />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{file.original_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{(Number(file.size_bytes) / 1024 / 1024).toFixed(1)} MB</Typography>
                            </Box>
                            <Button size="small" variant="text" href={file.url} target="_blank" rel="noopener noreferrer">
                              Obre
                            </Button>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
                    Nota de revisió
                  </Typography>
                  <TextField
                    label={t('admin.contributions.noteLabel')}
                    value={notes[drawerItem.id] ?? drawerItem.review_note ?? ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [drawerItem.id]: event.target.value }))}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                </Box>
              </Stack>
            </Box>

            {/* Footer actions */}
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={actionId !== null}
                  startIcon={<CancelRounded />}
                  onClick={() => void review(drawerItem, 'rejected')}
                  sx={{ textTransform: 'none', borderRadius: 1.5, px: 2.5 }}
                >
                  {t('admin.contributions.reject')}
                </Button>
                <Button
                  variant="contained"
                  disabled={actionId !== null}
                  startIcon={<CheckCircleRounded />}
                  onClick={() => void review(drawerItem, 'approved')}
                  sx={{ textTransform: 'none', borderRadius: 1.5, px: 2.5, boxShadow: 'none', bgcolor: '#158b84', '&:hover': { bgcolor: '#0f6f69' } }}
                >
                  {t('admin.contributions.approve')}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>
    </AppThemeProvider>
  );
}
