# Communle

[![CI](https://github.com/EliasL94/React_js_Typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/EliasL94/React_js_Typescript/actions/workflows/ci.yml)

Une commune française mystère par jour. Le joueur propose des communes et reçoit
trois indices — distance, direction, population — jusqu'à la trouver, en six
essais au maximum.

Projet L3, sujet A. React 19 + TypeScript, DSFR, données de `geo.api.gouv.fr`.
**Ce service n'est pas un service public officiel.**

## Installation

Node.js 22 ou plus. Le dépôt est verrouillé par `package-lock.json` : installer
avec npm, pas avec Yarn.

```bash
npm ci
```

## Lancement

```bash
npm run dev      # serveur de développement
npm run build    # build de production dans dist/
npm run preview  # sert le build de production
```

## Tests

```bash
npm run test           # mode veille
npm run test:coverage  # exécution unique avec couverture
npm run lint           # oxlint
npm run typecheck      # tsc, sans émission
```

112 tests répartis en 11 fichiers. Le rapport HTML est écrit dans
`coverage/index.html`. Les seuils sont appliqués par Vitest et font échouer la
commande s'ils ne sont plus tenus.

| Périmètre | Seuil exigé | Mesuré |
| --- | --- | --- |
| `src/domain` | 90 % lignes et branches | 95 à 100 % selon le fichier |
| `src` | 60 % lignes | 96,9 % |

La CI rejoue lint, types, tests et build à chaque poussée sur `main` et `dev`
ainsi que sur chaque pull request. Elle publie le rapport en artefact
(`rapport-de-couverture`) et affiche les chiffres dans le récapitulatif du run.

## Choix d'architecture

```
src/
  domain/      logique métier pure, sans React ni DOM
  components/  composants réutilisables
  pages/       un composant par écran
  hooks/       hooks transverses
  routes.tsx   routes et chargeur de la fiche commune
```

- **Le domaine ne connaît pas React.** `commune.ts` appelle l'API et normalise
  ses réponses, `game.ts` calcule les indices et le tirage du jour, `partie.ts`
  encode le résultat dans l'URL, `format.ts` met les valeurs en français. Ces
  quatre fichiers se testent sans monter un composant.
- **L'état de la partie vit dans l'URL.** Les codes INSEE proposés sont inscrits
  dans le paramètre `history` : la partie se partage par copier-coller et le
  bouton Retour fonctionne.
- **Le tirage est déterministe, sans serveur.** La date passe par une empreinte
  FNV-1a suivie du finisseur MurmurHash3, puis indexe une liste de 50 communes.
  Deux joueurs du même jour cherchent la même ; un joueur ne peut pas déduire
  celle de demain.
- **La victoire se décide sur le code INSEE.** Jamais sur une distance nulle,
  que l'absence de coordonnées produirait à tort.
- **Toute réponse de l'API est normalisée avant d'entrer.** `normaliserCommune`
  reconstruit un objet complet champ par champ et rend `null` plutôt que de
  lever.
- **Le DSFR est consommé, pas réécrit.** Composants issus de
  `@codegouvfr/react-dsfr`, aucune couleur en dur — un test le vérifie.

Les arbitrages détaillés sont dans [DECISIONS.md](DECISIONS.md). L'usage de l'IA
générative est déclaré dans [IA.md](IA.md).

## API utilisée et limites rencontrées

**Découpage administratif — `https://geo.api.gouv.fr`**, ouverte, sans clé,
50 appels par seconde et par IP.

- `GET /communes?nom=…&fields=…&boost=population&limit=5` pour l'autocomplétion
- `GET /communes/{codeInsee}?fields=…` pour la fiche

| Limite constatée | Ce que nous en avons fait |
| --- | --- |
| Ni altitude ni superficie garanties | Les indices se calent sur population, département et distance |
| Population et centre parfois absents | Affichage « Non renseigné » ; une distance inconnue n'est jamais confondue avec zéro |
| Une commune peut porter plusieurs codes postaux | La fiche les liste et tronque au-delà de cinq |
| Recherche par nom tolérante mais mal ordonnée | `boost=population` remonte les communes les plus peuplées |
| Aucune annulation côté serveur | `AbortController` côté client, plus un numéro de recherche qui écarte les réponses en retard |

## Couverture des user stories

| US | Où | Comment le vérifier |
| --- | --- | --- |
| A1 — recherche et résultats | `AutocompleteSearch.tsx`, `PropositionHistory.tsx` | Taper « Lyon » : l'onglet Réseau montre l'appel réel, la console reste vide |
| A2 — écran de fin de partie | `ResultatPage.tsx`, `routes.tsx` | Coller `/partie/75056` dans un onglet neuf ; `/partie/99999` rend la 404 |
| A3 — partage par URL | `partie.ts`, paramètre `history` | Copier l'URL en cours de partie, la rouvrir ailleurs ; Retour revient d'une proposition |
| B1 — état initial | `AccueilPage.tsx` | Ouvrir `/` sans rien saisir : aucun indicateur ne tourne |
| B2 — état de chargement | `AccueilPage.tsx`, `ChargementPage.tsx` | Brider à 3G lente, puis taper |
| B3 — état de succès | `PropositionHistory.tsx` | Le décompte est annoncé avant la liste ; les champs absents ne cassent pas la mise en page |
| B4 — état vide | `AutocompleteSearch.tsx` | Saisir `zzzzzz` |
| B5 — état d'erreur | `AccueilPage.tsx`, `ErreurRoute.tsx` | Couper le réseau puis rechercher : message et bouton Réessayer, pas de spinner infini |
| C1 — frappe et annulation | `AutocompleteSearch.tsx` | Taper dix caractères : une poignée de requêtes, les obsolètes marquées annulées |
| C2 — données manquantes | `commune.ts`, `commune.test.ts` | `normaliserCommune` reçoit un objet vide sans lever |
| C3 — socle DSFR | `Layout.tsx` | Header, Footer, SkipLinks, bascule de thème, bandeau pédagogique sur chaque page |
| C4 — accessibilité clavier | `AutocompleteSearch.tsx` | Tout au clavier ; trois fichiers de tests exécutent axe |

## Accessibilité

Le service se parcourt entièrement au clavier. Dans la liste de suggestions,
Haut et Bas déplacent la sélection, Entrée valide, Échap referme. Les
changements d'état sont annoncés aux technologies d'assistance. Trois fichiers
de tests exécutent axe : autocomplétion, page des règles, écrans de fin de
partie et 404.

## Contributeurs

Elias Louhichi, Arij Akrout, Mehdi Bourouih.
