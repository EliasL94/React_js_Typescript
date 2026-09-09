export type Commune = {
  code: string;
  nom: string;
  population: number | null;
  codesPostaux: string[];
  departement: { code: string; nom: string } | null;
  region: { code: string; nom: string } | null;
  centre: { latitude: number; longitude: number } | null;
};

export class CommuneIntrouvableError extends Error {
  constructor(code: string) {
    super(`Aucune commune ne correspond au code INSEE ${code}.`);
    this.name = 'CommuneIntrouvableError';
  }
}

export class ApiIndisponibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiIndisponibleError';
  }
}

const URL_API = 'https://geo.api.gouv.fr/communes';

const CHAMPS = [
  'nom',
  'code',
  'codesPostaux',
  'population',
  'departement',
  'region',
  'centre',
].join(',');

const CODE_INSEE = /^(?:\d{2}|2[AB])\d{3}$/i;

export function estCodeInseeValide(code: string): boolean {
  return CODE_INSEE.test(code);
}

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function lireTexte(valeur: unknown): string | null {
  return typeof valeur === 'string' && valeur.trim() !== '' ? valeur : null;
}

function lireNombre(valeur: unknown): number | null {
  return typeof valeur === 'number' && Number.isFinite(valeur) ? valeur : null;
}

function lireDivision(valeur: unknown): { code: string; nom: string } | null {
  if (!estObjet(valeur)) return null;
  const code = lireTexte(valeur.code);
  const nom = lireTexte(valeur.nom);
  return code !== null && nom !== null ? { code, nom } : null;
}

function lireCentre(valeur: unknown): { latitude: number; longitude: number } | null {
  if (!estObjet(valeur) || !Array.isArray(valeur.coordinates)) return null;
  const longitude = lireNombre(valeur.coordinates[0]);
  const latitude = lireNombre(valeur.coordinates[1]);
  return longitude !== null && latitude !== null ? { latitude, longitude } : null;
}

export function normaliserCommune(brut: unknown): Commune {
  const source = estObjet(brut) ? brut : {};

  return {
    code: lireTexte(source.code) ?? '',
    nom: lireTexte(source.nom) ?? '',
    population: lireNombre(source.population),
    codesPostaux: Array.isArray(source.codesPostaux)
      ? source.codesPostaux.filter((cp): cp is string => lireTexte(cp) !== null)
      : [],
    departement: lireDivision(source.departement),
    region: lireDivision(source.region),
    centre: lireCentre(source.centre),
  };
}

export async function recupererCommune(
  code: string,
  options: { signal?: AbortSignal } = {},
): Promise<Commune> {
  if (!estCodeInseeValide(code)) {
    throw new CommuneIntrouvableError(code);
  }

  let reponse: Response;
  try {
    reponse = await fetch(`${URL_API}/${code}?fields=${CHAMPS}`, {
      signal: options.signal,
    });
  } catch (erreur) {
    if (erreur instanceof DOMException && erreur.name === 'AbortError') throw erreur;
    throw new ApiIndisponibleError("L'API Geo n'a pas pu être jointe.");
  }

  if (reponse.status === 404) {
    throw new CommuneIntrouvableError(code);
  }

  if (!reponse.ok) {
    throw new ApiIndisponibleError(`L'API Geo a répondu ${reponse.status}.`);
  }

  try {
    return normaliserCommune(await reponse.json());
  } catch {
    throw new ApiIndisponibleError("La réponse de l'API Geo est illisible.");
  }
}
