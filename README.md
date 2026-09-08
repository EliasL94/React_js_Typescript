# Communle

Projet pédagogique L3 - Un clone de Wordle basé sur les communes françaises en utilisant `geo.api.gouv.fr`.

## Installation

```bash
npm install
```

## Lancement

```bash
npm run dev
```

## Tests

```bash
npm run test
```

## Choix d'Architecture

- Séparation stricte entre le domaine (`src/domain`) et l'interface (`src/components`, `src/pages`).
- Le domaine centralise toute la logique métier, la normalisation des données et le tirage pseudo-aléatoire.
- Utilisation de React Router v7 pour la navigation.
- Intégration du Design System de l'État (DSFR).

## API Utilisées et Limites

- **API Geo**: `geo.api.gouv.fr`.
  - Limite: ouverte, 50 appels / seconde.
  - Pièges: Ne garantit ni altitude ni superficie. Les indices se basent donc sur la population, le département et la distance.
