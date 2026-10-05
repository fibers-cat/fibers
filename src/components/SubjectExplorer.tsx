import { useEffect, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { ThemeProvider } from '@mui/material/styles';
import type { Subject } from '../data/subjects';
import { supabase } from '../lib/supabase';
import { fibersTheme } from './theme';

type Props = { featured?: boolean };

const featuredCodes = new Set(['F', 'FM', 'M2', 'BD', 'EDA', 'PE', 'SO', 'EEE', 'XC']);

export default function SubjectExplorer({ featured = false }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    Promise.all([
      supabase.from('subjects').select('id,slug,code,name,category,description').order('code'),
      supabase.from('approved_material_counts').select('subject_id,file_count'),
    ]).then(([subjectResult, contributionResult]) => {
      if (subjectResult.error) setLoadError('No s’han pogut carregar les assignatures. Revisa la configuració de Supabase.');
      let results = (subjectResult.data ?? []) as Subject[];
      if (featured) results = results.filter((subject) => featuredCodes.has(subject.code));
      setSubjects(results);
      const counts: Record<string, number> = {};
      for (const contribution of contributionResult.data ?? []) counts[contribution.subject_id] = Number(contribution.file_count);
      setMaterialCounts(counts);
      setLoading(false);
    }).catch(() => { setLoadError('No s’ha pogut connectar amb Supabase.'); setLoading(false); });
  }, [featured]);
  const visibleSubjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ca');
    if (!normalized) return subjects;
    return subjects.filter((subject) =>
      `${subject.code} ${subject.name}`.toLocaleLowerCase('ca').includes(normalized),
    );
  }, [query, subjects]);

  return (
    <ThemeProvider theme={fibersTheme}>
      <div className="subject-explorer">
        <div className="explorer-toolbar">
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            label="Busca per nom o codi"
            placeholder="Busca per nom o codi"
            aria-label="Busca una assignatura"
            className="subject-search"
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRounded color="action" /></InputAdornment>,
            }}
          />
          <Typography className="results-count" aria-live="polite">
            {loading ? 'Carregant…' : `${visibleSubjects.length} ${visibleSubjects.length === 1 ? 'assignatura' : 'assignatures'}`}
          </Typography>
        </div>
        {!supabase ? <div className="empty-search"><Typography>No s’ha configurat la connexió amb Supabase.</Typography></div> : loading ? <div className="empty-search"><Typography>Carregant assignatures…</Typography></div> : loadError ? <div className="empty-search"><Typography>{loadError}</Typography></div> : visibleSubjects.length > 0 ? (
          <div className="subject-grid">
            {visibleSubjects.map((subject) => {
              const materialCount = materialCounts[subject.id] ?? 0;
              return <Card className="subject-card" key={subject.slug} elevation={0}>
                <CardActionArea component="a" href={`/assignatures/${subject.slug}/`} className="subject-card-action">
                  <CardContent className="subject-card-content">
                    <div className="subject-card-top">
                      <span className="subject-code">{subject.code}</span>
                      <div className="subject-card-tags">
                        <Chip className="category-chip" label={subject.category} size="small" />
                        <Chip
                          className={materialCount > 0 ? 'resource-count-chip' : 'resource-empty-chip'}
                          label={materialCount > 0 ? `${materialCount} ${materialCount === 1 ? 'fitxer' : 'fitxers'}` : 'Sense fitxers'}
                          size="small"
                        />
                      </div>
                    </div>
                    <Typography component="h3" variant="h6" className="subject-name">{subject.name}</Typography>
                    <Typography className="subject-description">Materials compartits de l’assignatura.</Typography>
                    <Button className="subject-open" size="small" endIcon={<ArrowForwardRounded />}>Veure assignatura</Button>
                  </CardContent>
                </CardActionArea>
              </Card>;
            })}
          </div>
        ) : (
          <div className="empty-search">
            <Typography variant="h6">No hem trobat cap assignatura</Typography>
            <Typography>Prova amb un altre nom o codi.</Typography>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
