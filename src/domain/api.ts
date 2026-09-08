import type { Commune, CommuneAPI } from "./types";

/**
 * Nettoie et valide les données brutes de l'API.
 * S'il manque un champ vital (comme les coordonnées), la commune est ignorée.
 */
export function normalizeCommune(apiData: CommuneAPI): Commune | null {
  if (
    !apiData.nom ||
    !apiData.code ||
    !apiData.codeDepartement ||
    apiData.population === undefined ||
    !apiData.centre ||
    !apiData.centre.coordinates ||
    apiData.centre.coordinates.length !== 2
  ) {
    return null; // Donnée invalide, on la rejette
  }

  return {
    nom: apiData.nom,
    codeINSEE: apiData.code,
    departement: apiData.codeDepartement,
    population: apiData.population,
    longitude: apiData.centre.coordinates[0],
    latitude: apiData.centre.coordinates[1],
  };
}

/**
 * Recherche les communes par nom via l'API Géo de l'État.
 */
export async function searchCommunes(query: string): Promise<Commune[]> {
  if (query.trim().length < 2) return [];

  const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(
    query
  )}&fields=nom,code,codeDepartement,population,centre&format=json&geometry=centre`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data: CommuneAPI[] = await response.json();
    
    // On normalise chaque résultat et on filtre ceux qui sont invalides (null)
    const communes = data
      .map(normalizeCommune)
      .filter((c): c is Commune => c !== null);

    return communes;
  } catch (error) {
    console.error("Erreur lors de la recherche de communes:", error);
    return []; // On ne fait pas crasher l'app, on rend un tableau vide
  }
}

/**
 * Récupère une commune spécifique par son code INSEE.
 */
export async function getCommuneByInsee(code: string): Promise<Commune | null> {
  const url = `https://geo.api.gouv.fr/communes/${code}?fields=nom,code,codeDepartement,population,centre&format=json&geometry=centre`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data: CommuneAPI = await response.json();
    return normalizeCommune(data);
  } catch (error) {
    console.error("Erreur lors de la récupération de la commune:", error);
    return null;
  }
}
