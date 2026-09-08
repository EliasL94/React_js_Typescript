# Décisions Techniques

Ce fichier trace les choix architecturaux et technologiques majeurs pris durant le projet.

## 1. Séparation Logique Métier / UI (Domain Driven Design léger)
- **Problème :** Couplage fort entre les composants React et les appels API rendant les tests complexes et l'application fragile.
- **Option retenue :** Isoler toute la logique (fetch, calculs, état du jeu) dans `src/domain/`.
- **Option écartée :** Tout gérer dans des hooks React personnalisés ou des Contextes globaux.
- **Pourquoi :** Permet des tests unitaires rapides et purs (sans JSDOM) sur la logique vitale du projet.

## 2. ... (à compléter)
