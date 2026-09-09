import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AutocompleteSearch from "../components/AutocompleteSearch";
import PropositionHistory from "../components/PropositionHistory";
import type { Proposition } from "../components/PropositionHistory";
import { getMysteryCommuneInsee, compareCommunes } from "../domain/game";
import type { Commune } from "../domain/types";
import { getCommuneByInsee } from "../domain/api";

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Synchronisation de l'URL vers le state local
  useEffect(() => {
    async function syncUrlHistory() {
      if (!mysteryCommune) return;

      const historyParam = searchParams.get("history");
      if (!historyParam) {
        setPropositions([]);
        setWon(false);
        return;
      }

      const inseeCodes = historyParam.split(",").filter(Boolean);
      
      // On évite de refaire les appels API si on a déjà exactement le même historique
      const currentCodes = propositions.map(p => p.commune.codeINSEE);
      if (inseeCodes.join(",") === currentCodes.reverse().join(",")) {
         return; 
      }

      // Fetch toutes les communes de l'historique en parallèle
      const communesData = await Promise.all(
        inseeCodes.map(code => getCommuneByInsee(code))
      );

      let hasWon = false;
      const newPropositions: Proposition[] = [];

      // Calcule les indices pour chaque commune (le plus récent en premier)
      for (const commune of communesData) {
        if (commune) {
          const indices = compareCommunes(commune, mysteryCommune);
          newPropositions.unshift({ commune, indices }); // push to front
          if (indices.distanceKm === 0) hasWon = true;
        }
      }

      setPropositions(newPropositions);
      setWon(hasWon);
    }

    syncUrlHistory();
  }, [searchParams, mysteryCommune]);

  const handleSelectCommune = (selected: Commune) => {
    if (!mysteryCommune || won) return;

    const historyParam = searchParams.get("history");
    const currentHistory = historyParam ? historyParam.split(",").filter(Boolean) : [];
    
    // Si la commune est déjà dans l'historique, on l'ignore
    if (currentHistory.includes(selected.codeINSEE)) return;

    const newHistory = [...currentHistory, selected.codeINSEE].join(",");

    // On met à jour l'URL avec uniquement le paramètre history, ce qui nettoie automatiquement le paramètre "q"
    setSearchParams({ history: newHistory });
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
