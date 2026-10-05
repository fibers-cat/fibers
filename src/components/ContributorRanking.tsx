import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import type { Contributor } from "@/lib/contributors";

type Props = { contributors: Contributor[] };

export default function ContributorRanking({ contributors }: Props) {
  if (!contributors.length)
    return (
      <Alert severity="info">
        Encara no hi ha aportacions aprovades. Sigues la primera persona a
        compartir material.
      </Alert>
    );
  return (
    <ol className="contributor-ranking">
      {contributors.map((person, index) => (
        <li key={`${person.alias}-${index}`}>
          <span className="ranking-position">{index + 1}</span>
          <span className="ranking-alias">{person.alias}</span>
          <span className="ranking-count">
            {person.count} {person.count === 1 ? "material" : "materials"}
          </span>
        </li>
      ))}
    </ol>
  );
}
