import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { routes } from '../routes';

// La page des règles est purement statique : aucun appel réseau ne doit en
// partir. Le bouchon sert de garde-fou, pas de source de données.
const fetchBouchon = vi.fn(async () => ({ ok: false, status: 404 }));

beforeEach(() => {
  vi.stubGlobal('fetch', fetchBouchon);
  fetchBouchon.mockClear();
  document.title = '';
});

function afficher(chemin = '/regles') {
  const router = createMemoryRouter(routes, { initialEntries: [chemin] });
  return render(<RouterProvider router={router} />);
}

const OPTIONS_AXE = { rules: { 'color-contrast': { enabled: false } } };

describe('Page « règles » (attendu minimal du sujet A)', () => {
  it('s’atteint par son adresse propre', async () => {
    afficher();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Règles du jeu' }),
    ).toBeVisible();
  });

  it('énonce le déroulé, le nombre d’essais et les trois indices', async () => {
    afficher();
    await screen.findByRole('heading', { level: 1, name: 'Règles du jeu' });

    const contenu = screen.getByRole('main');

    expect(contenu).toHaveTextContent(/6 essais/);

    const termes = [...contenu.querySelectorAll('dt')].map((dt) => dt.textContent);
    expect(termes).toEqual(['Distance', 'Direction', 'Population']);
  });

  it('change le titre de l’onglet', async () => {
    afficher();
    await screen.findByRole('heading', { level: 1, name: 'Règles du jeu' });

    expect(document.title).toBe('Règles du jeu — Communle');
  });

  it('n’interroge aucune API', async () => {
    afficher();
    await screen.findByRole('heading', { level: 1, name: 'Règles du jeu' });

    expect(fetchBouchon).not.toHaveBeenCalled();
  });

  it('se déplie au clavier sans souris', async () => {
    const utilisateur = userEvent.setup();
    afficher();
    await screen.findByRole('heading', { level: 1, name: 'Règles du jeu' });

    const depliant = screen.getByRole('button', {
      name: /même pour tout le monde/i,
    });

    expect(depliant).toHaveAttribute('aria-expanded', 'false');
    depliant.focus();
    await utilisateur.keyboard('{Enter}');
    expect(depliant).toHaveAttribute('aria-expanded', 'true');
  });

  it('ramène au jeu', async () => {
    afficher();
    await screen.findByRole('heading', { level: 1, name: 'Règles du jeu' });

    expect(screen.getByRole('link', { name: /revenir au jeu/i })).toHaveAttribute(
      'href',
      '/',
    );
  });

  // Preuve US C4 : au moins un test automatisé vérifie l'accessibilité d'un écran.
  it('ne présente aucune violation axe', async () => {
    const { container } = afficher();
    await screen.findByRole('heading', { level: 1, name: 'Règles du jeu' });

    expect((await axe(container, OPTIONS_AXE)).violations).toEqual([]);
  });
});
