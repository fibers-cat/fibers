import AppTooltip from '@/components/shared/AppTooltip';
import type { Subject } from '@/data/subjects';
import { localizePath, useTranslations, type Locale } from '@/i18n';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

type Props = {
  subject: Subject;
  materialCount: number;
  loadingCount: boolean;
  countLoadError: boolean;
  locale: Locale;
};

const categoryClasses: Record<string, string> = {
  'Obligatòries': 'category-chip--obligatories',
  'Especialitat': 'category-chip--specialty',
  'Optatives': 'category-chip--electives',
};

export default function SubjectCard({
  subject,
  materialCount,
  loadingCount,
  countLoadError,
  locale,
}: Props) {
  const t = useTranslations(locale);

  return (
    <Card className="subject-card" elevation={0}>
      <CardActionArea
        component="a"
        href={localizePath(`/assignatures/${subject.slug}/`, locale)}
        className="subject-card-action"
      >
        <CardContent className="subject-card-content">
          <div className="subject-card-top">
            <span className="subject-code">{subject.acronym}</span>
            <div className="subject-card-tags">
              {loadingCount ? (
                <Skeleton
                  variant="rounded"
                  width={88}
                  height={24}
                  aria-label={t('subjectExplorer.countsLoading')}
                />
              ) : countLoadError ? (
                <Chip
                  className="resource-empty-chip"
                  label={t('subjectExplorer.unavailable')}
                  size="small"
                />
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
                  <span
                    className="historical-indicator"
                    role="img"
                    aria-label={t('subjectExplorer.historicalTooltip')}
                  >
                    <Inventory2Outlined sx={{ fontSize: 14 }} aria-hidden="true" />
                  </span>
                </AppTooltip>
              )}
            </div>
          </div>
          <Typography component="h3" variant="h6" className="subject-name">
            {subject.name}
          </Typography>
          <span className="subject-open">
            {t('subjectExplorer.open')}
            <ArrowForwardRounded aria-hidden="true" />
          </span>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
