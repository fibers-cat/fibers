import { useEffect, useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import { ThemeProvider } from '@mui/material/styles';
import { supabase, type Subject } from '../lib/supabase';
import { fibersTheme } from './theme';

type Props = { initialSubject?: string };
const maxFileSize = 50 * 1024 * 1024;

export default function ContributionForm({ initialSubject = '' }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from('subjects').select('id,slug,code,name,category,description').order('code'),
      supabase.auth.getUser(),
    ]).then(([subjectResult, userResult]) => {
      setSubjects((subjectResult.data ?? []) as Subject[]);
      setUserId(userResult.data.user?.id ?? null);
      const selected = subjectResult.data?.find((item) => item.code === initialSubject);
      if (selected) setSubjectId(selected.id);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, [initialSubject]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !userId) return;
    setBusy(true);
    setMessage('');
    try {
      const { data: contribution, error } = await supabase.from('contributions').insert({
        author_id: userId, subject_id: subjectId, title: title.trim(), description: description.trim(),
      }).select('id').single();
      if (error) throw error;

      for (const file of files) {
        const path = `${userId}/${contribution.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
        const uploaded = await supabase.storage.from('contributions').upload(path, file, { contentType: file.type || 'application/octet-stream' });
        if (uploaded.error) throw uploaded.error;
        const registered = await supabase.from('contribution_files').insert({
          contribution_id: contribution.id, storage_path: path, original_name: file.name,
          mime_type: file.type || 'application/octet-stream', size_bytes: file.size,
        });
        if (registered.error) throw registered.error;
      }
      setMessage('Aportació enviada. La revisarem abans de publicar-la.');
      setFiles([]); setTitle(''); setDescription(''); setAcknowledged(false);
    } catch (error) {
      setMessage(error instanceof Error ? `No s’ha pogut enviar: ${error.message}` : 'No s’ha pogut enviar l’aportació.');
    } finally { setBusy(false); }
  };

  return <ThemeProvider theme={fibersTheme}>
    <Stack component="form" spacing={2.5} className="contribution-form" onSubmit={submit}>
      {!supabase && <Alert severity="error">Falta configurar la connexió amb Supabase.</Alert>}
      {!userId && <Alert severity="info">Per enviar una aportació cal iniciar sessió. <a href={`/perfil/?returnTo=${encodeURIComponent('/aporta/')}`}>Inicia sessió</a></Alert>}
      {message && <Alert severity={message.startsWith('Aportació enviada') ? 'success' : 'error'}>{message}</Alert>}
      <Alert severity="info" className="form-notice">Les aportacions i els fitxers queden pendents de revisió. Es publicaran quan s’aprovin.</Alert>
      <TextField select required label="Assignatura" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} fullWidth>
        <MenuItem value="">Selecciona una assignatura</MenuItem>
        {subjects.map((item) => <MenuItem key={item.id} value={item.id}>{item.code} — {item.name}</MenuItem>)}
      </TextField>
      <TextField required label="Títol del material" value={title} onChange={(event) => setTitle(event.target.value)} inputProps={{ maxLength: 120 }} fullWidth />
      <TextField required label="Descripció" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={4} inputProps={{ maxLength: 3000 }} fullWidth />
      <Button className="file-picker" component="label" variant="outlined" startIcon={<AttachFileRounded />}>Adjunta arxius
          <input hidden type="file" multiple accept=".pdf,.txt,.c,.cpp,.png,.jpg,.jpeg,.webp,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={(event) => {
          const selected = Array.from(event.target.files ?? []);
          if (selected.some((file) => file.size > maxFileSize)) { setMessage('Cada fitxer ha de pesar com a màxim 50 MB.'); return; }
          setFiles(selected);
        }} />
      </Button>
      {files.length > 0 && <Typography className="file-list">{files.map((file) => file.name).join(' · ')}</Typography>}
      <FormControlLabel control={<Checkbox checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />} label={<span>Confirmo que tinc dret a compartir aquest material i que no inclou contingut protegit.</span>} />
      <Button type="submit" variant="contained" disabled={!userId || !acknowledged || !subjectId || !title.trim() || description.trim().length < 10 || busy} startIcon={<SendRounded />}>{busy ? 'Enviant…' : 'Enviar per revisió'}</Button>
    </Stack>
  </ThemeProvider>;
}
