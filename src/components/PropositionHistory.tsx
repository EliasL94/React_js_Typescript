import type { Commune } from "../domain/commune";
import type { Indices } from "../domain/game";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Table } from "@codegouvfr/react-dsfr/Table";

export interface Proposition {
  commune: Commune;
  indices: Indices;
}

interface PropositionHistoryProps {
  propositions: Proposition[];
  /** Nombre d'essais dont dispose le joueur, affiché à côté du décompte. */
  nbEssaisMax?: number;
}

const MENTION_ABSENTE = "Non renseigné";

function libelleDistance(distanceKm: number | null): string {
  if (distanceKm === null) return MENTION_ABSENTE;
  if (distanceKm === 0) return "Trouvé !";
  return `${distanceKm} km`;
}

function severiteDistance(distanceKm: number | null): "success" | "warning" | "error" | "info" {
  if (distanceKm === null) return "info";
  if (distanceKm === 0) return "success";
  if (distanceKm < 50) return "warning";
  return "error";
}

function libellePopulation(populationGap: Indices["populationGap"]): string {
  if (populationGap === "plus") return "Plus peuplée";
  if (populationGap === "moins") return "Moins peuplée";
  if (populationGap === "egal") return "Population égale";
  return MENTION_ABSENTE;
}

function libelleCommune(commune: Commune): string {
  const nom = commune.nom.trim() === "" ? MENTION_ABSENTE : commune.nom;
  return commune.departement === null ? nom : `${nom} (${commune.departement.nom})`;
}

export default function PropositionHistory({
  propositions,
  nbEssaisMax = 6,
}: PropositionHistoryProps) {
  if (propositions.length === 0) {
    return (
      <div className="fr-mt-4w">
        <CallOut
          title="Comment jouer à Communle ?"
          iconId="fr-icon-information-line"
        >
          <span style={{ display: 'inline' }}>
            Le but du jeu est de deviner la commune mystère du jour en un minimum d'essais.
            À chaque proposition, vous obtiendrez trois indices pour vous aider :
            <br /><br />
            <strong>- Distance :</strong> la distance à vol d'oiseau entre votre proposition et la commune mystère.<br />
            <strong>- Direction :</strong> la direction à suivre pour s'en rapprocher (Nord, Sud, Est, Ouest...).<br />
            <strong>- Population :</strong> si la commune mystère est plus ou moins peuplée que votre proposition.<br /><br />
            <em>Utilisez la barre de recherche ci-dessus pour faire votre première tentative !</em>
          </span>
        </CallOut>
      </div>
    );
  }

  const nombre = propositions.length;
  // La légende d'un tableau est rendue avant les lignes et lue en premier :
  // c'est elle qui annonce le décompte, pas un titre posé au-dessus.
  const legende = `${nombre} proposition${nombre > 1 ? "s" : ""} sur ${nbEssaisMax}`;

  return (
    <div className="fr-mt-4w">
      <h3>Historique de tes propositions</h3>
      <Table
        caption={legende}
        bordered
        headers={["Commune proposée", "Distance", "Direction", "Population"]}
        data={propositions.map(({ commune, indices }) => [
          libelleCommune(commune),
          <Badge key="distance" severity={severiteDistance(indices.distanceKm)}>
            {libelleDistance(indices.distanceKm)}
          </Badge>,
          <Badge key="direction" severity="info" noIcon>
            {indices.direction ?? MENTION_ABSENTE}
          </Badge>,
          <Badge key="population" severity="info" noIcon>
            {libellePopulation(indices.populationGap)}
          </Badge>,
        ])}
      />
    </div>
  );
}
