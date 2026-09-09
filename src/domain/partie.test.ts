import { describe, expect, it } from 'vitest';
import {
  construireCheminResultat,
  lireResultat,
  NB_ESSAIS_MAX,
  type ResultatPartie,
} from './partie';

const query = (chaine: string) => new URLSearchParams(chaine);

describe('lireResultat', () => {
  it('lit une partie gagnée', () => {
    expect(lireResultat(query('statut=gagne&essais=4'))).toEqual({
      statut: 'gagne',
      essais: 4,
    });
  });

  it('lit une partie perdue au dernier essai', () => {
    expect(lireResultat(query(`statut=perdu&essais=${NB_ESSAIS_MAX}`))).toEqual({
      statut: 'perdu',
      essais: NB_ESSAIS_MAX,
    });
  });

  it.each([
    ['query vide', ''],
    ['statut seul', 'statut=gagne'],
    ['essais seul', 'essais=3'],
    ['statut inconnu', 'statut=nul&essais=3'],
    ['essais à zéro', 'statut=gagne&essais=0'],
    ['essais au-dessus du maximum', 'statut=gagne&essais=99'],
    ['essais négatif', 'statut=gagne&essais=-1'],
    ['essais décimal', 'statut=gagne&essais=3.5'],
    ['essais non numérique', 'statut=gagne&essais=beaucoup'],
    ['essais en notation exponentielle', 'statut=gagne&essais=4e0'],
  ])('rend null pour %s', (_libelle, chaine) => {
    expect(lireResultat(query(chaine))).toBeNull();
  });
});

describe('construireCheminResultat', () => {
  it('construit un chemin sans score', () => {
    expect(construireCheminResultat('75056')).toBe('/partie/75056');
  });

  it('construit un chemin avec score', () => {
    expect(construireCheminResultat('75056', { statut: 'gagne', essais: 4 })).toBe(
      '/partie/75056?statut=gagne&essais=4',
    );
  });

  it('fait l’aller-retour avec lireResultat', () => {
    const resultat: ResultatPartie = { statut: 'perdu', essais: 6 };
    const chemin = construireCheminResultat('2A004', resultat);

    expect(lireResultat(new URL(chemin, 'https://exemple.fr').searchParams)).toEqual(
      resultat,
    );
  });
});
