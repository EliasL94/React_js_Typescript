import { describe, expect, it } from 'vitest';
import { normaliserCommune, type Commune } from './commune';
import {
  calculateDistance,
  compareCommunes,
  estTrouvee,
  getDirection,
  COMMUNES_DU_TIRAGE,
  getMysteryCommuneInsee,
} from './game';

const geo = (longitude: number, latitude: number) => ({
  type: 'Point',
  coordinates: [longitude, latitude],
});

const PARIS: Commune = normaliserCommune({
  nom: 'Paris',
  code: '75056',
  population: 2103778,
  centre: geo(2.347, 48.8589),
  departement: { code: '75', nom: 'Paris' },
});

const LYON: Commune = normaliserCommune({
  nom: 'Lyon',
  code: '69123',
  population: 519127,
  centre: geo(4.8351, 45.758),
  departement: { code: '69', nom: 'Rhône' },
});

const SANS_CENTRE: Commune = normaliserCommune({
  nom: 'Sans centre',
  code: '00001',
  population: 1000,
});

describe('calculateDistance', () => {
  it('mesure Paris–Lyon à quelques kilomètres près', () => {
    expect(calculateDistance(48.8589, 2.347, 45.758, 4.8351)).toBeCloseTo(392, -1);
  });

  it('rend zéro pour deux fois le même point', () => {
    expect(calculateDistance(48.8589, 2.347, 48.8589, 2.347)).toBe(0);
  });

  it('est symétrique', () => {
    expect(calculateDistance(48.8589, 2.347, 45.758, 4.8351)).toBe(
      calculateDistance(45.758, 4.8351, 48.8589, 2.347),
    );
  });
});

describe('getDirection', () => {
  it.each([
    ['Nord', 0, 0, 10, 0],
    ['Sud', 10, 0, 0, 0],
    ['Est', 0, 0, 0, 10],
    ['Ouest', 0, 10, 0, 0],
    ['Nord-Est', 0, 0, 10, 10],
    ['Sud-Ouest', 10, 10, 0, 0],
  ])('trouve %s', (attendu, lat1, lon1, lat2, lon2) => {
    expect(getDirection(lat1, lon1, lat2, lon2)).toBe(attendu);
  });

  it('place Lyon au nord-ouest de Paris vu depuis Lyon', () => {
    expect(getDirection(45.758, 4.8351, 48.8589, 2.347)).toBe('Nord-Ouest');
  });

  it('annonce « Sur place » sous le seuil de proximité, sans emoji', () => {
    const direction = getDirection(48.8589, 2.347, 48.8589, 2.3471);
    expect(direction).toBe('Sur place');
    expect(direction).not.toMatch(/\p{Emoji_Presentation}/u);
  });
});

describe('estTrouvee', () => {
  it('reconnaît la bonne commune', () => {
    expect(estTrouvee(PARIS, PARIS)).toBe(true);
  });

  it('rejette une autre commune', () => {
    expect(estTrouvee(LYON, PARIS)).toBe(false);
  });

  it('ne fait pas correspondre deux communes sans code', () => {
    const sansCode = normaliserCommune({});
    expect(estTrouvee(sansCode, sansCode)).toBe(false);
  });
});

describe('compareCommunes', () => {
  it('décrit une proposition éloignée', () => {
    const indices = compareCommunes(LYON, PARIS);

    expect(indices.distanceKm).toBeCloseTo(392, -1);
    expect(indices.direction).toBe('Nord-Ouest');
    expect(indices.populationGap).toBe('plus');
  });

  it('annonce une cible moins peuplée', () => {
    expect(compareCommunes(PARIS, LYON).populationGap).toBe('moins');
  });

  it('annonce une population égale', () => {
    const a = normaliserCommune({ code: '1', population: 500, centre: geo(0, 0) });
    const b = normaliserCommune({ code: '2', population: 500, centre: geo(1, 1) });
    expect(compareCommunes(a, b).populationGap).toBe('egal');
  });

  // Le cœur du correctif : une distance inconnue ne doit jamais ressembler à zéro,
  // puisque zéro veut dire « trouvée » partout ailleurs dans le jeu.
  it('rend une distance nulle, et non zéro, quand un centre manque', () => {
    const indices = compareCommunes(SANS_CENTRE, PARIS);

    expect(indices.distanceKm).toBeNull();
    expect(indices.distanceKm).not.toBe(0);
    expect(indices.direction).toBeNull();
  });

  it('rend une distance nulle quand c’est la solution qui n’a pas de centre', () => {
    expect(compareCommunes(PARIS, SANS_CENTRE).distanceKm).toBeNull();
  });

  it('garde la comparaison de population même sans centre', () => {
    expect(compareCommunes(SANS_CENTRE, PARIS).populationGap).toBe('plus');
  });

  it('annonce « inconnu » quand une population manque, jamais « egal »', () => {
    const sansPopulation = normaliserCommune({ code: '00002', centre: geo(0, 0) });

    expect(compareCommunes(sansPopulation, PARIS).populationGap).toBe('inconnu');
    expect(compareCommunes(PARIS, sansPopulation).populationGap).toBe('inconnu');
  });

  it('ne lève pas sur deux communes entièrement vides', () => {
    const vide = normaliserCommune({});
    expect(() => compareCommunes(vide, vide)).not.toThrow();
  });
});

/** Les 365 jours d'une année, au format rendu par toISOString(). */
function joursDe(annee: number): string[] {
  const jours: string[] = [];
  const curseur = new Date(Date.UTC(annee, 0, 1));

  while (curseur.getUTCFullYear() === annee) {
    jours.push(curseur.toISOString().split('T')[0]);
    curseur.setUTCDate(curseur.getUTCDate() + 1);
  }

  return jours;
}

const JOURS_2026 = joursDe(2026);
const JOURS_CONSECUTIFS = JOURS_2026.slice(0, -1).map(
  (jour, index) => [jour, JOURS_2026[index + 1]] as const,
);

describe('getMysteryCommuneInsee', () => {
  it('rend toujours la même commune pour une date donnée', () => {
    expect(getMysteryCommuneInsee('2026-09-10')).toBe(getMysteryCommuneInsee('2026-09-10'));
  });

  it('rend un code INSEE bien formé', () => {
    expect(getMysteryCommuneInsee('2026-09-10')).toMatch(/^(?:\d{2}|2[AB])\d{3}$/);
  });

  it('change de commune d’un jour à l’autre', () => {
    expect(getMysteryCommuneInsee('2026-09-10')).not.toBe(
      getMysteryCommuneInsee('2026-09-11'),
    );
  });

  it('reste dans la liste quelle que soit la date', () => {
    for (const jour of ['2026-01-01', '2026-06-15', '2026-12-31', '2027-02-28']) {
      expect(COMMUNES_DU_TIRAGE).toContain(getMysteryCommuneInsee(jour));
    }
  });

  // Les trois cas suivants existent parce que le tirage précédent — une somme
  // des codes de caractères de la date — passait tous les tests ci-dessus tout
  // en étant devinable : deux jours qui se suivaient donnaient deux cases qui
  // se suivaient dans la liste.
  it('ne laisse pas un écart dominer d’un jour au suivant', () => {
    const occurrences = new Map<number, number>();

    for (const [veille, lendemain] of JOURS_CONSECUTIFS) {
      const iVeille = COMMUNES_DU_TIRAGE.indexOf(getMysteryCommuneInsee(veille));
      const iLendemain = COMMUNES_DU_TIRAGE.indexOf(getMysteryCommuneInsee(lendemain));
      const ecart =
        (iLendemain - iVeille + COMMUNES_DU_TIRAGE.length) % COMMUNES_DU_TIRAGE.length;

      occurrences.set(ecart, (occurrences.get(ecart) ?? 0) + 1);
    }

    // Un écart qui revient presque tous les jours signerait une liste parcourue
    // dans l'ordre : trouver la commune du jour livrerait celle du lendemain.
    const ecartLePlusFrequent = Math.max(...occurrences.values());

    expect(ecartLePlusFrequent / JOURS_CONSECUTIFS.length).toBeLessThan(0.25);
  });

  it('parcourt largement la liste sur une année', () => {
    const tirees = new Set(joursDe(2026).map(getMysteryCommuneInsee));

    expect(tirees.size).toBeGreaterThanOrEqual(COMMUNES_DU_TIRAGE.length - 5);
  });

  // Le tirage est uniforme et sans mémoire : deux jours de suite peuvent tomber
  // sur la même commune, et ce serait un défaut de l'interdire — la retirer du
  // chapeau biaiserait la distribution. Ce qui compte est que cela reste rare,
  // de l'ordre d'un jour sur cinquante.
  it('ne répète la veille qu’exceptionnellement', () => {
    const repetitions = JOURS_CONSECUTIFS.filter(
      ([veille, lendemain]) =>
        getMysteryCommuneInsee(veille) === getMysteryCommuneInsee(lendemain),
    ).length;

    expect(repetitions / JOURS_CONSECUTIFS.length).toBeLessThan(0.05);
  });
});
