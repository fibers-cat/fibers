import { useCallback, useEffect, useMemo, useState } from 'react';
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
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
import AppTooltip from '@/components/shared/AppTooltip';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import { fetchManagedUsers, updateManagedUser, type ManagedRole, type ManagedUser } from '@/services/adminUsers';
import { useCurrentRole } from '@/services/useCurrentRole';
import { intlLocale, localizePath, useTranslations as createTranslator, type Locale } from '@/i18n';

type Draft = { alias: string; role: ManagedRole };

export default function AdminUsersPage({ locale }: { locale: Locale }) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const { role, loading: roleLoading, error: roleError } = useCurrentRole();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState<'user' | 'alias' | 'role' | 'created_at' | 'last_sign_in_at'>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    if (!hasSupabaseConfig) return;
    setLoading(true);
    setError('');
    try {
      const rows = await fetchManagedUsers();
      setUsers(rows);
      setDrafts(Object.fromEntries(rows.map((user) => [
        user.user_id,
        { alias: user.alias, role: user.role === 'admin' ? 'admin' : 'user' },
      ])));
    } catch (queryError) {
      console.error('Could not load the user directory.', queryError);
      setError(t('admin.users.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (role === 'superadmin') void loadUsers();
  }, [loadUsers, role]);

  const saveUser = async (user: ManagedUser) => {
    if (!hasSupabaseConfig || user.role === 'superadmin') return;
    const draft = drafts[user.user_id];
    if (!draft || draft.alias.trim().length < 2 || draft.alias.trim().length > 40) {
      setError(t('admin.users.aliasError'));
      return;
    }

    setSavingId(user.user_id);
    setMessage('');
    setError('');
    try {
      const updated = await updateManagedUser(user.user_id, draft.alias, draft.role);
      if (!updated) {
        setError(t('admin.users.notFoundError'));
      } else {
        setUsers((current) => current.map((item) => item.user_id === user.user_id
          ? { ...item, alias: draft.alias.trim(), role: draft.role }
          : item));
        setMessage(t('admin.users.saved', { email: user.email ?? user.user_id }));
      }
    } catch (updateError) {
      console.error('Could not update the managed user.', updateError);
      setError(t('admin.users.saveError'));
    }
    setSavingId(null);
  };

  const filteredUsers = users
    .filter((user) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return (
        (user.email ?? '').toLowerCase().includes(query) ||
        user.alias.toLowerCase().includes(query) ||
        user.user_id.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const direction = order === 'asc' ? 1 : -1;
      const getValue = (user: ManagedUser) => {
        switch (orderBy) {
          case 'user':
            return (user.email ?? user.user_id).toLowerCase();
          case 'alias':
            return user.alias.toLowerCase();
          case 'role':
            return user.role;
          case 'created_at':
            return new Date(user.created_at).getTime() || 0;
          case 'last_sign_in_at':
            return user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
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

  const handleSort = (key: 'user' | 'alias' | 'role' | 'created_at' | 'last_sign_in_at') => {
    if (orderBy === key) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(key);
      setOrder('asc');
    }
  };

  const isDirty = (user: ManagedUser) => {
    const draft = drafts[user.user_id];
    if (!draft) return false;
    return (
      draft.alias.trim() !== user.alias ||
      draft.role !== (user.role === 'admin' ? 'admin' : 'user')
    );
  };

  return (
    <AppThemeProvider>
      <Stack spacing={2.5} className="admin-page">
        <header className="page-heading">
          <span className="eyebrow">{t('admin.eyebrow')}</span>
          <Typography component="h1" variant="h3">{t('admin.users.title')}</Typography>
          <Typography>{t('admin.users.lead')}</Typography>
        </header>

        {roleLoading && <CircularProgress aria-label={t('admin.checkingPermissions')} />}
        {roleError && <Alert severity="error">{roleError}</Alert>}
        {!roleLoading && !role && !roleError && (
          <Alert severity="info">{t('admin.users.signInPrompt')} <a href={`${localizePath('/perfil/', locale)}?returnTo=${encodeURIComponent(localizePath('/admin/usuaris/', locale))}`}>{t('admin.signIn')}</a></Alert>
        )}
        {!roleLoading && role === 'admin' && (
          <Alert severity="error">{t('admin.users.noPermission')}</Alert>
        )}
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {role === 'superadmin' && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
              <TextField
                size="small"
                label={t('admin.users.searchLabel')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: 240 }}
              />
              <Button onClick={() => void loadUsers()} disabled={loading} variant="outlined">
                {t('admin.refreshList')}
              </Button>
            </Stack>
            {loading && <CircularProgress aria-label={t('admin.users.loading')} />}
            {(users.length > 0 || (!loading && !error)) && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'user'} direction={orderBy === 'user' ? order : 'asc'} onClick={() => handleSort('user')}>
                        {t('admin.users.userColumn')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'alias'} direction={orderBy === 'alias' ? order : 'asc'} onClick={() => handleSort('alias')}>
                        {t('admin.users.aliasLabel')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'role'} direction={orderBy === 'role' ? order : 'asc'} onClick={() => handleSort('role')}>
                        {t('admin.users.roleLabel')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'created_at'} direction={orderBy === 'created_at' ? order : 'asc'} onClick={() => handleSort('created_at')}>
                        {t('admin.users.createdAt')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel active={orderBy === 'last_sign_in_at'} direction={orderBy === 'last_sign_in_at' ? order : 'asc'} onClick={() => handleSort('last_sign_in_at')}>
                        {t('admin.users.lastAccess')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{t('admin.users.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Alert severity="info">
                            {t(search.trim() ? 'admin.users.emptySearch' : 'admin.users.empty')}
                          </Alert>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.map((user) => {
                    const draft = drafts[user.user_id];
                    const protectedUser = user.role === 'superadmin';
                    return (
                      <TableRow key={user.user_id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                              {(user.alias || user.email || '?').slice(0, 2).toUpperCase()}
                            </Avatar>
                            <div>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Typography variant="body2">{user.email ?? t('admin.users.noEmail')}</Typography>
                                <Chip
                                  size="small"
                                  label={user.role === 'superadmin' ? t('admin.users.roleSuperadmin') : user.role === 'admin' ? t('admin.users.roleAdmin') : t('admin.users.roleUser')}
                                  color={user.role === 'superadmin' ? 'secondary' : user.role === 'admin' ? 'primary' : 'default'}
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Stack>
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                                  {user.user_id}
                                </Typography>
                                <AppTooltip title={copiedId === user.user_id ? 'Copiat!' : 'Copiar identificador'} arrow>
                                  <IconButton
                                    size="small"
                                    aria-label="Copiar identificador"
                                    onClick={() => {
                                      void navigator.clipboard?.writeText(user.user_id);
                                      setCopiedId(user.user_id);
                                      window.setTimeout(() => setCopiedId(null), 1500);
                                    }}
                                    sx={{ p: 0.25 }}
                                  >
                                    {copiedId === user.user_id ? (
                                      <CheckRounded sx={{ fontSize: 12 }} />
                                    ) : (
                                      <ContentCopyRounded sx={{ fontSize: 12 }} />
                                    )}
                                  </IconButton>
                                </AppTooltip>
                              </Stack>
                            </div>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {protectedUser ? (
                            <Typography variant="body2">{user.alias}</Typography>
                          ) : (
                            <TextField
                              size="small"
                              value={draft?.alias ?? ''}
                              onChange={(event) => setDrafts((current) => {
                                const currentDraft = current[user.user_id] ?? {
                                  alias: user.alias,
                                  role: user.role === 'admin' ? 'admin' : 'user',
                                };
                                return {
                                  ...current,
                                  [user.user_id]: { ...currentDraft, alias: event.target.value },
                                };
                              })}
                              slotProps={{ htmlInput: { minLength: 2, maxLength: 40 } }}
                              sx={{ minWidth: 160 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {protectedUser ? (
                            <Typography variant="body2">{t('admin.users.roleSuperadmin')}</Typography>
                          ) : (
                            <TextField
                              size="small"
                              select
                              value={draft?.role ?? 'user'}
                              onChange={(event) => setDrafts((current) => {
                                const currentDraft = current[user.user_id] ?? {
                                  alias: user.alias,
                                  role: user.role === 'admin' ? 'admin' : 'user',
                                };
                                return {
                                  ...current,
                                  [user.user_id]: {
                                    ...currentDraft,
                                    role: event.target.value === 'admin' ? 'admin' : 'user',
                                  },
                                };
                              })}
                              sx={{ minWidth: 120 }}
                            >
                              <MenuItem value="user">{t('admin.users.roleUser')}</MenuItem>
                              <MenuItem value="admin">{t('admin.users.roleAdmin')}</MenuItem>
                            </TextField>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.created_at && !Number.isNaN(new Date(user.created_at).getTime())
                            ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'short', timeStyle: 'short' }).format(new Date(user.created_at))
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at && !Number.isNaN(new Date(user.last_sign_in_at).getTime())
                            ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'short', timeStyle: 'short' }).format(new Date(user.last_sign_in_at))
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {protectedUser ? (
                            <Typography variant="caption" color="text.secondary">{t('admin.users.protectedSuperadmin')}</Typography>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              disabled={savingId !== null || loading || !isDirty(user) || (draft?.alias.trim() ?? '').length < 2}
                              onClick={() => void saveUser(user)}
                            >
                              {t('admin.users.save')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Stack>
    </AppThemeProvider>
  );
}
