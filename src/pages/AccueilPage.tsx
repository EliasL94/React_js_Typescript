import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fr } from '@codegouvfr/react-dsfr/fr';
import { useTitreDocument } from '../hooks/useTitreDocument';
import AutocompleteSearch from '../components/AutocompleteSearch';
import PropositionHistory from '../components/PropositionHistory';
import type { Proposition } from '../components/PropositionHistory';
import { getMysteryCommuneInsee, compareCommunes } from '../domain/game';
import { recupererCommune, type Commune } from '../domain/commune';
import { construireCheminResultat } from '../domain/partie';

export function AccueilPage() {
  useTitreDocument('Accueil');
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [mysteryCommune, setMysteryCommune] = useState<Commune | null>(null);
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialisation : on charge la commune du jour
  useEffect(() => {
    async function loadDailyGame() {
      const today = new Date().toISOString().split('T')[0];
      const inseeCode = getMysteryCommuneInsee(today);
      
      const commune = await recupererCommune(inseeCode);
      setMysteryCommune(commune);
    }
    loadDailyGame();
  }, []);

  // Synchronisation de l'URL vers le state local
  useEffect(() => {
    async function syncUrlHistory() {
      if (!mysteryCommune) return;

      const historyParam = searchParams.get('history');
      if (!historyParam) {
        if (propositions.length > 0) {
          setPropositions([]);
        }
        return;
      }

      const inseeCodes = historyParam.split(',').filter(Boolean);
      
      // On évite de refaire les appels API si on a déjà exactement le même historique
      const currentCodes = propositions.map((p) => p.commune.code);
      if (inseeCodes.join(',') === currentCodes.reverse().join(',')) {
         return; 
      }

      setIsSyncing(true);
      // Fetch toutes les communes de l'historique en parallèle
      const communesData = await Promise.all(
        inseeCodes.map((code) => recupererCommune(code))
      );

      let hasWon = false;
      const newPropositions: Proposition[] = [];

      for (const commune of communesData) {
        if (commune) {
          const indices = compareCommunes(commune, mysteryCommune);
          newPropositions.unshift({ commune, indices }); // push to front
          if (indices.distanceKm === 0) hasWon = true;
        }
      }

      setPropositions(newPropositions);
      setIsSyncing(false);

      if (hasWon) {
        navigate(construireCheminResultat(mysteryCommune.code, { statut: 'gagne', essais: newPropositions.length }));
      } else if (newPropositions.length >= 6) {
        navigate(construireCheminResultat(mysteryCommune.code, { statut: 'perdu', essais: 6 }));
      }
    }

    syncUrlHistory();
  }, [searchParams, mysteryCommune, navigate, propositions]);

  const handleSelectCommune = (selected: Commune) => {
    if (!mysteryCommune) return;

    const historyParam = searchParams.get('history');
    const currentHistory = historyParam ? historyParam.split(',').filter(Boolean) : [];
    
    // Si la commune est déjà dans l'historique, on l'ignore
    if (currentHistory.includes(selected.code)) return;

    const newHistory = [...currentHistory, selected.code].join(',');
    setSearchParams({ history: newHistory });
  };

  return (
    <>
      <h1>Communle</h1>
      <p className={fr.cx('fr-text--lead')}>
        Une commune mystère par jour. Proposez des communes, lisez les indices, et
        trouvez-la en un minimum d'essais.
      </p>

      {!mysteryCommune ? (
        <div className={fr.cx('fr-mt-4w')}>Chargement du jeu...</div>
      ) : (
        <>
          <AutocompleteSearch onSelect={handleSelectCommune} />
          
          {isSyncing && propositions.length === 0 ? (
            <div className={fr.cx('fr-mt-4w')} aria-live="polite" aria-busy="true">
              <p className="fr-text--italic fr-text--mention">Récupération de l'historique...</p>
            </div>
          ) : (
            <div aria-live="polite" aria-busy={isSyncing}>
              <PropositionHistory propositions={propositions} />
            </div>
          )}
        </>
      )}
    </>
  );
}
