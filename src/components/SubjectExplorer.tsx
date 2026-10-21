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
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import AppTooltip from '@/components/shared/AppTooltip';
import Typography from '@mui/material/Typography';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import FilterListRounded from '@mui/icons-material/FilterListRounded';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SwapVertRounded from '@mui/icons-material/SwapVertRounded';
import { ThemeProvider } from '@mui/material/styles';
import type { Subject } from '@/data/subjects';
import { hasSupabaseConfig } from '@/services/supabase';
import { fetchSubjectMaterialCounts, fetchLatestMaterialDates } from '@/services/subjectMaterialCounts';
import { fibersTheme } from '@/components/shared/theme';
import { localizePath, useTranslations, type Locale } from '@/i18n';

type Props = {
  subjects: Subject[];
  featured?: boolean;
  initialMaterialCounts?: Record<string, number>;
  showCategoryFilter?: boolean;
  locale: Locale;
};

const featuredCodes = new Set(['F', 'FM', 'M2', 'BD', 'EDA', 'PE', 'SO', 'EEE', 'XC']);
const categoryClasses: Record<string, string> = {
  'Obligatòries': 'category-chip--obligatories',
  'Especialitat': 'category-chip--specialty',
  'Optatives': 'category-chip--electives',
};

type SubjectSortOrder = 'acronym' | 'acronym-desc' | 'newest' | 'oldest';

export default function SubjectExplorer({
  subjects: allSubjects,
  featured = false,
  initialMaterialCounts,
  showCategoryFilter = !featured,
  locale,
}: Props) {
  const t = useTranslations(locale);
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>(
    initialMaterialCounts ?? {},
  );
  const [loadingCounts, setLoadingCounts] = useState(
    initialMaterialCounts === undefined,
  );
  const [countLoadError, setCountLoadError] = useState(false);
  const [latestMaterialDates, setLatestMaterialDates] = useState<Record<string, string>>({});
  const [loadingDates, setLoadingDates] = useState(true);
  const [dateLoadError, setDateLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryAnchor, setCategoryAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [sortOrder, setSortOrder] = useState<SubjectSortOrder>('acronym');
  const subjects = useMemo(
    () => featured ? allSubjects.filter((subject) => featuredCodes.has(subject.acronym)) : allSubjects,
    [allSubjects, featured],
  );
  const categories = useMemo(
    () => [...new Set(subjects.map((subject) => subject.category))].sort((a, b) => a.localeCompare(b, locale)),
    [subjects, locale],
  );
  const specialties = useMemo(
    () => [...new Set(subjects.flatMap((subject) => subject.specialty ? [subject.specialty] : []))]
      .sort((a, b) => a.localeCompare(b, locale)),
    [subjects, locale],
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
      if (!hasSupabaseConfig) {
        setCountLoadError(true);
        setLoadingCounts(false);
        return;
      }
      try {
        const counts = await fetchSubjectMaterialCounts();
        if (active) setMaterialCounts(counts);
      } catch (error) {
        console.error('Could not load approved material counts from Supabase.', error);
        if (active) setCountLoadError(true);
      } finally {
        if (active) setLoadingCounts(false);
      }
    };
    void loadMaterialCounts();
    return () => { active = false; };
  }, [initialMaterialCounts]);

  useEffect(() => {
    if (!showCategoryFilter) return;
    let active = true;
    const loadLatestMaterialDates = async () => {
      if (!hasSupabaseConfig) {
        setDateLoadError(true);
        setLoadingDates(false);
        return;
      }
      try {
        const latestDates = await fetchLatestMaterialDates();
        if (active) setLatestMaterialDates(latestDates);
      } catch (error) {
        console.error('Could not load latest published material dates.', error);
        if (active) setDateLoadError(true);
      } finally {
        if (active) setLoadingDates(false);
      }
    };
    void loadLatestMaterialDates();
    return () => { active = false; };
  }, [showCategoryFilter]);

  const visibleSubjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    const filteredSubjects = subjects.filter((subject) =>
      (!normalized || `${subject.acronym} ${subject.name}`.toLocaleLowerCase(locale).includes(normalized)) &&
      selectedCategories.includes(subject.category) &&
      (selectedSpecialties.length === specialties.length ||
        (subject.specialty !== null && selectedSpecialties.includes(subject.specialty))) &&
      selectedStatuses.includes(subject.is_current ? 'current' : 'historical'),
    );
    return filteredSubjects.sort((a, b) => {
      if (sortOrder === 'newest' || sortOrder === 'oldest') {
        const aDate = latestMaterialDates[a.id] ?? '';
        const bDate = latestMaterialDates[b.id] ?? '';
        const dateComparison = aDate.localeCompare(bDate);
        if (dateComparison !== 0) {
          if (!aDate) return 1;
          if (!bDate) return -1;
          return sortOrder === 'newest' ? -dateComparison : dateComparison;
        }
      }
      const acronymComparison = a.acronym.localeCompare(b.acronym, locale);
      return sortOrder === 'acronym-desc' ? -acronymComparison : acronymComparison;
    });
  }, [query, selectedCategories, selectedSpecialties, selectedStatuses, specialties.length, subjects, sortOrder, latestMaterialDates, locale]);

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
              id="subject-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              label={t('subjectExplorer.search')}
              size="small"
              className="subject-search"
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end"><SearchRounded color="action" /></InputAdornment>,
                },
              }}
            />
            {showCategoryFilter && (
              <>
                <AppTooltip title={t('subjectExplorer.filter')} arrow>
                  <IconButton
                    className="subject-filter-button"
                    aria-label={t('subjectExplorer.filter')}
                    aria-haspopup="true"
                    aria-expanded={Boolean(categoryAnchor)}
                    onClick={(event) => setCategoryAnchor(event.currentTarget)}
                  >
                    <FilterListRounded />
                  </IconButton>
                </AppTooltip>
                <Popover
                  open={Boolean(categoryAnchor)}
                  anchorEl={categoryAnchor}
                  onClose={() => setCategoryAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <div className="subject-filter-popover">
                    <div className="subject-filter-heading">
                      <Typography variant="subtitle2">{t('subjectExplorer.filters')}</Typography>
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
                        {t('subjectExplorer.all')}
                      </Button>
                    </div>
                    <Typography className="subject-filter-label" variant="caption" color="text.secondary">{t('subjectExplorer.categories')}</Typography>
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
                    <Typography className="subject-filter-label" variant="caption" color="text.secondary">{t('subjectExplorer.specialties')}</Typography>
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
                    <Typography className="subject-filter-label" variant="caption" color="text.secondary">{t('subjectExplorer.validity')}</Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedStatuses.includes('current')}
                            onChange={() => toggleStatus('current')}
                            size="small"
                          />
                        }
                        label={t('subjectExplorer.current')}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedStatuses.includes('historical')}
                            onChange={() => toggleStatus('historical')}
                            size="small"
                          />
                        }
                        label={t('subjectExplorer.historical')}
                      />
                    </FormGroup>
                  </div>
                </Popover>
                <AppTooltip title={t('subjectExplorer.sort')} arrow>
                  <IconButton
                    className="subject-filter-button"
                    aria-label={t('subjectExplorer.sort')}
                    aria-haspopup="true"
                    aria-expanded={Boolean(sortAnchor)}
                    onClick={(event) => setSortAnchor(event.currentTarget)}
                  >
                    <SwapVertRounded />
                  </IconButton>
                </AppTooltip>
                <Popover
                  open={Boolean(sortAnchor)}
                  anchorEl={sortAnchor}
                  onClose={() => setSortAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <div className="subject-filter-popover subject-sort-popover">
                    <Typography variant="subtitle2">{t('subjectExplorer.sortBy')}</Typography>
                    <RadioGroup
                      value={sortOrder}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (
                          value === 'acronym' ||
                          value === 'acronym-desc' ||
                          value === 'newest' ||
                          value === 'oldest'
                        ) {
                          setSortOrder(value);
                          setSortAnchor(null);
                        }
                      }}
                    >
                      <FormControlLabel value="acronym" control={<Radio size="small" />} label={t('subjectExplorer.sortAcronymAsc')} />
                      <FormControlLabel value="acronym-desc" control={<Radio size="small" />} label={t('subjectExplorer.sortAcronymDesc')} />
                      <FormControlLabel
                        value="newest"
                        control={<Radio size="small" />}
                        label={t('subjectExplorer.sortNewest')}
                        disabled={loadingDates || dateLoadError}
                      />
                      <FormControlLabel
                        value="oldest"
                        control={<Radio size="small" />}
                        label={t('subjectExplorer.sortOldest')}
                        disabled={loadingDates || dateLoadError}
                      />
                    </RadioGroup>
                    {loadingDates && (
                      <Typography variant="caption" color="text.secondary">
                        {t('subjectExplorer.loadingDates')}
                      </Typography>
                    )}
                    {dateLoadError && (
                      <Typography variant="caption" color="error">
                        {t('subjectExplorer.datesError')}
                      </Typography>
                    )}
                  </div>
                </Popover>
              </>
            )}
          </div>
          <Typography className="results-count" aria-live="polite">
            {visibleSubjects.length === 1
              ? t('subjectExplorer.resultsOne', { count: visibleSubjects.length })
              : t('subjectExplorer.resultsMany', { count: visibleSubjects.length })}
          </Typography>
        </div>
        {countLoadError && <Alert severity="error">{t('subjectExplorer.countersError')}</Alert>}
        {visibleSubjects.length > 0 ? (
          <div className="subject-grid">
            {visibleSubjects.map((subject) => {
              const materialCount = materialCounts[subject.id] ?? 0;
              return <Card className="subject-card" key={subject.slug} elevation={0}>
                <CardActionArea component="a" href={localizePath(`/assignatures/${subject.slug}/`, locale)} className="subject-card-action">
                  <CardContent className="subject-card-content">
                    <div className="subject-card-top">
                      <span className="subject-code">{subject.acronym}</span>
                      <div className="subject-card-tags">
                        {loadingCounts ? (
                          <Skeleton variant="rounded" width={88} height={24} aria-label={t('subjectExplorer.countsLoading')} />
                        ) : countLoadError ? (
                          <Chip className="resource-empty-chip" label={t('subjectExplorer.unavailable')} size="small" />
                        ) : (
                          <Chip
                            className={materialCount > 0 ? 'resource-count-chip' : 'resource-empty-chip'}
                            label={
                              materialCount > 0
                                ? materialCount === 1
                                  ? t('subjectExplorer.filesOne', { count: materialCount })
                                  : t('subjectExplorer.filesMany', { count: materialCount })
                                : t('subjectExplorer.noFiles')
                            }
                            size="small"
                          />
                        )}
                        {subject.specialty ? (
                          <AppTooltip title={subject.specialty} arrow>
                            <Chip
                              className={`category-chip ${categoryClasses[subject.category] ?? ''}`}
                              label={subject.category}
                              size="small"
                            />
                          </AppTooltip>
                        ) : (
                          <Chip
                            className={`category-chip ${categoryClasses[subject.category] ?? ''}`}
                            label={subject.category}
                            size="small"
                          />
                        )}
                        {!subject.is_current && (
                          <AppTooltip title={t('subjectExplorer.historicalTooltip')} arrow describeChild>
                            <span className="historical-indicator" role="img" aria-label={t('subjectExplorer.historicalTooltip')}>
                              <Inventory2Outlined sx={{ fontSize: 14 }} aria-hidden="true" />
                            </span>
                          </AppTooltip>
                        )}
                      </div>
                    </div>
                  
                    <Typography component="h3" variant="h6" className="subject-name">{subject.name}</Typography>
                    <Typography className="subject-description">{t('subjectExplorer.cardDescription')}</Typography>
                    <Button className="subject-open" size="small" endIcon={<ArrowForwardRounded />}>{t('subjectExplorer.open')}</Button>
                  </CardContent>
                </CardActionArea>
              </Card>;
            })}
          </div>
        ) : (
          <div className="empty-search">
            <Typography variant="h6">{t('subjectExplorer.emptyTitle')}</Typography>
            <Typography>{t('subjectExplorer.emptyLead')}</Typography>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
