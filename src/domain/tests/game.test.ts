import { describe, it, expect } from "vitest";
import { calculateDistance, getDirection, compareCommunes } from "../game";
import type { Commune } from "../types";

// Quelques coordonnées connues pour nos tests
// Paris: 48.8589, 2.347
// Marseille: 43.2965, 5.3698
// Strasbourg: 48.5734, 7.7521
// Brest: 48.3904, -4.4861

describe("Logique du jeu (game.ts)", () => {
  describe("calculateDistance", () => {
    it("devrait calculer la bonne distance entre Paris et Marseille", () => {
      // Environ 660 km à vol d'oiseau
      const distance = calculateDistance(48.8589, 2.347, 43.2965, 5.3698);
      // On autorise une petite marge d'erreur due à l'arrondi et au modèle sphérique parfait
      expect(distance).toBeGreaterThan(650);
      expect(distance).toBeLessThan(670);
    });

    it("devrait renvoyer 0 si c'est la même commune", () => {
      const distance = calculateDistance(48.8589, 2.347, 48.8589, 2.347);
      expect(distance).toBe(0);
    });
  });

  describe("getDirection", () => {
    it("devrait indiquer Sud quand on est à Paris et que la solution est Marseille", () => {
      // On est à Paris (proposition), la solution est Marseille (Sud)
      const direction = getDirection(48.8589, 2.347, 43.2965, 5.3698);
      // Techniquement, Marseille est au Sud-Est de Paris
      expect(direction).toBe("Sud-Est");
    });

    it("devrait indiquer Sud-Ouest quand on est à Strasbourg et que la solution est Brest", () => {
      const direction = getDirection(48.5734, 7.7521, 48.3904, -4.4861);
      expect(direction).toBe("Sud-Ouest"); // Brest est légèrement plus au Sud
    });
  });

  describe("compareCommunes", () => {
    it("devrait générer des indices corrects (distance, direction, population)", () => {
      const proposition: Commune = {
        nom: "Paris",
        codeINSEE: "75056",
        departement: "75",
        population: 2000000, // simplifié
        latitude: 48.8589,
        longitude: 2.347,
      };

      const solution: Commune = {
        nom: "Marseille",
        codeINSEE: "13055",
        departement: "13",
        population: 860000, // simplifié
        latitude: 43.2965,
        longitude: 5.3698,
      };

      const indices = compareCommunes(proposition, solution);
      
      expect(indices.populationGap).toBe("moins"); // Marseille est moins peuplée que Paris
      expect(indices.direction).toBe("Sud-Est"); // Marseille est au Sud-Est de Paris
      expect(indices.distanceKm).toBeGreaterThan(600); // C'est loin
    });
  });
});
