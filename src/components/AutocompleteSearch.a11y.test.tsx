import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import AutocompleteSearch from './AutocompleteSearch';

const communes = [
  { nom: 'Paris', code: '75056', population: 2103778, departement: { code: '75', nom: 'Paris' } },
  { nom: 'Parisot', code: '81201', population: 200, departement: { code: '81', nom: 'Tarn' } },
  { nom: 'Parigné', code: '35216', population: 800, departement: { code: '35', nom: 'Ille-et-Vilaine' } },
];

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => communes })),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function taper() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

async function avancer(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function ouvrirLaListe(utilisateur: ReturnType<typeof taper>) {
  await utilisateur.keyboard('Paris');
  await avancer(400);
  return screen.findByRole('listbox');
}

describe('US C4 : accessibilité clavier', () => {
  // Preuve : parcourir le service entièrement à la touche Tab, sans jamais
  // toucher la souris.
  it('donne le focus au champ à la tabulation, sans souris', async () => {
    const utilisateur = taper();
    render(<AutocompleteSearch onSelect={() => {}} />);

    await utilisateur.tab();

    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('parcourt les propositions aux flèches et sélectionne à Entrée', async () => {
    const choisies: string[] = [];
    const utilisateur = taper();
    render(<AutocompleteSearch onSelect={(c) => choisies.push(c.nom)} />);

    await utilisateur.tab();
    await ouvrirLaListe(utilisateur);

    await utilisateur.keyboard('{ArrowDown}{ArrowDown}');
    await utilisateur.keyboard('{Enter}');

    expect(choisies).toEqual(['Parisot']);
  });

  it('remonte à la dernière option quand on monte depuis la première', async () => {
    const utilisateur = taper();
    render(<AutocompleteSearch onSelect={() => {}} />);

    await utilisateur.tab();
    await ouvrirLaListe(utilisateur);

    await utilisateur.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  // Preuve : le focus est visible à chaque étape et ne disparaît jamais
  // derrière un élément.
  it('garde le focus sur le champ et désigne l’option active par aria-activedescendant', async () => {
    const utilisateur = taper();
    render(<AutocompleteSearch onSelect={() => {}} />);

    await utilisateur.tab();
    await ouvrirLaListe(utilisateur);
    await utilisateur.keyboard('{ArrowDown}');

    const champ = screen.getByRole('combobox');
    const optionActive = screen.getAllByRole('option')[0];

    expect(champ).toHaveFocus();
    expect(champ).toHaveAttribute('aria-activedescendant', optionActive.id);
    expect(optionActive).toHaveAttribute('aria-selected', 'true');
    expect(optionActive.className).toContain('autocomplete-option--active');
  });

  it('referme la liste à Échap sans quitter le champ', async () => {
    const utilisateur = taper();
    render(<AutocompleteSearch onSelect={() => {}} />);

    await utilisateur.tab();
    await ouvrirLaListe(utilisateur);

    await utilisateur.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('annonce l’état de la liste au lecteur d’écran', async () => {
    const utilisateur = taper();
    render(<AutocompleteSearch onSelect={() => {}} />);

    const champ = screen.getByRole('combobox');
    expect(champ).toHaveAttribute('aria-expanded', 'false');

    await utilisateur.tab();
    const liste = await ouvrirLaListe(utilisateur);

    expect(champ).toHaveAttribute('aria-expanded', 'true');
    expect(champ).toHaveAttribute('aria-controls', liste.id);
    expect(liste).toHaveAccessibleName('Communes proposées');
  });

  // Preuve : au moins un test automatisé vérifie l'accessibilité d'un écran.
  it('ne présente aucune violation axe, liste ouverte', async () => {
    const utilisateur = taper();
    const { container } = render(<AutocompleteSearch onSelect={() => {}} />);

    await utilisateur.tab();
    await ouvrirLaListe(utilisateur);
    await utilisateur.keyboard('{ArrowDown}');

    // Le contraste est désactivé sciemment : axe le mesure en peignant sur un
    // canvas, que JSDOM n'implémente pas. Le laisser actif ne vérifierait rien
    // tout en laissant croire le contraire ; il se contrôle dans le navigateur.
    const resultat = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(resultat.violations).toEqual([]);
  });
});
