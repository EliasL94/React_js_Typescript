import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { Header } from '@codegouvfr/react-dsfr/Header';
import { Footer } from '@codegouvfr/react-dsfr/Footer';


function App() {
  return (
    <>
      <Header
        brandTop={<>République<br />Française</>}
        homeLinkProps={{
          href: '/',
          title: 'Accueil - Communle'
        }}
        id="header"

        serviceTitle="Communle"
        serviceTagline="Le jeu quotidien des communes de France"
      />
      <main id="content" role="main">
        {/* Bandeau pédagogique exigé par le sujet (US C3) */}
        <div className="fr-notice fr-notice--info">
          <div className="fr-container">
            <div className="fr-notice__body">
              <p className="fr-notice__title">
                Projet pédagogique, ne constitue pas un service officiel.
              </p>
            </div>
          </div>
        </div>

        <div className="fr-container fr-mt-4w fr-mb-4w">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </main>
      <Footer
        accessibility="fully compliant"
        brandTop={<>République<br />Française</>}
        homeLinkProps={{
          href: '/',
          title: 'Accueil - Communle'
        }}
      />
    </>
  );
}

export default App;
