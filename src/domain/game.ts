import type { Commune } from "./commune";

export type Indices = {
  distanceKm: number;
  direction: string;
  populationGap: "plus" | "moins" | "egal" | "inconnu";
};

/**
 * Convertit des degrés en radians (nécessaire pour la trigonométrie)
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcule la distance en kilomètres entre deux points GPS (Formule de Haversine)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // On arrondit à l'entier le plus proche
  return Math.round(distance);
}

/**
 * Détermine la direction cardinale (Nord, Sud, Est, Ouest, etc.) 
 * pour aller du point 1 (proposition) vers le point 2 (solution).
 */
export function getDirection(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  // Si on est vraiment très très proche (genre même commune)
  if (Math.abs(dLat) < 0.01 && Math.abs(dLon) < 0.01) return "📍";

  let ns = "";
  let ew = "";

  if (dLat > 0.01) ns = "Nord";
  else if (dLat < -0.01) ns = "Sud";

  if (dLon > 0.01) ew = "Est";
  else if (dLon < -0.01) ew = "Ouest";

  // Combine les deux (ex: "Nord" + "-" + "Est" -> "Nord-Est")
  if (ns && ew) return `${ns}-${ew}`;
  return ns || ew;
}

/**
 * Compare la proposition du joueur avec la solution pour générer les 3 indices.
 */
export function compareCommunes(proposition: Commune, solution: Commune): Indices {
  if (!proposition.centre || !solution.centre) {
     return { distanceKm: 0, direction: "N/A", populationGap: "inconnu" };
  }

  const distanceKm = calculateDistance(
    proposition.centre.latitude, proposition.centre.longitude,
    solution.centre.latitude, solution.centre.longitude
  );

  const direction = getDirection(
    proposition.centre.latitude, proposition.centre.longitude,
    solution.centre.latitude, solution.centre.longitude
  );

  let populationGap: "plus" | "moins" | "egal" | "inconnu" = "egal";
  if (solution.population !== null && proposition.population !== null) {
    if (solution.population > proposition.population) populationGap = "plus";
    if (solution.population < proposition.population) populationGap = "moins";
  } else {
    populationGap = "inconnu";
  }

  return {
    distanceKm,
    direction,
    populationGap,
  };
}

/**
 * Liste d'une cinquantaine de codes INSEE de communes françaises connues
 * pour servir de base de tirage au jeu.
 */
const FAMOUS_COMMUNES_INSEE = [
  "75056", "13055", "69123", "31555", "06088", "44109", "34172", "67482", "33063", "59350",
  "35238", "51454", "42218", "83137", "76351", "38185", "21231", "49007", "30189", "97411",
  "72181", "13001", "29019", "80021", "37261", "87085", "63113", "86194", "25056", "57463",
  "14598", "45234", "68224", "76540", "54395", "59512", "97415", "97416", "97105", "97209",
  "84007", "94028", "92012", "92050", "93048", "92026", "94081", "93066", "94068", "94022"
];

/**
 * Fonction de tirage déterministe. 
 * Rend TOUJOURS le même code INSEE pour une date donnée.
 */
export function getMysteryCommuneInsee(dateStr: string): string {
  // Convertit la date (ex: "2026-09-08") en un nombre simple
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed += dateStr.charCodeAt(i);
  }
  
  // Utilise le reste de la division euclidienne pour toujours tomber dans le tableau
  const index = seed % FAMOUS_COMMUNES_INSEE.length;
  return FAMOUS_COMMUNES_INSEE[index];
}
