import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { Contributor } from "@/services/contributors";
import { useTranslations, type Locale } from "@/i18n";

type Props = { contributors: Contributor[]; locale: Locale };

export default function ContributorRanking({ contributors, locale }: Props) {
  const t = useTranslations(locale);
  if (!contributors.length)
    return (
      <Alert severity="info">
        {t("contributorRanking.empty")}
      </Alert>
    );

  const totalContributors = contributors.length;
  const totalMaterials = contributors.reduce((sum, person) => sum + person.count, 0);
  const maxLogCount = Math.log1p(
    contributors.reduce((max, person) => Math.max(max, person.count), 0),
  );

  return (
    <Box className="contributor-ranking-wrapper">
      {/* Stats */}
      <Box className="contributor-stats">
        <Box className="contributor-stat">
          <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
            {totalContributors}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("contributorRanking.totalContributors")}
          </Typography>
        </Box>
        <Box className="contributor-stat">
          <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
            {totalMaterials}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("contributorRanking.totalMaterials")}
          </Typography>
        </Box>
      </Box>

      {/* Ranking header */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr) minmax(200px, 2fr)', gap: 2, px: 2, py: 1, borderBottom: '2px solid', borderColor: 'divider', mb: 1, textAlign: 'left' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>#</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>COL·LABORADOR</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {t("contributorRanking.logScale")}
        </Typography>
      </Box>

      {/* Ranking list */}
      <ol className="contributor-ranking">
        {contributors.map((person, index) => {
          const progress = maxLogCount > 0
            ? (Math.log1p(person.count) / maxLogCount) * 100
            : 0;
          const materialLabel = person.count === 1
            ? t("contributorRanking.materialsOne")
            : t("contributorRanking.materialsMany");
          return (
            <li key={`${person.alias}-${index}`} className={index < 3 ? "ranking-top" : ""}>
              <span className="ranking-position">
                {index + 1}
              </span>
              <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 18, lineHeight: 1 }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{person.alias}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                <Typography variant="body2" sx={{ textAlign: 'right' }}>
                  {person.count}{" "}
                  {person.count === 1
                    ? t("contributorRanking.materialsOne")
                    : t("contributorRanking.materialsMany")}
                </Typography>
                <Tooltip title={`${person.count} ${materialLabel} · ${t("contributorRanking.logScaleNote")}`} arrow>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    aria-label={`${person.alias}: ${person.count} ${materialLabel}`}
                    aria-valuetext={`${person.count} ${materialLabel}`}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: "rgba(0,0,0,.06)",
                      "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: "#e94b50" },
                    }}
                  />
                </Tooltip>
              </Box>
            </li>
          );
        })}
      </ol>
    </Box>
  );
}
