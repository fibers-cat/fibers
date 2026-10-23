import { useEffect, useMemo, useState } from 'react';
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import SubjectCard from '@/components/SubjectCard';
import SubjectExplorerToolbar, {
  type SubjectSortOrder,
  type SubjectStatus,
} from '@/components/SubjectExplorerToolbar';
import type { Subject } from '@/data/subjects';
import { hasSupabaseConfig } from '@/services/supabase';
import { fetchSubjectMaterialCounts, fetchLatestMaterialDates } from '@/services/subjectMaterialCounts';
import { useTranslations, type Locale } from '@/i18n';

type Props = {
  subjects: Subject[];
  featured?: boolean;
  initialMaterialCounts?: Record<string, number>;
  initialLatestMaterialDates?: Record<string, string>;
  locale: Locale;
};

const FEATURED_SUBJECT_LIMIT = 9;

export default function SubjectExplorer({
  subjects: allSubjects,
  featured = false,
  initialMaterialCounts,
  initialLatestMaterialDates,
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
  const [latestMaterialDates, setLatestMaterialDates] = useState<Record<string, string>>(
    initialLatestMaterialDates ?? {},
  );
  const [loadingDates, setLoadingDates] = useState(initialLatestMaterialDates === undefined);
  const [dateLoadError, setDateLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SubjectSortOrder>('acronym');
  const [onlyWithMaterials, setOnlyWithMaterials] = useState(false);
  const subjects = useMemo(() => {
    if (!featured) return allSubjects;
    return allSubjects
      .filter((subject) => Boolean(latestMaterialDates[subject.id]))
      .sort((a, b) => {
        const dateComparison = (latestMaterialDates[b.id] ?? '').localeCompare(latestMaterialDates[a.id] ?? '');
        return dateComparison || a.acronym.localeCompare(b.acronym, locale);
      })
      .slice(0, FEATURED_SUBJECT_LIMIT);
  }, [allSubjects, featured, latestMaterialDates, locale]);
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
    () => [...new Set(allSubjects.map((subject) => subject.category))],
  );
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(() => [
    ...new Set(allSubjects
      .flatMap((subject) => subject.specialty ? [subject.specialty] : [])),
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState<SubjectStatus[]>([
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
    if (initialLatestMaterialDates !== undefined) return;
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
  }, [initialLatestMaterialDates]);

  const visibleSubjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    const filteredSubjects = subjects.filter((subject) => featured || (
      (!normalized || `${subject.acronym} ${subject.name}`.toLocaleLowerCase(locale).includes(normalized)) &&
      selectedCategories.includes(subject.category) &&
        (selectedSpecialties.length === specialties.length ||
          (subject.specialty !== null && selectedSpecialties.includes(subject.specialty))) &&
        selectedStatuses.includes(subject.is_current ? 'current' : 'historical') &&
        (!onlyWithMaterials || (materialCounts[subject.id] ?? 0) > 0)),
    );
    if (featured) return filteredSubjects;
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
  }, [featured, query, selectedCategories, selectedSpecialties, selectedStatuses, specialties.length, subjects, sortOrder, latestMaterialDates, materialCounts, onlyWithMaterials, locale]);

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
  const toggleStatus = (status: SubjectStatus) => {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  const resetFilters = () => {
    setSelectedCategories(categories);
    setSelectedSpecialties(specialties);
    setSelectedStatuses(['current', 'historical']);
  };

  return (
    <AppThemeProvider>
      <div className="subject-explorer">
        {!featured && (
          <SubjectExplorerToolbar
            locale={locale}
            query={query}
            resultCount={visibleSubjects.length}
            categories={categories}
            specialties={specialties}
            selectedCategories={selectedCategories}
            selectedSpecialties={selectedSpecialties}
            selectedStatuses={selectedStatuses}
            sortOrder={sortOrder}
            onlyWithMaterials={onlyWithMaterials}
            loadingCounts={loadingCounts}
            countLoadError={countLoadError}
            loadingDates={loadingDates}
            dateLoadError={dateLoadError}
            onQueryChange={setQuery}
            onToggleCategory={toggleCategory}
            onToggleSpecialty={toggleSpecialty}
            onToggleStatus={toggleStatus}
            onSortOrderChange={setSortOrder}
            onOnlyWithMaterialsChange={setOnlyWithMaterials}
            onResetFilters={resetFilters}
          />
        )}
        {countLoadError && <Alert severity="error">{t('subjectExplorer.countersError')}</Alert>}
        {visibleSubjects.length > 0 ? (
          <div className="subject-grid">
            {visibleSubjects.map((subject) => (
              <SubjectCard
                key={subject.slug}
                subject={subject}
                materialCount={materialCounts[subject.id] ?? 0}
                loadingCount={loadingCounts}
                countLoadError={countLoadError}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <div className="empty-search">
            <Typography variant="h6">{t('subjectExplorer.emptyTitle')}</Typography>
            <Typography>{t('subjectExplorer.emptyLead')}</Typography>
          </div>
        )}
      </div>
    </AppThemeProvider>
  );
}
