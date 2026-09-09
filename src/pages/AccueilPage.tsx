import { Button } from '@codegouvfr/react-dsfr/Button';
import { CallOut } from '@codegouvfr/react-dsfr/CallOut';
import { fr } from '@codegouvfr/react-dsfr/fr';
import { construireCheminResultat } from '../domain/partie';
import { useTitreDocument } from '../hooks/useTitreDocument';

const DEMONSTRATION = construireCheminResultat('75056', {
  statut: 'gagne',
  essais: 4,
});

export function AccueilPage() {
  useTitreDocument('Accueil');

  return (
    <>
      <h1>Communle</h1>
      <p className={fr.cx('fr-text--lead')}>
        Une commune mystère par jour. Proposez des communes, lisez les indices, et
        trouvez-la en un minimum d'essais.
      </p>

      <CallOut title="La partie du jour arrive bientôt">
        La saisie et les indices sont l'objet de l'US A1. L'écran de fin de partie,
        lui, est déjà en place sur sa route dédiée.
      </CallOut>

      <Button linkProps={{ to: DEMONSTRATION }} priority="secondary">
        Voir un écran de fin de partie
      </Button>
    </>
  );
}
