import type { Commune, Indices } from "../domain/types";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

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
      <p className="fr-mt-4w fr-text--light">
        Aucune proposition pour l'instant. Tente ta chance !
      </p>
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
                    <strong>{commune.nom}</strong> ({commune.departement})
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
