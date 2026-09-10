import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { routes } from './routes';

vi.mock('./domain/game', async () => {
  const reel = await vi.importActual<typeof import('./domain/game')>('./domain/game');
  return { ...reel, getMysteryCommuneInsee: vi.fn(() => '75056') };
});

const PARIS = {
  nom: 'Paris',
  code: '75056',
  codesPostaux: ['75001'],
  population: 2103778,
  centre: { type: 'Point', coordinates: [2.347, 48.8589] },
  departement: { code: '75', nom: 'Paris' },
  region: { code: '11', nom: 'Île-de-France' },
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.includes('/communes/75056')
        ? { ok: true, status: 200, json: async () => PARIS }
        : { ok: false, status: 404 },
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function afficher(chemin: string) {
  const router = createMemoryRouter(routes, { initialEntries: [chemin] });
  return render(<RouterProvider router={router} />);
}

// Le contraste est désactivé sciemment : axe le mesure en peignant sur un
// canvas, que JSDOM n'implémente pas.
const OPTIONS_AXE = { rules: { 'color-contrast': { enabled: false } } };

describe('US C4 : accessibilité des écrans', () => {
  it('l’écran de fin de partie ne présente aucune violation axe', async () => {
    const { container } = afficher('/partie/75056?statut=gagne&essais=4');

    await screen.findByRole('heading', { level: 1, name: 'Paris' });

    expect((await axe(container, OPTIONS_AXE)).violations).toEqual([]);
  });

  it('la page 404 ne présente aucune violation axe', async () => {
    const { container } = afficher('/partie/99999');

    await screen.findByRole('heading', { level: 1, name: 'Page introuvable' });

    expect((await axe(container, OPTIONS_AXE)).violations).toEqual([]);
  });

  it('le socle expose ses liens d’évitement en premier', async () => {
    afficher('/partie/75056');

    await screen.findByRole('heading', { level: 1, name: 'Paris' });

    const evitement = screen.getByRole('navigation', { name: /Accès rapide/i });
    const premierLien = document.querySelector<HTMLAnchorElement>('a[href]');

    expect(evitement).toContainElement(premierLien);
    expect(premierLien).toHaveAttribute('href', '#contenu');
  });
});
