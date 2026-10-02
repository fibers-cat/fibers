import { useMemo, useState } from 'react';
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
import { materialCountForSubject } from '../data/materials';
import { fibersTheme } from './theme';

type Props = { subjects: Subject[] };

export default function SubjectExplorer({ subjects }: Props) {
  const [query, setQuery] = useState('');
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
            {visibleSubjects.length} {visibleSubjects.length === 1 ? 'assignatura' : 'assignatures'}
          </Typography>
        </div>
        {visibleSubjects.length > 0 ? (
          <div className="subject-grid">
            {visibleSubjects.map((subject) => {
              const materialCount = materialCountForSubject(subject.code);
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
