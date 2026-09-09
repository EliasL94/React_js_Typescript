import { Display, headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display';
import { Footer } from '@codegouvfr/react-dsfr/Footer';
import { fr } from '@codegouvfr/react-dsfr/fr';
import { Header } from '@codegouvfr/react-dsfr/Header';
import { Notice } from '@codegouvfr/react-dsfr/Notice';
import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks';
import { Outlet } from 'react-router-dom';

const BRAND_TOP = (
  <>
    RÉPUBLIQUE
    <br />
    FRANÇAISE
  </>
);

const LIEN_ACCUEIL = { to: '/', title: 'Accueil — Communle' };

export function Layout() {
  return (
    <>
      <SkipLinks
        links={[
          { label: 'Contenu', anchor: '#contenu' },
          { label: 'Pied de page', anchor: '#pied-de-page' },
        ]}
      />

      <Header
        brandTop={BRAND_TOP}
        homeLinkProps={LIEN_ACCUEIL}
        serviceTitle="Communle"
        serviceTagline="Trouvez la commune mystère du jour"
        quickAccessItems={[headerFooterDisplayItem]}
      />

      <Notice
        title="Projet pédagogique — ne constitue pas un service officiel."
        severity="info"
      />

      <main id="contenu" className={fr.cx('fr-container', 'fr-py-6w')}>
        <Outlet />
      </main>

      <Footer
        id="pied-de-page"
        accessibility="non compliant"
        brandTop={BRAND_TOP}
        homeLinkProps={LIEN_ACCUEIL}
        contentDescription="Communle est un projet pédagogique de L3 construit sur les API ouvertes de l'État. Les données proviennent de geo.api.gouv.fr."
        bottomItems={[headerFooterDisplayItem]}
      />

      <Display />
    </>
  );
}
