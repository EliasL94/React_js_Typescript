# Usage de l'intelligence artificielle

L'IA générative a été utilisée sans restriction sur ce projet, conformément au
cadre du sujet. Ce document dit où, pour quoi faire, et surtout où elle s'est
trompée.

## Outils utilisés

| Outil | Ce à quoi il a servi |
| --- | --- |
| Antigravity (Gemini 3.1 Pro) | Première mise en place de l'ossature Vite + React Router + DSFR, génération de composants d'interface, rédaction d'une partie des tests unitaires. |
| Assistant de complétion dans l'éditeur | Complétion ligne à ligne, écriture des cas de test répétitifs, reformulation de messages d'erreur destinés à l'usager. |

L'assistance a été la plus utile sur le code répétitif — jeux de tests,
formatage, câblage des composants DSFR — et la moins fiable dès qu'il fallait
raisonner sur le cycle de rendu de React ou sur ce que l'API renvoie vraiment.

## Trois cas où l'assistant s'est trompé

### 1. Imbrication DOM invalide dans l'encart d'accueil

- **Commit correctif :** `d30a711` — *fix: resolve React DOM nesting bug causing
  first guess to not render*
- **L'erreur :** l'assistant avait produit un `CallOut` DSFR contenant un `<div>`
  et une `<ul>`. Le composant place son contenu dans un `<p>`, et un `<p>` ne
  peut pas contenir d'élément de type bloc. Le navigateur refermait le paragraphe
  de lui-même, React avertissait d'une imbrication invalide, et l'arbre
  reconstruit ne laissait plus apparaître la première proposition.
- **Pourquoi il s'est trompé :** le HTML produit était valide isolément. L'erreur
  ne devenait visible qu'en connaissant le balisage interne du `CallOut`, que
  l'assistant n'avait pas sous les yeux.
- **La correction :** remplacement des blocs par du contenu en ligne. Le
  correctif d'urgence utilisait `<br />` et un style en ligne ; l'encart a depuis
  été refait proprement, la description complète du jeu vivant maintenant sur la
  page `/regles`.

### 2. Boucle de rendu infinie sur un historique vide

- **Commit correctif :** `f0d0f0a` — *fix: resolve infinite render loop on empty
  history*
- **L'erreur :** l'effet de synchronisation de l'URL appelait `setPropositions([])`
  à chaque passage lorsque le paramètre `history` était absent. Un nouveau
  tableau vide n'est jamais égal au précédent au sens de React : chaque rendu en
  déclenchait un autre, indéfiniment, et l'onglet chauffait dès l'ouverture de
  l'accueil.
- **Pourquoi il s'est trompé :** le code semblait correct — remettre la liste à
  zéro quand l'URL est vide est l'intention juste. Le défaut portait sur
  l'identité des références, pas sur la logique.
- **La correction :** ne réécrire l'état que lorsqu'il change réellement. La
  reprise ultérieure de la page est allée plus loin : l'état de chargement se
  déduit désormais de l'écart entre l'historique demandé par l'URL et celui
  effectivement chargé, au lieu d'être posé depuis un effet.

### 3. État dédoublé et erreurs avalées dans l'autocomplétion

- **Commit correctif :** `79afe87` — *fix: resolve React state bugs in
  AutocompleteSearch*
- **L'erreur :** l'assistant faisait du champ de saisie un composant piloté par
  le paramètre `q` de l'URL. Chaque frappe passait donc par un aller-retour de
  routeur avant de revenir à l'écran, ce qui rendait la saisie hachée. Le même
  code n'entourait `rechercherCommunes` d'aucun `try` : une API en panne laissait
  l'indicateur de recherche tourner sans fin.
- **Pourquoi il s'est trompé :** « mettre la recherche dans l'URL » était bien
  une demande de l'US A3, mais elle porte sur les propositions validées, pas sur
  chaque caractère tapé. L'assistant a appliqué la consigne un cran trop bas.
- **La correction :** la valeur du champ redevient un état local, l'URL ne
  conserve que les propositions retenues, et l'échec de recherche est rattrapé et
  affiché. Les commits `264982b` et `4e1241d` ont ensuite ajouté l'annulation des
  requêtes obsolètes, réclamée par l'US C1.

### Un quatrième, pour être complet

Le commit `288e3e7` corrige un cas de la même famille : le chargement de la
commune du jour n'avait aucun rattrapage d'erreur, et l'accueil restait figé sur
« Chargement du jeu… » quand l'API ne répondait pas. Trois fois sur quatre, la
faute de l'assistant a porté sur le chemin d'échec, jamais sur le chemin nominal.

## Code écrit sans assistance

- **`src/domain/`, en particulier `commune.ts` et `game.ts`.** La normalisation
  défensive des réponses de l'API, le calcul de distance de Haversine, la
  direction cardinale et le tirage déterministe ont été écrits à la main.
- **Pourquoi :** c'est la partie où une erreur ne se voit pas. Un composant mal
  fichu saute aux yeux au premier rendu ; un indice de population faux, ou une
  victoire déclarée sur une distance nulle alors que la commune n'a pas de
  centre, se déclare comme un fonctionnement normal. Nous voulions pouvoir
  défendre chaque ligne de cette couche en soutenance, et c'est aussi elle qui
  porte le seuil de couverture le plus exigeant.
- **Les tests du domaine ont été relus un à un.** Une partie a été suggérée par
  l'assistant, mais chaque cas limite — commune sans centre, sans population,
  code INSEE corse — a été vérifié à la main contre les réponses réelles de
  `geo.api.gouv.fr`.
