# Communle

Une commune française mystère par jour. Le joueur propose des communes et reçoit
trois indices — distance, direction, population — jusqu'à trouver la bonne, en
six essais au maximum.

Projet pédagogique de L3 (sujet A). **Ce service n'est pas un service public
officiel.** Les données proviennent des API ouvertes de l'État.

## Prérequis

Node.js 22 ou plus, et npm. Le dépôt utilise `package-lock.json` : ne pas
installer avec Yarn.

## Installation

```bash
npm ci
```

## Lancement

```bash
npm run dev      # serveur de développement Vite
npm run build    # build de production dans dist/
npm run preview  # sert le build de production
```

## Tests

```bash
npm run test           # mode veille
npm run test:coverage  # exécution unique avec rapport de couverture
```

Le rapport HTML est écrit dans `coverage/index.html`. Les seuils sont appliqués
par Vitest et font échouer la commande s'ils ne sont plus tenus :

| Périmètre | Seuil |
| --- | --- |
| `src/domain` | 90 % des lignes et des branches |
| `src` | 60 % des lignes |

## Qualité

```bash
npm run lint       # oxlint
npm run typecheck  # tsc en mode projet, sans émission
```

La CI GitHub Actions rejoue lint, types, tests et build à chaque poussée sur
`main` et `dev` ainsi que sur chaque pull request. Elle publie le rapport de
couverture en artefact (`rapport-de-couverture`) et affiche les chiffres dans le
récapitulatif du run.

## Choix d'architecture

```
src/
  domain/      logique métier pure, sans React ni DOM
  components/  composants réutilisables
  pages/       un composant par écran
  hooks/       hooks transverses
  routes.tsx   déclaration des routes et chargeur de la fiche commune
```

- **Le domaine ne connaît pas React.** `commune.ts` parle à l'API et normalise
  ses réponses, `game.ts` calcule les indices et le tirage du jour, `partie.ts`
  encode le résultat dans l'URL, `format.ts` met les valeurs en français. Ces
  quatre fichiers se testent sans monter un seul composant.
- **L'état de la partie vit dans l'URL.** Les propositions sont inscrites dans le
  paramètre `history`, ce qui rend la partie partageable et le bouton Retour
  utilisable.
- **Le tirage est déterministe.** La commune du jour découle de la date, sans
  serveur : deux joueurs qui jouent le même jour cherchent la même commune.
- **La victoire se décide sur le code INSEE.** Jamais sur une distance nulle, que
  l'absence de coordonnées pourrait produire à tort.
- **Le DSFR est consommé, pas réécrit.** Les composants viennent de
  `@codegouvfr/react-dsfr` et aucune couleur n'est écrite en dur : un test le
  vérifie.

Les arbitrages qui ont fait débat sont détaillés dans [DECISIONS.md](DECISIONS.md).
L'usage de l'IA générative est déclaré dans [IA.md](IA.md).

## Les cinq états de l'interface

| État | Où le voir |
| --- | --- |
| Initial | Ouvrir `/` sans rien saisir |
| Chargement | Brider le réseau à 3G lente, puis taper dans le champ |
| Succès | Proposer une commune : l'historique annonce le décompte avant la liste |
| Vide | Saisir `zzzzzz` dans le champ de recherche |
| Erreur | Couper le réseau, puis lancer une recherche |

## API utilisée et limites rencontrées

**Découpage administratif — `https://geo.api.gouv.fr`**

- Ouverte, sans clé ni habilitation. 50 appels par seconde et par IP.
- `GET /communes?nom=…&fields=…&boost=population&limit=5` pour l'autocomplétion,
  `GET /communes/{codeInsee}?fields=…` pour la fiche.

Limites constatées, et ce que nous en avons fait :

- **Ni altitude ni superficie ne sont garanties.** Les indices se calent donc sur
  la population, le département et la distance.
- **La population et le centre peuvent manquer** sur certaines communes. Les
  valeurs absentes s'affichent « Non renseigné » plutôt que d'être devinées, et
  la distance inconnue n'est jamais confondue avec zéro.
- **Une commune peut porter plusieurs codes postaux.** La fiche les liste et
  tronque au-delà de cinq.
- **La recherche par nom est tolérante mais pas ordonnée par pertinence seule.**
  Le paramètre `boost=population` remonte les communes les plus peuplées en tête,
  ce qui correspond à ce qu'un joueur tape en premier.
- **Aucune annulation côté serveur.** Les requêtes obsolètes sont annulées côté
  client par `AbortController`, et les réponses en retard sont écartées par un
  numéro de recherche.

## Déploiement

`netlify.toml` et `vercel.json` sont fournis. Les deux réécrivent toutes les
adresses vers `index.html` : sans cela, ouvrir directement `/regles` ou
`/partie/75056` renverrait un 404 du serveur et un lien partagé ne fonctionnerait
plus.

## Accessibilité

Le service se parcourt entièrement au clavier. Dans la liste de suggestions, les
flèches Haut et Bas déplacent la sélection, Entrée valide, Échap referme. Les
changements d'état sont annoncés aux technologies d'assistance, et trois fichiers
de tests exécutent axe : sur l'autocomplétion, sur la page des règles et sur les
écrans de fin de partie et d'erreur 404.
