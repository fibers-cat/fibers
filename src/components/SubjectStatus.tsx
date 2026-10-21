import Alert from '@mui/material/Alert';
import AppThemeProvider from '@/components/shared/AppThemeProvider';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import VolunteerActivismOutlined from '@mui/icons-material/VolunteerActivismOutlined';
import ResourceCollection from '@/components/ResourceCollection';
import ApprovedMaterials from '@/components/ApprovedMaterials';
import { materialsForSubject } from '@/data/materials';
import { localizePath, useTranslations, type Locale } from '@/i18n';

type Props = {
  subjectId: string;
  subjectName: string;
  subjectAcronym: string;
  locale: Locale;
};

export default function SubjectStatus({ subjectId, subjectName, subjectAcronym, locale }: Props) {
  const t = useTranslations(locale);
  const materials = materialsForSubject(subjectAcronym);
  return (
    <AppThemeProvider>
      <Paper className="subject-status-panel" elevation={0}>
        <Stack direction="row" spacing={1.5} className="status-heading" sx={{ alignItems: 'center' }}>
          <Typography variant="h5" component="h2">{t('subjectStatus.heading')}</Typography>
          <Chip
            label={
              materials.length === 1
                ? t('subjectStatus.filesOne', { count: materials.length })
                : t('subjectStatus.filesMany', { count: materials.length })
            }
            size="small"
            className="file-count-chip"
          />
        </Stack>
        {materials.length > 0 ? (
          <>
            <Alert className="review-alert" icon={<InfoOutlined />} severity="info">
              {t('subjectStatus.recoveredAlert')}
            </Alert>
            <ResourceCollection materials={materials} locale={locale} />
          </>
        ) : (
          <>
            <Alert className="review-alert" icon={<InfoOutlined />} severity="info">
              {t('subjectStatus.emptyAlert')}
            </Alert>
            <Typography className="status-copy">
              {t('subjectStatus.helpCopy', { name: subjectName, acronym: subjectAcronym })}
            </Typography>
          </>
        )}
        <Button href={localizePath(`/aporta/?assignatura=${encodeURIComponent(subjectAcronym)}`, locale)} variant="contained" startIcon={<VolunteerActivismOutlined />}>
          {t('subjectStatus.contributeCta')}
        </Button>
        <ApprovedMaterials subjectId={subjectId} locale={locale} />
      </Paper>
    </AppThemeProvider>
  );
}
