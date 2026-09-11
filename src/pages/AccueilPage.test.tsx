import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../routes';

vi.mock('../domain/game', async () => {
  const reel = await vi.importActual<typeof import('../domain/game')>('../domain/game');
  return { ...reel, getMysteryCommuneInsee: vi.fn(() => '75056') };
});

const PARIS = {
  nom: 'Paris',
  code: '75056',
  population: 2103778,
  centre: { type: 'Point', coordinates: [2.347, 48.8589] },
  departement: { code: '75', nom: 'Paris' },
};

const LYON = {
  nom: 'Lyon',
  code: '69123',
  population: 519127,
  centre: { type: 'Point', coordinates: [4.8351, 45.758] },
  departement: { code: '69', nom: 'Rhône' },
};

function afficher(chemin: string) {
  const router = createMemoryRouter(routes, { initialEntries: [chemin] });
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('robustesse de l’accueil', () => {
  // US B5 : couper le réseau ne doit pas laisser un spinner infini.
  it('affiche une erreur réessayable quand la commune du jour ne charge pas', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));

    afficher('/');

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.queryByText(/Chargement du jeu/)).toBeNull();
    expect(screen.getByRole('button', { name: /Réessayer/ })).toBeEnabled();
  });

  it('ne montre jamais de code HTTP brut à l’usager', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));

    afficher('/');

    await screen.findByRole('alert');
    expect(document.body.textContent).not.toContain('503');
  });

  // Une seule commune d'historique en échec ne doit pas emporter la page.
  it('survit à un code inexistant dans l’historique de l’URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/communes/75056')) {
          return { ok: true, status: 200, json: async () => PARIS };
        }
        if (url.includes('/communes/69123')) {
          return { ok: true, status: 200, json: async () => LYON };
        }
        return { ok: false, status: 404 };
      }),
    );

    afficher('/?history=69123,99999');

    expect(await screen.findByRole('table')).toBeVisible();
    expect(screen.getByRole('row', { name: /Lyon/ })).toBeVisible();
    expect(screen.queryByText(/Récupération de l’historique/)).toBeNull();
  });

  it('n’entre pas en boucle de requêtes quand une commune de l’historique échoue', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('/communes/75056')
        ? { ok: true, status: 200, json: async () => PARIS }
        : { ok: false, status: 404 },
    );
    vi.stubGlobal('fetch', fetchMock);

    afficher('/?history=99999');

    await screen.findByRole('heading', { level: 1, name: 'Communle' });
    await new Promise((r) => setTimeout(r, 300));

    expect(fetchMock.mock.calls.length).toBeLessThan(10);
  });
});
