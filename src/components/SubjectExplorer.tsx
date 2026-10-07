import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import FilterListRounded from '@mui/icons-material/FilterListRounded';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { ThemeProvider } from '@mui/material/styles';
import type { Subject } from '@/data/subjects';
import { supabase } from '@/lib/supabase';
import { fibersTheme } from '@/components/theme';

type Props = {
  subjects: Subject[];
  featured?: boolean;
  initialMaterialCounts?: Record<string, number>;
  showCategoryFilter?: boolean;
};

const featuredCodes = new Set(['F', 'FM', 'M2', 'BD', 'EDA', 'PE', 'SO', 'EEE', 'XC']);
const categoryClasses: Record<string, string> = {
  'Obligatòries': 'category-chip--obligatories',
  'Especialitat': 'category-chip--specialty',
  'Optatives': 'category-chip--electives',
};

export default function SubjectExplorer({
  subjects: allSubjects,
  featured = false,
  initialMaterialCounts,
  showCategoryFilter = !featured,
}: Props) {
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>(
    initialMaterialCounts ?? {},
  );
  const [loadingCounts, setLoadingCounts] = useState(
    initialMaterialCounts === undefined,
  );
  const [countLoadError, setCountLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryAnchor, setCategoryAnchor] = useState<HTMLElement | null>(null);
  const subjects = useMemo(
    () => featured ? allSubjects.filter((subject) => featuredCodes.has(subject.acronym)) : allSubjects,
    [allSubjects, featured],
  );
  const categories = useMemo(
    () => [...new Set(subjects.map((subject) => subject.category))].sort((a, b) => a.localeCompare(b, 'ca')),
    [subjects],
  );
  const specialties = useMemo(
    () => [...new Set(subjects.flatMap((subject) => subject.specialty ? [subject.specialty] : []))]
      .sort((a, b) => a.localeCompare(b, 'ca')),
    [subjects],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    () => [...new Set(allSubjects
      .filter((subject) => !featured || featuredCodes.has(subject.acronym))
      .map((subject) => subject.category))],
  );
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(() => [
    ...new Set(allSubjects
      .filter((subject) => !featured || featuredCodes.has(subject.acronym))
      .flatMap((subject) => subject.specialty ? [subject.specialty] : [])),
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState<('current' | 'historical')[]>([
    'current',
    'historical',
  ]);

  useEffect(() => {
    if (initialMaterialCounts !== undefined) return;
    let active = true;
    const loadMaterialCounts = async () => {
      if (!supabase) {
        setCountLoadError(true);
        setLoadingCounts(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('approved_material_counts')
          .select('subject_id,file_count');
        if (error) {
          console.error('Could not load approved material counts from Supabase.', error);
          if (active) setCountLoadError(true);
          return;
        }
        if (active) {
          const counts: Record<string, number> = {};
          for (const item of data ?? []) counts[item.subject_id] = Number(item.file_count);
          setMaterialCounts(counts);
        }
      } catch (error) {
        console.error('Could not connect to Supabase while loading material counts.', error);
        if (active) setCountLoadError(true);
      } finally {
        if (active) setLoadingCounts(false);
      }
    };
    void loadMaterialCounts();
    return () => { active = false; };
  }, [initialMaterialCounts]);

  const visibleSubjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ca');
    return subjects.filter((subject) =>
      (!normalized || `${subject.acronym} ${subject.name}`.toLocaleLowerCase('ca').includes(normalized)) &&
      selectedCategories.includes(subject.category) &&
      (selectedSpecialties.length === specialties.length ||
        (subject.specialty !== null && selectedSpecialties.includes(subject.specialty))) &&
      selectedStatuses.includes(subject.is_current ? 'current' : 'historical'),
    );
  }, [query, selectedCategories, selectedSpecialties, selectedStatuses, specialties.length, subjects]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };
  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((current) =>
      current.includes(specialty)
        ? current.filter((item) => item !== specialty)
        : [...current, specialty],
    );
  };
  const toggleStatus = (status: 'current' | 'historical') => {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  return (
    <ThemeProvider theme={fibersTheme}>
      <div className="subject-explorer">
        <div className="explorer-toolbar">
          <div className="explorer-filters">
            <TextField
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              label="Busca per nom o acrònim"
              placeholder="Busca per nom o acrònim"
              size="small"
              aria-label="Busca una assignatura"
              className="subject-search"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchRounded color="action" /></InputAdornment>,
                },
              }}
            />
            {showCategoryFilter && (
              <>
                <Tooltip title="Filtra assignatures" arrow>
                  <IconButton
                    className="subject-filter-button"
                    aria-label="Filtra assignatures"
                    aria-haspopup="true"
                    aria-expanded={Boolean(categoryAnchor)}
                    onClick={(event) => setCategoryAnchor(event.currentTarget)}
                  >
                    <FilterListRounded />
                  </IconButton>
                </Tooltip>
                <Popover
                  open={Boolean(categoryAnchor)}
                  anchorEl={categoryAnchor}
                  onClose={() => setCategoryAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <div className="subject-filter-popover">
                    <div className="subject-filter-heading">
                      <Typography variant="subtitle2">Filtres</Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedCategories(categories);
                          setSelectedSpecialties(specialties);
                          setSelectedStatuses(['current', 'historical']);
                        }}
                        disabled={
                          selectedCategories.length === categories.length &&
                          selectedSpecialties.length === specialties.length &&
                          selectedStatuses.length === 2
                        }
                      >
                        Totes
                      </Button>
                    </div>
                    <Typography className="subject-filter-label" variant="caption" color="text.secondary">Categories</Typography>
                    <FormGroup>
                      {categories.map((category) => (
                        <FormControlLabel
                          key={category}
                          control={
                            <Checkbox
                              checked={selectedCategories.includes(category)}
                              onChange={() => toggleCategory(category)}
                              size="small"
                            />
                          }
                          label={category}
                        />
                      ))}
                    </FormGroup>
                    <Typography className="subject-filter-label" variant="caption" color="text.secondary">Especialitats</Typography>
                    <FormGroup>
                      {specialties.map((specialty) => (
                        <FormControlLabel
                          key={specialty}
                          control={
                            <Checkbox
                              checked={selectedSpecialties.includes(specialty)}
                              onChange={() => toggleSpecialty(specialty)}
                              size="small"
                            />
                          }
                          label={specialty}
                        />
                      ))}
                    </FormGroup>
                    <Typography className="subject-filter-label" variant="caption" color="text.secondary">Vigència</Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedStatuses.includes('current')}
                            onChange={() => toggleStatus('current')}
                            size="small"
                          />
                        }
                        label="Vigents"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedStatuses.includes('historical')}
                            onChange={() => toggleStatus('historical')}
                            size="small"
                          />
                        }
                        label="Històriques"
                      />
                    </FormGroup>
                  </div>
                </Popover>
              </>
            )}
          </div>
          <Typography className="results-count" aria-live="polite">
            {`${visibleSubjects.length} ${visibleSubjects.length === 1 ? 'assignatura' : 'assignatures'}`}
          </Typography>
        </div>
        {countLoadError && <Alert severity="error">No s’han pogut carregar els comptadors de fitxers.</Alert>}
        {visibleSubjects.length > 0 ? (
          <div className="subject-grid">
            {visibleSubjects.map((subject) => {
              const materialCount = materialCounts[subject.id] ?? 0;
              return <Card className="subject-card" key={subject.slug} elevation={0}>
                <CardActionArea component="a" href={`/assignatures/${subject.slug}/`} className="subject-card-action">
                  <CardContent className="subject-card-content">
                    <div className="subject-card-top">
                      <span className="subject-code">{subject.acronym}</span>
                      <div className="subject-card-tags">
                        {loadingCounts ? (
                          <Skeleton variant="rounded" width={88} height={24} aria-label="Carregant comptador de fitxers" />
                        ) : countLoadError ? (
                          <Chip className="resource-empty-chip" label="No disponible" size="small" />
                        ) : (
                          <Chip
                            className={materialCount > 0 ? 'resource-count-chip' : 'resource-empty-chip'}
                            label={materialCount > 0 ? `${materialCount} ${materialCount === 1 ? 'fitxer' : 'fitxers'}` : 'Sense fitxers'}
                            size="small"
                          />
                        )}
                        {subject.specialty ? (
                          <Tooltip title={subject.specialty} arrow>
                            <Chip
                              className={`category-chip ${categoryClasses[subject.category] ?? ''}`}
                              label={subject.category}
                              size="small"
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            className={`category-chip ${categoryClasses[subject.category] ?? ''}`}
                            label={subject.category}
                            size="small"
                          />
                        )}
                        {!subject.is_current && (
                          <Tooltip title="Assignatura històrica" arrow describeChild>
                            <span className="historical-indicator" role="img" aria-label="Assignatura històrica">
                              <Inventory2Outlined sx={{ fontSize: 14 }} aria-hidden="true" />
                            </span>
                          </Tooltip>
                        )}
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
            <Typography>Prova amb un altre nom o acrònim, o canvia els filtres.</Typography>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
