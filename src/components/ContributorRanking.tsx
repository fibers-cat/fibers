import Alert from "@mui/material/Alert";
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
  return (
    <ol className="contributor-ranking">
      {contributors.map((person, index) => (
        <li key={`${person.alias}-${index}`}>
          <span className="ranking-position">{index + 1}</span>
          <span className="ranking-alias">{person.alias}</span>
          <span className="ranking-count">
            {person.count}{" "}
            {person.count === 1
              ? t("contributorRanking.materialsOne")
              : t("contributorRanking.materialsMany")}
          </span>
        </li>
      ))}
    </ol>
  );
}
