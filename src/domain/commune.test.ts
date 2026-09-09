import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiIndisponibleError,
  CommuneIntrouvableError,
  estCodeInseeValide,
  normaliserCommune,
  recupererCommune,
} from './commune';

const PARIS = {
  nom: 'Paris',
  code: '75056',
  codesPostaux: ['75001', '75002', '75003'],
  population: 2103778,
  centre: { type: 'Point', coordinates: [2.347, 48.8589] },
  departement: { code: '75', nom: 'Paris' },
  region: { code: '11', nom: 'Île-de-France' },
};

function bouchonner(reponse: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(reponse);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('estCodeInseeValide', () => {
  it.each(['75056', '01001', '2A004', '2b033', '97401'])('accepte %s', (code) => {
    expect(estCodeInseeValide(code)).toBe(true);
  });

  it.each(['999', '750567', 'abcde', '', '2C004', '75 56'])('refuse %s', (code) => {
    expect(estCodeInseeValide(code)).toBe(false);
  });
});

describe('normaliserCommune', () => {
  it('lit une réponse complète', () => {
    expect(normaliserCommune(PARIS)).toEqual({
      code: '75056',
      nom: 'Paris',
      population: 2103778,
      codesPostaux: ['75001', '75002', '75003'],
      departement: { code: '75', nom: 'Paris' },
      region: { code: '11', nom: 'Île-de-France' },
      centre: { latitude: 48.8589, longitude: 2.347 },
    });
  });

  it.each([
    ['un objet vide', {}],
    ['null', null],
    ['undefined', undefined],
    ['une chaîne', 'pas un objet'],
    ['un tableau', []],
    ['des champs à null', { nom: null, code: null, population: null, centre: null }],
  ])('ne lève pas sur %s', (_libelle, entree) => {
    expect(() => normaliserCommune(entree)).not.toThrow();
  });

  it('remplace les champs absents par null ou un tableau vide', () => {
    expect(normaliserCommune({})).toEqual({
      code: '',
      nom: '',
      population: null,
      codesPostaux: [],
      departement: null,
      region: null,
      centre: null,
    });
  });

  it('rejette une division amputée de son nom', () => {
    expect(normaliserCommune({ departement: { code: '75' } }).departement).toBeNull();
  });

  it('rejette un centre sans coordonnées exploitables', () => {
    expect(normaliserCommune({ centre: { type: 'Point' } }).centre).toBeNull();
    expect(
      normaliserCommune({ centre: { type: 'Point', coordinates: ['a', 'b'] } }).centre,
    ).toBeNull();
  });

  it('écarte les codes postaux qui ne sont pas des chaînes', () => {
    expect(normaliserCommune({ codesPostaux: ['75001', null, 42] }).codesPostaux).toEqual([
      '75001',
    ]);
  });

  it('traite une population non finie comme absente', () => {
    expect(normaliserCommune({ population: Number.NaN }).population).toBeNull();
  });
});

describe('recupererCommune', () => {
  it('appelle geo.api.gouv.fr et rend une commune normalisée', async () => {
    const fetchMock = bouchonner({
      ok: true,
      status: 200,
      json: async () => PARIS,
    });

    const commune = await recupererCommune('75056');

    expect(commune.nom).toBe('Paris');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://geo.api.gouv.fr/communes/75056'),
      expect.anything(),
    );
  });

  it('transmet le signal d’annulation', async () => {
    const fetchMock = bouchonner({ ok: true, status: 200, json: async () => PARIS });
    const signal = new AbortController().signal;

    await recupererCommune('75056', { signal });

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { signal });
  });

  it('refuse un code mal formé sans appeler le réseau', async () => {
    const fetchMock = bouchonner({ ok: true, status: 200, json: async () => PARIS });

    await expect(recupererCommune('abc')).rejects.toBeInstanceOf(CommuneIntrouvableError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('traduit un 404 en CommuneIntrouvableError', async () => {
    bouchonner({ ok: false, status: 404 });

    await expect(recupererCommune('99999')).rejects.toBeInstanceOf(
      CommuneIntrouvableError,
    );
  });

  it('traduit un 500 en ApiIndisponibleError', async () => {
    bouchonner({ ok: false, status: 500 });

    await expect(recupererCommune('75056')).rejects.toBeInstanceOf(ApiIndisponibleError);
  });

  it('traduit une panne réseau en ApiIndisponibleError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(recupererCommune('75056')).rejects.toBeInstanceOf(ApiIndisponibleError);
  });

  it('laisse remonter une annulation de navigation', async () => {
    const abort = new DOMException('The user aborted a request.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));

    await expect(recupererCommune('75056')).rejects.toBe(abort);
  });

  it('traduit un corps illisible en ApiIndisponibleError', async () => {
    bouchonner({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    await expect(recupererCommune('75056')).rejects.toBeInstanceOf(ApiIndisponibleError);
  });
});
