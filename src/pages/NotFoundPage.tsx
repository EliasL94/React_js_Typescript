import { Button } from '@codegouvfr/react-dsfr/Button';
import { fr } from '@codegouvfr/react-dsfr/fr';
import { useTitreDocument } from '../hooks/useTitreDocument';

export function NotFoundPage() {
  useTitreDocument('Page introuvable');

  return (
    <>
      <p className={fr.cx('fr-text--sm', 'fr-mb-1w')}>Erreur 404</p>
      <h1>Page introuvable</h1>
      <p className={fr.cx('fr-text--lead')}>
        La page demandée n'existe pas. Si vous avez suivi un lien vers une commune, le
        code INSEE qu'il contient ne correspond à aucune commune française.
      </p>
      <Button linkProps={{ to: '/' }} iconId="fr-icon-home-4-line">
        Revenir à l'accueil
      </Button>
    </>
  );
}
