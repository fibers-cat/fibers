import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ThemeProvider } from '@mui/material/styles';
import { fibersTheme } from '@/components/theme';
import { supabase } from '@/lib/supabase';
import { useCurrentRole } from '@/lib/useCurrentRole';

type ManagedRole = 'user' | 'admin';
type ManagedUser = {
  user_id: string;
  email: string | null;
  alias: string;
  role: 'user' | 'admin' | 'superadmin';
};
type Draft = { alias: string; role: ManagedRole };

export default function AdminUsersPage() {
  const { role, loading: roleLoading, error: roleError } = useCurrentRole();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.rpc('admin_list_users');
    if (queryError) {
      console.error('Could not load the user directory.', queryError);
      setError('No s’ha pogut carregar la llista d’usuaris.');
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as ManagedUser[];
    setUsers(rows);
    setDrafts(Object.fromEntries(rows.map((user) => [
      user.user_id,
      { alias: user.alias, role: user.role === 'admin' ? 'admin' : 'user' },
    ])));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (role === 'superadmin') void loadUsers();
  }, [loadUsers, role]);

  const saveUser = async (user: ManagedUser) => {
    if (!supabase || user.role === 'superadmin') return;
    const draft = drafts[user.user_id];
    if (!draft || draft.alias.trim().length < 2 || draft.alias.trim().length > 40) {
      setError('L’àlies ha de tenir entre 2 i 40 caràcters.');
      return;
    }

    setSavingId(user.user_id);
    setMessage('');
    setError('');
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ alias: draft.alias.trim(), role: draft.role, updated_at: new Date().toISOString() })
      .eq('id', user.user_id)
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Could not update the managed user.', updateError);
      setError('No s’ha pogut desar el perfil. Pot ser que el rol ja hagi canviat.');
    } else if (!data) {
      setError('No s’ha pogut trobar el perfil per actualitzar.');
    } else {
      setUsers((current) => current.map((item) => item.user_id === user.user_id
        ? { ...item, alias: draft.alias.trim(), role: draft.role }
        : item));
      setMessage(`S’ha desat el perfil de ${user.email ?? user.user_id}.`);
    }
    setSavingId(null);
  };

  return (
    <ThemeProvider theme={fibersTheme}>
      <Stack spacing={2.5} className="admin-page">
        <header className="page-heading">
          <span className="eyebrow">GESTIÓ</span>
          <Typography component="h1" variant="h3">Gestió d’usuaris</Typography>
          <Typography>Actualitza els àlies i assigna el rol d’administrador. El superadmin no es pot reassignar.</Typography>
        </header>

        {roleLoading && <CircularProgress aria-label="Comprovant permisos" />}
        {roleError && <Alert severity="error">{roleError}</Alert>}
        {!roleLoading && !role && !roleError && (
          <Alert severity="info">Inicia sessió amb el compte superadmin per continuar. <a href="/perfil/?returnTo=%2Fadmin%2Fusuaris%2F">Inicia sessió</a></Alert>
        )}
        {!roleLoading && role === 'admin' && (
          <Alert severity="error">Només el superadmin pot gestionar usuaris.</Alert>
        )}
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {role === 'superadmin' && (
          <>
            <Button onClick={() => void loadUsers()} disabled={loading} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              Actualitza la llista
            </Button>
            {loading && <CircularProgress aria-label="Carregant usuaris" />}
            {users.map((user) => {
              const draft = drafts[user.user_id];
              return (
                <Card key={user.user_id} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <div>
                        <Typography component="h2" variant="h6">{user.email ?? 'Compte sans courriel'}</Typography>
                        <Typography color="text.secondary">{user.user_id}</Typography>
                      </div>
                      {user.role === 'superadmin' ? (
                        <Alert severity="info">Superadmin protegit.</Alert>
                      ) : (
                        <>
                          <TextField
                            label="Àlies públic"
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
                            inputProps={{ minLength: 2, maxLength: 40 }}
                          />
                          <TextField
                            select
                            label="Rol"
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
                          >
                            <MenuItem value="user">Usuari</MenuItem>
                            <MenuItem value="admin">Administrador</MenuItem>
                          </TextField>
                          <Button
                            variant="contained"
                            disabled={savingId !== null || loading || (draft?.alias.trim() ?? '').length < 2}
                            onClick={() => void saveUser(user)}
                          >
                            Desa canvis
                          </Button>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}
