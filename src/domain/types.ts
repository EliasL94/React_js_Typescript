// Modèle brut tel que renvoyé par geo.api.gouv.fr (certains champs peuvent manquer)
export interface CommuneAPI {
  nom?: string;
  code?: string; // Code INSEE
  codeDepartement?: string;
  population?: number;
  centre?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

// Notre modèle propre, garanti complet et nettoyé
export interface Commune {
  nom: string;
  codeINSEE: string;
  departement: string;
  population: number;
  longitude: number;
  latitude: number;
}

// Les indices retournés au joueur après une proposition
export interface Indices {
  distanceKm: number;      // Distance entre la proposition et la solution
  direction: string;       // Nord, Sud, Est, Ouest, etc.
  populationGap: "plus" | "moins" | "egal"; // La solution est-elle plus ou moins peuplée ?
}
