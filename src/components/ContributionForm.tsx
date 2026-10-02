import { useState, type FormEvent } from 'react';
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
import type { Subject } from '../data/subjects';
import { fibersTheme } from './theme';

type Props = { subjects: Subject[]; initialSubject?: string };

export default function ContributionForm({ subjects, initialSubject = '' }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const prepareEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subjectName = subjects.find((item) => item.code === subject)?.name ?? subject;
    const body = [
      `Assignatura: ${subjectName}`,
      `Descripció: ${description}`,
      `Nom o pseudònim: ${name || 'No indicat'}`,
      `Correu: ${email || 'No indicat'}`,
      `Fitxers per adjuntar: ${files.length ? files.join(', ') : 'Cap fitxer seleccionat'}`,
      '',
      'Recorda adjuntar els fitxers manualment abans d’enviar el correu.',
    ].join('\n');
    window.location.href = `mailto:fiberscat@gmail.com?subject=${encodeURIComponent(`Aportació Fibers · ${subjectName}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <ThemeProvider theme={fibersTheme}>
      <Stack component="form" spacing={2.5} className="contribution-form" onSubmit={prepareEmail}>
        <Alert severity="info" className="form-notice">
          Aquest web no puja ni desa fitxers. En continuar s’obrirà el teu programa de correu; hauràs d’adjuntar-hi els arxius manualment.
        </Alert>
        <TextField select required label="Assignatura" value={subject} onChange={(event) => setSubject(event.target.value)} fullWidth>
          <MenuItem value="">Selecciona una assignatura</MenuItem>
          {subjects.map((item) => <MenuItem key={item.slug} value={item.code}>{item.code} — {item.name}</MenuItem>)}
        </TextField>
        <TextField required label="Què vols compartir?" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={4} fullWidth placeholder="Descriu els apunts, exercicis o recursos…" />
        <Button className="file-picker" component="label" variant="outlined" startIcon={<AttachFileRounded />}>
          Adjunta arxius
          <input
            hidden
            type="file"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => file.name))}
          />
        </Button>
        {files.length > 0 && <Typography className="file-list">{files.join(' · ')}</Typography>}
        <TextField label="Nom o pseudònim (opcional)" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
        <TextField label="Correu electrònic (opcional)" type="email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
        <FormControlLabel
          control={<Checkbox checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />}
          label={<span>Confirmo que tinc dret a compartir aquest material i que no inclou apunts del professorat ni contingut amb copyright.</span>}
        />
        <Button type="submit" variant="contained" disabled={!acknowledged || !subject || !description.trim()} startIcon={<SendRounded />}>
          Continuar per correu
        </Button>
      </Stack>
    </ThemeProvider>
  );
}
