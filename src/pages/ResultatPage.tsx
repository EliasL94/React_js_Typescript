import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { ButtonsGroup } from '@codegouvfr/react-dsfr/ButtonsGroup';
import { fr } from '@codegouvfr/react-dsfr/fr';
import { useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router-dom';
import { decrireCommune } from '../domain/format';
import { lireResultat, NB_ESSAIS_MAX } from '../domain/partie';
import { useTitreDocument } from '../hooks/useTitreDocument';
import type { DonneesResultat } from '../routes';

export function ResultatPage() {
  const { commune } = useLoaderData() as DonneesResultat;
  const [searchParams] = useSearchParams();
  const [lienCopie, setLienCopie] = useState(false);

  const resultat = lireResultat(searchParams);

  useTitreDocument(commune.nom);

  async function copierLeLien() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLienCopie(true);
    } catch {
      setLienCopie(false);
    }
  }

  return (
    <>
      <div className={fr.cx('fr-mb-2w')}>
        {resultat === null ? (
          <Badge severity="info">Fiche consultée hors partie</Badge>
        ) : (
          <Badge severity={resultat.statut === 'gagne' ? 'success' : 'error'}>
            {resultat.statut === 'gagne' ? 'Partie gagnée' : 'Partie perdue'}
          </Badge>
        )}
      </div>

      <h1>{commune.nom}</h1>

      <p className={fr.cx('fr-text--lead')}>
        {resultat === null
          ? "Vous consultez cette fiche sans avoir joué la partie correspondante."
          : resultat.statut === 'gagne'
            ? `Trouvée en ${resultat.essais} essai${resultat.essais > 1 ? 's' : ''} sur ${NB_ESSAIS_MAX}.`
            : `Non trouvée après ${NB_ESSAIS_MAX} essais. La réponse était ${commune.nom}.`}
      </p>

      <dl className={fr.cx('fr-mb-4w')}>
        {decrireCommune(commune).map(({ terme, valeur }) => (
          <div key={terme} className={fr.cx('fr-mb-1w')}>
            <dt className={fr.cx('fr-text--sm', 'fr-mb-0')}>{terme}</dt>
            <dd className={fr.cx('fr-text--bold', 'fr-ml-0')}>{valeur}</dd>
          </div>
        ))}
      </dl>

      <ButtonsGroup
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: 'Rejouer',
            linkProps: { to: '/' },
            iconId: 'fr-icon-refresh-line',
          },
          {
            children: lienCopie ? 'Lien copié' : 'Copier le lien',
            priority: 'secondary',
            iconId: lienCopie ? 'fr-icon-check-line' : 'fr-icon-links-line',
            onClick: copierLeLien,
          },
        ]}
      />
    </>
  );
}
