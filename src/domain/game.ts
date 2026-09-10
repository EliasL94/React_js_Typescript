import type { Commune } from "./commune";

export type Indices = {
  /** null quand un des deux centres manque : l'API ne les garantit pas. */
  distanceKm: number | null;
  direction: string | null;
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
  if (Math.abs(dLat) < 0.01 && Math.abs(dLon) < 0.01) return "Sur place";

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
 * La victoire se décide sur le code INSEE, jamais sur la distance.
 * Une commune dont l'API ne donne pas le centre a une distance inconnue :
 * la confondre avec un zéro déclarerait une victoire imméritée.
 */
export function estTrouvee(proposition: Commune, solution: Commune): boolean {
  return proposition.code !== "" && proposition.code === solution.code;
}

/**
 * Compare la proposition du joueur avec la solution pour générer les 3 indices.
 */
export function compareCommunes(proposition: Commune, solution: Commune): Indices {
  let populationGap: "plus" | "moins" | "egal" | "inconnu" = "inconnu";
  if (solution.population !== null && proposition.population !== null) {
    populationGap = "egal";
    if (solution.population > proposition.population) populationGap = "plus";
    if (solution.population < proposition.population) populationGap = "moins";
  }

  if (!proposition.centre || !solution.centre) {
    return { distanceKm: null, direction: null, populationGap };
  }

  const distanceKm = calculateDistance(
    proposition.centre.latitude, proposition.centre.longitude,
    solution.centre.latitude, solution.centre.longitude
  );

  const direction = getDirection(
    proposition.centre.latitude, proposition.centre.longitude,
    solution.centre.latitude, solution.centre.longitude
  );

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
export const COMMUNES_DU_TIRAGE = [
  "75056", "13055", "69123", "31555", "06088", "44109", "34172", "67482", "33063", "59350",
  "35238", "51454", "42218", "83137", "76351", "38185", "21231", "49007", "30189", "97411",
  "72181", "13001", "29019", "80021", "37261", "87085", "63113", "86194", "25056", "57463",
  "14598", "45234", "68224", "76540", "54395", "59512", "97415", "97416", "97105", "97209",
  "84007", "94028", "92012", "92050", "93048", "92026", "94081", "93066", "94068", "94022"
];

/**
 * Empreinte FNV-1a sur 32 bits.
 *
 * Le tirage additionnait auparavant les codes de caractères de la date. Cette
 * somme n'a aucun effet d'avalanche : "2026-09-10" et "2026-09-11" donnent deux
 * nombres qui ne diffèrent que de 1, donc deux cases voisines dans la liste.
 * Le jeu restait déterministe, mais devenait devinable — qui trouvait la commune
 * du jour connaissait celle du lendemain — et 400 jours consécutifs ne sortaient
 * que 19 communes sur 50.
 *
 * FNV-1a mélange chaque octet par un XOR suivi d'une multiplication par un
 * nombre premier. Seul, il ne suffit pas ici : deux dates du même mois ne
 * diffèrent que par leur dernier caractère, et ce dernier octet ne traverse
 * qu'une multiplication avant la sortie. L'écart se retrouve alors intact dans
 * le résultat — Math.imul(1, 0x01000193) % 50 vaut 19, et le tirage avançait de
 * 19 cases chaque jour au lieu d'une.
 *
 * Le finisseur de MurmurHash3 est donc appliqué en sortie : trois décalages et
 * deux multiplications qui propagent les bits de poids faible vers les bits de
 * poids fort. Un seul caractère qui change redistribue alors tout le résultat.
 *
 * Math.imul garde les multiplications sur 32 bits, et >>> 0 rend le résultat
 * non signé.
 */
function empreinte(texte: string): number {
  const BASE = 0x811c9dc5;
  const PREMIER = 0x01000193;

  let melange = BASE;
  for (let i = 0; i < texte.length; i++) {
    melange ^= texte.charCodeAt(i);
    melange = Math.imul(melange, PREMIER);
  }

  melange ^= melange >>> 16;
  melange = Math.imul(melange, 0x85ebca6b);
  melange ^= melange >>> 13;
  melange = Math.imul(melange, 0xc2b2ae35);
  melange ^= melange >>> 16;

  return melange >>> 0;
}

/**
 * Tirage déterministe : la même date rend toujours la même commune, sans
 * serveur ni état partagé. Deux joueurs qui jouent le même jour cherchent donc
 * la même commune, comme le sujet l'exige.
 */
export function getMysteryCommuneInsee(dateStr: string): string {
  const index = empreinte(dateStr) % COMMUNES_DU_TIRAGE.length;
  return COMMUNES_DU_TIRAGE[index];
}
