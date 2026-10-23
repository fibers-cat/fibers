import { useState } from 'react';
import AppTooltip from '@/components/shared/AppTooltip';
import { useTranslations, type Locale } from '@/i18n';
import FilterListRounded from '@mui/icons-material/FilterListRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SwapVertRounded from '@mui/icons-material/SwapVertRounded';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export type SubjectSortOrder = 'acronym' | 'acronym-desc' | 'newest' | 'oldest';
export type SubjectStatus = 'current' | 'historical';

type Props = {
  locale: Locale;
  query: string;
  resultCount: number;
  categories: string[];
  specialties: string[];
  selectedCategories: string[];
  selectedSpecialties: string[];
  selectedStatuses: SubjectStatus[];
  sortOrder: SubjectSortOrder;
  onlyWithMaterials: boolean;
  loadingCounts: boolean;
  countLoadError: boolean;
  loadingDates: boolean;
  dateLoadError: boolean;
  onQueryChange: (query: string) => void;
  onToggleCategory: (category: string) => void;
  onToggleSpecialty: (specialty: string) => void;
  onToggleStatus: (status: SubjectStatus) => void;
  onResetFilters: () => void;
  onSortOrderChange: (order: SubjectSortOrder) => void;
  onOnlyWithMaterialsChange: (checked: boolean) => void;
};

export default function SubjectExplorerToolbar({
  locale,
  query,
  resultCount,
  categories,
  specialties,
  selectedCategories,
  selectedSpecialties,
  selectedStatuses,
  sortOrder,
  onlyWithMaterials,
  loadingCounts,
  countLoadError,
  loadingDates,
  dateLoadError,
  onQueryChange,
  onToggleCategory,
  onToggleSpecialty,
  onToggleStatus,
  onResetFilters,
  onSortOrderChange,
  onOnlyWithMaterialsChange,
}: Props) {
  const t = useTranslations(locale);
  const [categoryAnchor, setCategoryAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);

  return (
    <div className="explorer-toolbar">
      <div className="explorer-filters">
        <TextField
          id="subject-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          label={t('subjectExplorer.search')}
          size="small"
          className="subject-search"
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end"><SearchRounded color="action" /></InputAdornment>,
            },
          }}
        />
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
                onClick={onResetFilters}
                disabled={
                  selectedCategories.length === categories.length &&
                  selectedSpecialties.length === specialties.length &&
                  selectedStatuses.length === 2
                }
              >
                {t('subjectExplorer.all')}
              </Button>
            </div>
            <Typography className="subject-filter-label" variant="caption" color="text.secondary">
              {t('subjectExplorer.categories')}
            </Typography>
            <FormGroup>
              {categories.map((category) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={selectedCategories.includes(category)}
                      onChange={() => onToggleCategory(category)}
                      size="small"
                    />
                  }
                  label={category}
                />
              ))}
            </FormGroup>
            <Typography className="subject-filter-label" variant="caption" color="text.secondary">
              {t('subjectExplorer.specialties')}
            </Typography>
            <FormGroup>
              {specialties.map((specialty) => (
                <FormControlLabel
                  key={specialty}
                  control={
                    <Checkbox
                      checked={selectedSpecialties.includes(specialty)}
                      onChange={() => onToggleSpecialty(specialty)}
                      size="small"
                    />
                  }
                  label={specialty}
                />
              ))}
            </FormGroup>
            <Typography className="subject-filter-label" variant="caption" color="text.secondary">
              {t('subjectExplorer.validity')}
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedStatuses.includes('current')}
                    onChange={() => onToggleStatus('current')}
                    size="small"
                  />
                }
                label={t('subjectExplorer.current')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedStatuses.includes('historical')}
                    onChange={() => onToggleStatus('historical')}
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
                  onSortOrderChange(value);
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
        <FormControlLabel
          control={
            <Checkbox
              checked={onlyWithMaterials}
              onChange={(event) => onOnlyWithMaterialsChange(event.target.checked)}
              size="small"
              disabled={loadingCounts || countLoadError}
            />
          }
          label={t('subjectExplorer.onlyWithMaterials')}
        />
      </div>
      <Typography className="results-count" aria-live="polite">
        {resultCount === 1
          ? t('subjectExplorer.resultsOne', { count: resultCount })
          : t('subjectExplorer.resultsMany', { count: resultCount })}
      </Typography>
    </div>
  );
}
