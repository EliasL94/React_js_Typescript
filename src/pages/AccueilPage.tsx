import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fr } from '@codegouvfr/react-dsfr/fr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { useTitreDocument } from '../hooks/useTitreDocument';
import AutocompleteSearch from '../components/AutocompleteSearch';
import PropositionHistory from '../components/PropositionHistory';
import type { Proposition } from '../components/PropositionHistory';
import { getMysteryCommuneInsee, compareCommunes, estTrouvee } from '../domain/game';
import { recupererCommune, type Commune } from '../domain/commune';
import { construireCheminResultat, NB_ESSAIS_MAX } from '../domain/partie';

export function AccueilPage() {
  useTitreDocument('Accueil');
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [mysteryCommune, setMysteryCommune] = useState<Commune | null>(null);
  const [erreurJeu, setErreurJeu] = useState(false);
  const [tentative, setTentative] = useState(0);
  const [propositions, setPropositions] = useState<Proposition[]>([]);

  // L'historique demandé par l'URL, et celui effectivement chargé. Comparer
  // les deux suffit à savoir si une synchronisation est en cours : l'état de
  // chargement se déduit du rendu, il n'a pas à être posé depuis un effet.
  const historiqueDemande = searchParams.get('history') ?? '';
  const [historiqueCharge, setHistoriqueCharge] = useState<string | null>(null);
  const isSyncing = mysteryCommune !== null && historiqueCharge !== historiqueDemande;

  // Chargement de la commune du jour.
  useEffect(() => {
    let annule = false;

    async function loadDailyGame() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const commune = await recupererCommune(getMysteryCommuneInsee(today));
        if (!annule) setMysteryCommune(commune);
      } catch {
        // Sans ce filet, l'échec restait une promesse rejetée dans le vide et
        // l'écran s'immobilisait sur « Chargement du jeu... ».
        if (!annule) setErreurJeu(true);
      }
    }

    loadDailyGame();
    return () => {
      annule = true;
    };
  }, [tentative]);

  // Synchronisation de l'URL vers le state local.
  useEffect(() => {
    if (mysteryCommune === null) return;
    if (historiqueCharge === historiqueDemande) return;

    let annule = false;

    async function syncUrlHistory(solution: Commune) {
      const inseeCodes = historiqueDemande.split(',').filter(Boolean);

      // allSettled et non all : une commune introuvable dans l'URL ne doit pas
      // emporter tout l'historique avec elle.
      const resultats = await Promise.allSettled(
        inseeCodes.map((code) => recupererCommune(code)),
      );
      if (annule) return;

      let hasWon = false;
      const newPropositions: Proposition[] = [];

      for (const resultat of resultats) {
        if (resultat.status !== 'fulfilled') continue;
        const commune = resultat.value;
        newPropositions.unshift({
          commune,
          indices: compareCommunes(commune, solution),
        });
        if (estTrouvee(commune, solution)) hasWon = true;
      }

      setPropositions(newPropositions);
      // Marqué même quand des communes ont échoué : sinon l'écart entre ce qui
      // est demandé et ce qui est chargé ne se refermerait jamais, et l'effet
      // repartirait en boucle.
      setHistoriqueCharge(historiqueDemande);

      if (hasWon) {
        navigate(
          construireCheminResultat(solution.code, {
            statut: 'gagne',
            essais: newPropositions.length,
          }),
        );
      } else if (newPropositions.length >= NB_ESSAIS_MAX) {
        navigate(
          construireCheminResultat(solution.code, {
            statut: 'perdu',
            essais: NB_ESSAIS_MAX,
          }),
        );
      }
    }

    syncUrlHistory(mysteryCommune);
    return () => {
      annule = true;
    };
  }, [historiqueDemande, historiqueCharge, mysteryCommune, navigate]);

  const handleSelectCommune = (selected: Commune) => {
    if (!mysteryCommune) return;

    const currentHistory = historiqueDemande.split(',').filter(Boolean);
    if (currentHistory.includes(selected.code)) return;

    setSearchParams({ history: [...currentHistory, selected.code].join(',') });
  };

  const reessayer = () => {
    setErreurJeu(false);
    setTentative((numero) => numero + 1);
  };

  return (
    <>
      <h1>Communle</h1>
      <p className={fr.cx('fr-text--lead')}>
        Une commune mystère par jour. Proposez des communes, lisez les indices, et
        trouvez-la en un minimum d'essais.
      </p>

      {erreurJeu ? (
        <div className={fr.cx('fr-mt-4w')}>
          <Alert
            severity="error"
            title="La partie du jour n’a pas pu être chargée"
            description="Le service qui fournit les communes ne répond pas. Vérifiez votre connexion, puis réessayez."
          />
          <Button
            className={fr.cx('fr-mt-2w')}
            iconId="fr-icon-refresh-line"
            onClick={reessayer}
          >
            Réessayer
          </Button>
        </div>
      ) : mysteryCommune === null ? (
        <p role="status" className={fr.cx('fr-mt-4w')}>
          Chargement du jeu...
        </p>
      ) : (
        <>
          <AutocompleteSearch onSelect={handleSelectCommune} />

          <div aria-live="polite" aria-busy={isSyncing}>
            {isSyncing && propositions.length === 0 ? (
              <p className={fr.cx('fr-mt-4w')}>
                Récupération de l’historique...
              </p>
            ) : (
              <PropositionHistory
                propositions={propositions}
                nbEssaisMax={NB_ESSAIS_MAX}
              />
            )}
          </div>
        </>
      )}
    </>
  );
}
