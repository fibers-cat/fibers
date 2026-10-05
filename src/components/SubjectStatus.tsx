import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import VolunteerActivismOutlined from '@mui/icons-material/VolunteerActivismOutlined';
import { ThemeProvider } from '@mui/material/styles';
import ResourceCollection from './ResourceCollection';
import ApprovedMaterials from './ApprovedMaterials';
import { materialsForSubject } from '../data/materials';
import { fibersTheme } from './theme';

type Props = { subjectId: string; subjectName: string; subjectCode: string };

export default function SubjectStatus({ subjectId, subjectName, subjectCode }: Props) {
  const materials = materialsForSubject(subjectCode);
  return (
    <ThemeProvider theme={fibersTheme}>
      <Paper className="subject-status-panel" elevation={0}>
        <Stack direction="row" alignItems="center" spacing={1.5} className="status-heading">
          <Typography variant="h5" component="h2">Materials</Typography>
          <Chip label={`${materials.length} ${materials.length === 1 ? 'fitxer' : 'fitxers'}`} size="small" className="file-count-chip" />
        </Stack>
        {materials.length > 0 ? (
          <>
            <Alert className="review-alert" icon={<InfoOutlined />} severity="info">
              Fitxers recuperats de la web anterior; comprova si el material continua vigent.
            </Alert>
            <ResourceCollection materials={materials} />
          </>
        ) : (
          <>
            <Alert className="review-alert" icon={<InfoOutlined />} severity="info">
              No s’han recuperat fitxers per a aquesta assignatura de la web anterior.
            </Alert>
            <Typography className="status-copy">
              Si tens apunts propis o exercicis resolts, pots ajudar a completar l’espai de {subjectName} ({subjectCode}).
            </Typography>
          </>
        )}
        <Button href={`/aporta/?assignatura=${encodeURIComponent(subjectCode)}`} variant="contained" startIcon={<VolunteerActivismOutlined />}>
          Aporta material
        </Button>
        <ApprovedMaterials subjectId={subjectId} />
      </Paper>
    </ThemeProvider>
  );
}
