import { fr } from '@codegouvfr/react-dsfr/fr';

export function ChargementPage() {
  return (
    <div role="status" className={fr.cx('fr-py-6w')}>
      <p className={fr.cx('fr-text--lead', 'fr-mb-0')}>Chargement de la fiche…</p>
    </div>
  );
}
