import { describe, expect, it } from 'vitest';
import { normaliserCommune } from './commune';
import {
  decrireCommune,
  formaterCodesPostaux,
  formaterCoordonnees,
  formaterDivision,
  formaterLibelle,
  formaterPopulation,
  MENTION_ABSENTE,
} from './format';

describe('formaterLibelle', () => {
  it('rend la valeur telle quelle', () => {
    expect(formaterLibelle('Paris')).toBe('Paris');
  });

  it.each([null, undefined, '', '   '])('rend la mention pour %o', (valeur) => {
    expect(formaterLibelle(valeur)).toBe(MENTION_ABSENTE);
  });
});

describe('formaterPopulation', () => {
  it('sépare les milliers à la française', () => {
    expect(formaterPopulation(2103778).replace(/\s/g, ' ')).toBe('2 103 778 habitants');
  });

  it('accorde le singulier', () => {
    expect(formaterPopulation(1)).toBe('1 habitant');
  });

  it('affiche une commune sans habitant', () => {
    expect(formaterPopulation(0)).toBe('0 habitant');
  });

  it('rend la mention quand la population manque', () => {
    expect(formaterPopulation(null)).toBe(MENTION_ABSENTE);
  });
});

describe('formaterCodesPostaux', () => {
  it('liste les codes', () => {
    expect(formaterCodesPostaux(['75001', '75002'])).toBe('75001, 75002');
  });

  it('résume au-delà de cinq codes', () => {
    const codes = ['1', '2', '3', '4', '5', '6', '7'];
    expect(formaterCodesPostaux(codes)).toBe('1, 2, 3, 4, 5 et 2 autres');
  });

  it('rend la mention pour une liste vide', () => {
    expect(formaterCodesPostaux([])).toBe(MENTION_ABSENTE);
  });
});

describe('formaterDivision', () => {
  it('accole le code au nom', () => {
    expect(formaterDivision({ code: '75', nom: 'Paris' })).toBe('Paris (75)');
  });

  it('rend la mention pour une division absente', () => {
    expect(formaterDivision(null)).toBe(MENTION_ABSENTE);
  });
});

describe('formaterCoordonnees', () => {
  it('arrondit à quatre décimales', () => {
    expect(formaterCoordonnees({ latitude: 48.8589, longitude: 2.347 })).toBe(
      '48.8589, 2.3470',
    );
  });

  it('rend la mention pour un centre absent', () => {
    expect(formaterCoordonnees(null)).toBe(MENTION_ABSENTE);
  });
});

describe('decrireCommune', () => {
  it('décrit une commune vide sans laisser passer undefined', () => {
    const lignes = decrireCommune(normaliserCommune({}));

    expect(lignes).toHaveLength(6);
    for (const ligne of lignes) {
      expect(ligne.valeur).toBe(MENTION_ABSENTE);
      expect(ligne.valeur).not.toContain('undefined');
    }
  });

  it('décrit une commune complète', () => {
    const lignes = decrireCommune(
      normaliserCommune({
        code: '75056',
        nom: 'Paris',
        population: 2103778,
        codesPostaux: ['75001'],
        departement: { code: '75', nom: 'Paris' },
        region: { code: '11', nom: 'Île-de-France' },
        centre: { type: 'Point', coordinates: [2.347, 48.8589] },
      }),
    );

    expect(lignes.map((ligne) => ligne.terme)).toEqual([
      'Code INSEE',
      'Département',
      'Région',
      'Population',
      'Codes postaux',
      'Coordonnées',
    ]);
    expect(lignes[0].valeur).toBe('75056');
    expect(lignes[1].valeur).toBe('Paris (75)');
  });
});
