import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const PARIS = {
  nom: 'Paris',
  code: '75056',
  codesPostaux: ['75001', '75002'],
  population: 2103778,
  centre: { type: 'Point', coordinates: [2.347, 48.8589] },
  departement: { code: '75', nom: 'Paris' },
  region: { code: '11', nom: 'Île-de-France' },
};

function bouchonnerApiGeo() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.includes('/communes/75056')
        ? { ok: true, status: 200, json: async () => PARIS }
        : { ok: false, status: 404 },
    ),
  );
}

function afficher(cheminInitial: string) {
  const router = createMemoryRouter(routes, { initialEntries: [cheminInitial] });
  return { ...render(<RouterProvider router={router} />), router };
}

beforeEach(() => {
  bouchonnerApiGeo();
  document.title = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("critères d'acceptance US A2", () => {
  it('affiche la fiche et le score à partir de la seule URL', async () => {
    afficher('/partie/75056?statut=gagne&essais=4');

    expect(await screen.findByRole('heading', { level: 1, name: 'Paris' })).toBeVisible();
    expect(screen.getByText('Partie gagnée')).toBeVisible();
    expect(screen.getByText(/Trouvée en 4 essais sur 6/)).toBeVisible();
    expect(screen.getByText('Paris (75)')).toBeVisible();
    expect(screen.getByText('Île-de-France (11)')).toBeVisible();
  });

  it('affiche la page 404 pour un code INSEE inexistant', async () => {
    afficher('/partie/99999');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page introuvable' }),
    ).toBeVisible();
    expect(screen.getByText('Erreur 404')).toBeVisible();

    const contenu = document.querySelector('#contenu');
    expect(contenu).not.toBeNull();
    expect(contenu?.textContent?.trim()).not.toBe('');
  });

  it('affiche la page 404 pour un code INSEE mal formé, sans appeler le réseau', async () => {
    afficher('/partie/pas-un-code');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page introuvable' }),
    ).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('affiche la page 404 pour une route inconnue', async () => {
    afficher('/une-page-qui-nexiste-pas');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page introuvable' }),
    ).toBeVisible();
  });

  it('change le titre du document à chaque navigation', async () => {
    const utilisateur = userEvent.setup();
    afficher('/');

    await waitFor(() => expect(document.title).toBe('Accueil — Communle'));

    await utilisateur.click(
      screen.getByRole('link', { name: /Voir un écran de fin de partie/ }),
    );

    await waitFor(() => expect(document.title).toBe('Paris — Communle'));
  });

  it('donne son propre titre à la page 404', async () => {
    afficher('/partie/99999');

    await waitFor(() => expect(document.title).toBe('Page introuvable — Communle'));
  });
});

describe('écran de fin de partie', () => {
  it('ramène à l’accueil depuis le bouton Rejouer', async () => {
    const utilisateur = userEvent.setup();
    const { router } = afficher('/partie/75056?statut=gagne&essais=4');

    await screen.findByRole('heading', { level: 1, name: 'Paris' });
    await utilisateur.click(screen.getByRole('link', { name: /Rejouer/ }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Communle' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/');
  });

  it('annonce une partie perdue', async () => {
    afficher('/partie/75056?statut=perdu&essais=6');

    expect(await screen.findByText('Partie perdue')).toBeVisible();
    expect(screen.getByText(/La réponse était Paris/)).toBeVisible();
  });

  it('bascule en consultation quand le score est absent ou aberrant', async () => {
    afficher('/partie/75056?statut=gagne&essais=99');

    expect(await screen.findByRole('heading', { level: 1, name: 'Paris' })).toBeVisible();
    expect(screen.getByText('Fiche consultée hors partie')).toBeVisible();
    expect(screen.queryByText('Partie gagnée')).toBeNull();
  });

  it('affiche « Non renseigné » plutôt qu’undefined sur une fiche incomplète', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ nom: 'Bidon', code: '75056' }),
      })),
    );

    afficher('/partie/75056');

    expect(await screen.findByRole('heading', { level: 1, name: 'Bidon' })).toBeVisible();
    expect(screen.getAllByText('Non renseigné').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain('undefined');
  });

  it('annonce le chargement avant l’arrivée de la fiche', async () => {
    let resoudre: (valeur: unknown) => void = () => {};
    const enAttente = new Promise((resolve) => {
      resoudre = resolve;
    });
    vi.stubGlobal('fetch', vi.fn(() => enAttente));

    afficher('/partie/75056');

    expect(screen.getByRole('status')).toHaveTextContent(/Chargement/);

    resoudre({ ok: true, status: 200, json: async () => PARIS });
    expect(await screen.findByRole('heading', { level: 1, name: 'Paris' })).toBeVisible();
  });

  it('affiche un écran d’erreur réessayable quand l’API tombe', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500 })),
    );

    afficher('/partie/75056');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Service indisponible' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /Réessayer/ })).toBeEnabled();
    expect(screen.queryByText(/500/)).toBeNull();
  });

  it('recharge la fiche quand on réessaie après le rétablissement du réseau', async () => {
    const utilisateur = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValue({ ok: true, status: 200, json: async () => PARIS });
    vi.stubGlobal('fetch', fetchMock);

    afficher('/partie/75056');

    await screen.findByRole('heading', { level: 1, name: 'Service indisponible' });
    await utilisateur.click(screen.getByRole('button', { name: /Réessayer/ }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Paris' })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('copie l’URL de la fiche dans le presse-papiers', async () => {
    const utilisateur = userEvent.setup();
    afficher('/partie/75056?statut=gagne&essais=4');

    await screen.findByRole('heading', { level: 1, name: 'Paris' });
    await utilisateur.click(screen.getByRole('button', { name: /Copier le lien/ }));

    expect(await screen.findByRole('button', { name: /Lien copié/ })).toBeVisible();
    await expect(navigator.clipboard.readText()).resolves.toBe(window.location.href);
  });

  it('ne signale pas d’erreur si le presse-papiers est refusé', async () => {
    const utilisateur = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('Write permission denied.'),
    );

    afficher('/partie/75056?statut=gagne&essais=4');

    await screen.findByRole('heading', { level: 1, name: 'Paris' });
    await utilisateur.click(screen.getByRole('button', { name: /Copier le lien/ }));

    expect(screen.getByRole('button', { name: /Copier le lien/ })).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('socle DSFR', () => {
  it('affiche le bandeau pédagogique sur la fiche comme sur la 404', async () => {
    const mention = /ne constitue pas un service officiel/;

    const { unmount } = afficher('/partie/75056');
    await screen.findByRole('heading', { level: 1, name: 'Paris' });
    expect(screen.getByText(mention)).toBeVisible();
    unmount();

    afficher('/partie/99999');
    await screen.findByRole('heading', { level: 1, name: 'Page introuvable' });
    expect(screen.getByText(mention)).toBeVisible();
  });

  it('expose les liens d’évitement et le pied de page', async () => {
    afficher('/');

    await screen.findByRole('heading', { level: 1, name: 'Communle' });

    const evitement = screen.getByRole('navigation', { name: /Accès rapide/i });
    expect(within(evitement).getByRole('link', { name: 'Contenu' })).toHaveAttribute(
      'href',
      '#contenu',
    );

    expect(document.querySelector('#pied-de-page')).not.toBeNull();
  });
});
