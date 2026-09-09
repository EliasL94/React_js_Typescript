import type { Commune } from './commune';

export const MENTION_ABSENTE = 'Non renseigné';

const nombreFr = new Intl.NumberFormat('fr-FR');

export function formaterLibelle(valeur: string | null | undefined): string {
  return valeur !== null && valeur !== undefined && valeur.trim() !== ''
    ? valeur
    : MENTION_ABSENTE;
}

export function formaterPopulation(population: number | null): string {
  if (population === null) return MENTION_ABSENTE;
  const habitants = population > 1 ? 'habitants' : 'habitant';
  return `${nombreFr.format(population)} ${habitants}`;
}

export function formaterCodesPostaux(codesPostaux: string[]): string {
  if (codesPostaux.length === 0) return MENTION_ABSENTE;
  if (codesPostaux.length > 5) {
    return `${codesPostaux.slice(0, 5).join(', ')} et ${codesPostaux.length - 5} autres`;
  }
  return codesPostaux.join(', ');
}

export function formaterDivision(
  division: { code: string; nom: string } | null,
): string {
  return division === null ? MENTION_ABSENTE : `${division.nom} (${division.code})`;
}

export function formaterCoordonnees(
  centre: { latitude: number; longitude: number } | null,
): string {
  if (centre === null) return MENTION_ABSENTE;
  return `${centre.latitude.toFixed(4)}, ${centre.longitude.toFixed(4)}`;
}

export function decrireCommune(commune: Commune): { terme: string; valeur: string }[] {
  return [
    { terme: 'Code INSEE', valeur: formaterLibelle(commune.code) },
    { terme: 'Département', valeur: formaterDivision(commune.departement) },
    { terme: 'Région', valeur: formaterDivision(commune.region) },
    { terme: 'Population', valeur: formaterPopulation(commune.population) },
    { terme: 'Codes postaux', valeur: formaterCodesPostaux(commune.codesPostaux) },
    { terme: 'Coordonnées', valeur: formaterCoordonnees(commune.centre) },
  ];
}
