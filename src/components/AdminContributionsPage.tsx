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
import { fibersTheme } from '@/components/theme';
import { supabase } from '@/lib/supabase';
import { useCurrentRole } from '@/lib/useCurrentRole';

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

export default function AdminContributionsPage() {
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
      setError('No s’han pogut carregar les aportacions pendents.');
      setLoading(false);
      return;
    }

    try {
      const withSignedFiles = await Promise.all(
        ((data ?? []) as unknown as PendingContribution[]).map(async (item) => {
          const files = await Promise.all(
            item.contribution_files.map(async (file) => {
              if (!supabase) throw new Error('Falta configurar Supabase.');
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
      setError('No s’han pogut preparar els fitxers per revisar-los.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      setError('No s’ha pogut desar la revisió.');
    } else if (!data) {
      setError('Aquesta aportació ja no està pendent de revisió. Actualitza la llista.');
    } else {
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setMessage(status === 'approved' ? 'Aportació aprovada.' : 'Aportació denegada.');
    }
    setActionId(null);
  };

  return (
    <ThemeProvider theme={fibersTheme}>
      <Stack spacing={2.5} className="admin-page">
        <header className="page-heading">
          <span className="eyebrow">GESTIÓ</span>
          <Typography component="h1" variant="h3">Revisió d’aportacions</Typography>
          <Typography>Revisa el contingut i aprova’l o denega’l abans de publicar-lo.</Typography>
        </header>

        {roleLoading && <CircularProgress aria-label="Comprovant permisos" />}
        {roleError && <Alert severity="error">{roleError}</Alert>}
        {!roleLoading && !role && !roleError && (
          <Alert severity="info">Inicia sessió amb un compte autoritzat per continuar. <a href="/perfil/?returnTo=%2Fadmin%2Faportacions%2F">Inicia sessió</a></Alert>
        )}
        {!roleLoading && role === 'user' && (
          <Alert severity="error">No tens permisos per revisar aportacions.</Alert>
        )}
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {(role === 'admin' || role === 'superadmin') && (
          <>
            <Button onClick={() => void loadPending()} disabled={loading} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              Actualitza la llista
            </Button>
            {loading && <CircularProgress aria-label="Carregant aportacions" />}
            {!loading && !error && items.length === 0 && (
              <Alert severity="info">No hi ha aportacions pendents.</Alert>
            )}
            {items.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <div>
                      <Typography component="h2" variant="h5">{item.title}</Typography>
                      <Typography color="text.secondary">
                        {item.subjects ? `${item.subjects.acronym} — ${item.subjects.name}` : 'Assignatura no disponible'}
                        {' · '}Aportat per {item.profiles?.alias ?? 'Estudiant'}
                        {' · '}{new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium' }).format(new Date(item.created_at))}
                      </Typography>
                    </div>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{item.description}</Typography>
                    {item.contribution_files.map((file) => (
                      <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer">
                        {file.original_name} · {(Number(file.size_bytes) / 1024 / 1024).toFixed(1)} MB
                      </a>
                    ))}
                    <TextField
                      label="Nota de revisió (opcional)"
                      value={notes[item.id] ?? item.review_note ?? ''}
                      onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" disabled={actionId !== null} onClick={() => void review(item, 'approved')}>
                        Aprova
                      </Button>
                      <Button variant="outlined" color="error" disabled={actionId !== null} onClick={() => void review(item, 'rejected')}>
                        Denega
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
