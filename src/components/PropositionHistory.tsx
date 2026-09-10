import type { Commune } from "../domain/commune";
import type { Indices } from "../domain/game";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";

export interface Proposition {
  commune: Commune;
  indices: Indices;
}

interface PropositionHistoryProps {
  propositions: Proposition[];
}

export default function PropositionHistory({ propositions }: PropositionHistoryProps) {
  if (propositions.length === 0) {
    return (
      <div className="fr-mt-4w">
        <CallOut
          title="Comment jouer à Communle ?"
          iconId="fr-icon-information-line"
        >
          <div style={{ display: 'inline' }}>
            Le but du jeu est de deviner la commune mystère du jour en un minimum d'essais.
            À chaque proposition, vous obtiendrez trois indices pour vous aider :
          </div>
          <ul style={{ display: 'block', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <li><strong>Distance :</strong> la distance à vol d'oiseau entre votre proposition et la commune mystère.</li>
            <li><strong>Direction :</strong> la direction à suivre pour s'en rapprocher (Nord, Sud, Est, Ouest...).</li>
            <li><strong>Population :</strong> si la commune mystère est plus ou moins peuplée que votre proposition.</li>
          </ul>
          <div style={{ display: 'inline' }} className="fr-mt-2v fr-mb-0"><em>Utilisez la barre de recherche ci-dessus pour faire votre première tentative !</em></div>
        </CallOut>
      </div>
    );
  }

  return (
    <div className="fr-mt-4w">
      <h3>Historique de tes propositions</h3>
      <div className="fr-table">
        <table>
          <thead>
            <tr>
              <th>Commune proposée</th>
              <th>Distance</th>
              <th>Direction</th>
              <th>Population</th>
            </tr>
          </thead>
          <tbody>
            {propositions.map((prop, index) => {
              const { commune, indices } = prop;
              
              // Déterminer la couleur du badge de distance
              let distanceBadgeType: "success" | "warning" | "error" = "error";
              if (indices.distanceKm === 0) distanceBadgeType = "success";
              else if (indices.distanceKm < 50) distanceBadgeType = "warning";

              return (
                <tr key={index}>
                  <td>
                    <strong>{commune.nom}</strong> ({commune.departement?.nom})
                  </td>
                  <td>
                    <Badge severity={distanceBadgeType}>
                      {indices.distanceKm === 0 ? "Trouvé !" : `${indices.distanceKm} km`}
                    </Badge>
                  </td>
                  <td>
                    <Badge severity="info" noIcon>
                      {indices.direction}
                    </Badge>
                  </td>
                  <td>
                    <Badge severity="info" noIcon>
                      {indices.populationGap === "plus" ? "⬆️ Plus peuplée" : indices.populationGap === "moins" ? "⬇️ Moins peuplée" : "Égale"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
