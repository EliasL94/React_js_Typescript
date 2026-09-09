import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { ButtonsGroup } from '@codegouvfr/react-dsfr/ButtonsGroup';
import { useRevalidator } from 'react-router-dom';
import { useTitreDocument } from '../hooks/useTitreDocument';

export function ErreurPage() {
  const { revalidate, state } = useRevalidator();

  useTitreDocument('Service indisponible');

  return (
    <>
      <h1>Service indisponible</h1>

      <Alert
        severity="error"
        title="Les données n'ont pas pu être récupérées"
        description="Le service qui fournit les communes ne répond pas. Vérifiez votre connexion, puis réessayez."
      />

      <ButtonsGroup
        className="fr-mt-4w"
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: state === 'loading' ? 'Nouvelle tentative…' : 'Réessayer',
            iconId: 'fr-icon-refresh-line',
            disabled: state === 'loading',
            onClick: () => {
              void revalidate();
            },
          },
          {
            children: "Revenir à l'accueil",
            priority: 'secondary',
            linkProps: { to: '/' },
          },
        ]}
      />
    </>
  );
}
