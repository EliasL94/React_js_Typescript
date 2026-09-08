import { useEffect, useState } from "react";
import AutocompleteSearch from "../components/AutocompleteSearch";
import PropositionHistory from "../components/PropositionHistory";
import type { Proposition } from "../components/PropositionHistory";
import { getMysteryCommuneInsee, compareCommunes } from "../domain/game";
import type { Commune } from "../domain/types";
import { getCommuneByInsee } from "../domain/api";

export default function Home() {
  const [mysteryCommune, setMysteryCommune] = useState<Commune | null>(null);
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [won, setWon] = useState(false);

  // Initialisation : on charge la commune du jour
  useEffect(() => {
    async function loadDailyGame() {
      // Pour avoir le format AAAA-MM-JJ
      const today = new Date().toISOString().split("T")[0];
      const inseeCode = getMysteryCommuneInsee(today);
      
      const commune = await getCommuneByInsee(inseeCode);
      setMysteryCommune(commune);
    }
    loadDailyGame();
  }, []);

  const handleSelectCommune = (selected: Commune) => {
    if (!mysteryCommune || won) return;

    // Calcul des indices via le domaine
    const indices = compareCommunes(selected, mysteryCommune);
    
    // Ajout à l'historique en première position (le plus récent en haut)
    setPropositions([{ commune: selected, indices }, ...propositions]);

    // Victoire ?
    if (indices.distanceKm === 0) {
      setWon(true);
    }
  };

  return (
    <>
      <h1>Trouvez la commune mystère du jour !</h1>
      <p className="fr-text--lead">
        Proposez une commune française. Vous obtiendrez des indices sur la distance, la direction et la population pour vous rapprocher de la solution.
      </p>

      {!mysteryCommune ? (
        <div className="fr-mt-4w">Chargement du jeu...</div>
      ) : (
        <>
          {won ? (
            <div className="fr-alert fr-alert--success fr-mt-4w fr-mb-4w">
              <h3 className="fr-alert__title">Félicitations !</h3>
              <p>Vous avez trouvé la commune mystère : <strong>{mysteryCommune.nom}</strong> !</p>
            </div>
          ) : (
            <AutocompleteSearch onSelect={handleSelectCommune} disabled={won} />
          )}
          
          <PropositionHistory propositions={propositions} />
        </>
      )}
    </>
  );
}
