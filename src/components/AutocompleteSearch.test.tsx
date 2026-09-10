import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AutocompleteSearch from './AutocompleteSearch';

const commune = (nom: string, code: string) => ({
  nom,
  code,
  population: 1000,
  centre: { type: 'Point', coordinates: [0, 0] },
  departement: { code: '75', nom: 'Paris' },
});

function reponse(communes: unknown[]) {
  return { ok: true, status: 200, json: async () => communes };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function taper(): ReturnType<typeof userEvent.setup> {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

// Le rebond puis la résolution du fetch déclenchent des mises à jour d'état :
// sans act(), React les signale comme non encadrées et pollue la sortie.
async function avancer(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('US C1 : frappe et annulation', () => {
  // Preuve : taper dix caractères rapidement déclenche une poignée de requêtes,
  // pas dix.
  it('ne lance pas une requête par frappe', async () => {
    const fetchMock = vi.fn(async () => reponse([commune('Paris', '75056')]));
    vi.stubGlobal('fetch', fetchMock);
    const utilisateur = taper();

    render(<AutocompleteSearch onSelect={() => {}} />);
    await utilisateur.type(screen.getByRole('textbox'), 'Villeurban');

    await avancer(400);

    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
  });

  // Preuve : les requêtes obsolètes apparaissent annulées.
  it('annule la requête en vol quand la frappe continue', async () => {
    const signaux: AbortSignal[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { signal: AbortSignal }) => {
        signaux.push(init.signal);
        return reponse([]);
      }),
    );
    const utilisateur = taper();

    render(<AutocompleteSearch onSelect={() => {}} />);
    const champ = screen.getByRole('textbox');

    await utilisateur.type(champ, 'Pa');
    await avancer(350);
    await utilisateur.type(champ, 'ris');
    await avancer(350);

    expect(signaux.length).toBeGreaterThanOrEqual(2);
    expect(signaux[0].aborted).toBe(true);
    expect(signaux[signaux.length - 1].aborted).toBe(false);
  });

  // Preuve : une réponse lente arrivée en retard n'écrase jamais un résultat
  // plus récent.
  it('jette une réponse périmée qui arrive après une plus récente', async () => {
    let resoudreLente: (v: unknown) => void = () => {};
    const lente = new Promise((r) => {
      resoudreLente = r;
    });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => lente)
      .mockImplementation(async () => reponse([commune('Rapide', '99999')]));
    vi.stubGlobal('fetch', fetchMock);
    const utilisateur = taper();

    render(<AutocompleteSearch onSelect={() => {}} />);
    const champ = screen.getByRole('textbox');

    await utilisateur.type(champ, 'Pa');
    await avancer(350);
    await utilisateur.type(champ, 'ris');
    await avancer(350);

    await waitFor(() => expect(screen.getByText(/Rapide/)).toBeVisible());

    resoudreLente(reponse([commune('Perimee', '11111')]));
    await avancer(50);

    expect(screen.queryByText(/Perimee/)).toBeNull();
    expect(screen.getByText(/Rapide/)).toBeVisible();
  });

  it('n’interroge pas le réseau sous deux caractères', async () => {
    const fetchMock = vi.fn(async () => reponse([]));
    vi.stubGlobal('fetch', fetchMock);
    const utilisateur = taper();

    render(<AutocompleteSearch onSelect={() => {}} />);
    await utilisateur.type(screen.getByRole('textbox'), 'P');
    await avancer(400);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // US B5 : une panne affiche un message honnête, sans code HTTP brut.
  it('affiche un message honnête quand l’API tombe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
    const utilisateur = taper();

    render(<AutocompleteSearch onSelect={() => {}} />);
    await utilisateur.type(screen.getByRole('textbox'), 'Paris');
    await avancer(400);

    expect(await screen.findByText(/La recherche n’a pas abouti/)).toBeVisible();
    expect(screen.queryByText(/503/)).toBeNull();
  });

  it('rend une commune sans département sans écrire undefined', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => reponse([{ nom: 'Amputée', code: '00001' }])),
    );
    const utilisateur = taper();

    render(<AutocompleteSearch onSelect={() => {}} />);
    await utilisateur.type(screen.getByRole('textbox'), 'Amp');
    await avancer(400);

    expect(await screen.findByRole('button', { name: 'Amputée' })).toBeVisible();
    expect(document.body.textContent).not.toContain('undefined');
  });
});
