# Usage de l'intelligence artificielle

L'IA générative a été utilisée sans restriction, comme le sujet l'autorise. Ce
document dit avec quoi, pour quoi faire, et où elle s'est trompée. Chaque cas
cité est vérifiable dans l'historique Git.

## Outils et usage

| Outil | Ce à quoi il a servi |
| --- | --- |
| Antigravity (Gemini 3.1 Pro) | Ossature Vite + React Router + DSFR, génération des premiers composants d'interface, première version de `game.ts` et d'une partie des tests. |
| Claude (Cowork / Claude Code) | Reprise de l'accueil, US B3, C1 et C4, tests de composants, rédaction de la documentation. Traçable : quatre commits portent le trailer `Co-Authored-By: Claude` — `4e1241d`, `cf1a644`, `5fdbe80`, `288e3e7`. |
| Complétion dans l'éditeur | Complétion ligne à ligne, cas de test répétitifs, reformulation des messages destinés à l'usager. |

L'assistance a été la plus utile sur le code répétitif — jeux de tests,
formatage, câblage des composants DSFR — et la moins fiable dès qu'il fallait
raisonner sur le cycle de rendu de React, sur ce que l'API renvoie vraiment, ou
sur les propriétés d'un calcul.

## Quatre cas où l'assistant s'est trompé

### 1. Un tirage du jour prévisible, que tous les tests validaient

- **Commit correctif :** `fd1f84f` — *fix: rendre le tirage du jour imprévisible
  sans perdre son déterminisme*
- **L'erreur :** le tirage additionnait les codes de caractères de la date, puis
  prenait le reste de la division par 50. Une somme n'a aucun effet d'avalanche :
  `2026-09-10` et `2026-09-11` diffèrent d'une unité, donc d'une case dans la
  liste. Trouver la commune du jour livrait celle du lendemain, et 400 jours
  consécutifs ne sortaient que 19 communes sur 50.
- **Pourquoi il s'est trompé :** la fonction faisait exactement ce qu'on lui
  demandait — rendre toujours le même résultat pour une date donnée. Le
  déterminisme était atteint, la répartition ne l'était pas, et rien dans la
  consigne ne distinguait les deux. Les tests existants, eux aussi générés,
  vérifiaient qu'un appel rendait une chaîne : ils passaient tous.
- **La correction :** empreinte FNV-1a sur la date. Le remplacement n'a pas
  suffi du premier coup — le test l'a montré : le dernier octet ne traverse
  qu'une multiplication avant la sortie, `Math.imul(1, 0x01000193) % 50` vaut 19,
  et le tirage avançait de 19 cases par jour au lieu d'une. Le finisseur de
  MurmurHash3 est donc appliqué en sortie. Les 50 communes sortent désormais sur
  400 jours, et aucun écart d'un jour au suivant ne dépasse 3,6 % des jours. Les
  trois tests ajoutés mesurent la distribution au lieu de constater un retour.

C'est le cas le plus instructif du projet : une erreur qu'aucun test de façade
ne rattrape, parce que le code générait bien ce qu'on lui avait décrit.

### 2. Imbrication DOM invalide dans l'encart d'accueil

- **Commit correctif :** `d30a711` — *fix: resolve React DOM nesting bug causing
  first guess to not render*
- **L'erreur :** un `CallOut` DSFR contenant un `<div>` et une `<ul>`. Le
  composant place son contenu dans un `<p>`, qui ne peut pas contenir de bloc. Le
  navigateur refermait le paragraphe seul, React signalait l'imbrication
  invalide, et l'arbre reconstruit ne laissait plus apparaître la première
  proposition.
- **Pourquoi il s'est trompé :** le HTML produit était valide isolément. Le
  défaut ne devient visible qu'en connaissant le balisage interne du `CallOut`,
  que l'assistant n'avait pas sous les yeux.
- **La correction :** contenu remis en ligne. Le correctif d'urgence utilisait
  `<br />` ; l'encart a depuis été refait, la description complète du jeu vivant
  sur la page `/regles`.

### 3. Boucle de rendu infinie sur un historique vide

- **Commit correctif :** `f0d0f0a` — *fix: resolve infinite render loop on empty
  history*
- **L'erreur :** l'effet de synchronisation de l'URL appelait
  `setPropositions([])` à chaque passage quand le paramètre `history` était
  absent. Un tableau vide neuf n'est jamais égal au précédent au sens de React :
  chaque rendu en déclenchait un autre, et l'onglet chauffait dès l'ouverture.
- **Pourquoi il s'est trompé :** l'intention était juste — remettre la liste à
  zéro quand l'URL est vide. Le défaut portait sur l'identité des références, pas
  sur la logique.
- **La correction :** ne réécrire l'état que lorsqu'il change réellement. La
  reprise ultérieure est allée plus loin : l'état de chargement se déduit
  désormais de l'écart entre l'historique demandé par l'URL et celui chargé, au
  lieu d'être posé depuis un effet.

### 4. État dédoublé et erreurs avalées dans l'autocomplétion

- **Commit correctif :** `79afe87` — *fix: resolve React state bugs in
  AutocompleteSearch*
- **L'erreur :** le champ de saisie était piloté par le paramètre `q` de l'URL.
  Chaque frappe passait par un aller-retour de routeur avant de revenir à
  l'écran, ce qui hachait la saisie. Le même code n'entourait
  `rechercherCommunes` d'aucun `try` : une API en panne laissait l'indicateur
  tourner sans fin.
- **Pourquoi il s'est trompé :** « mettre la recherche dans l'URL » est bien une
  demande de l'US A3, mais elle porte sur les propositions validées, pas sur
  chaque caractère tapé. La consigne a été appliquée un cran trop bas.
- **La correction :** la valeur du champ redevient un état local, l'URL ne
  conserve que les propositions retenues, l'échec de recherche est rattrapé et
  affiché. Les commits `264982b` et `4e1241d` ont ensuite ajouté l'annulation des
  requêtes obsolètes réclamée par l'US C1.

### Le fil commun

Le commit `288e3e7` relève de la même famille : le chargement de la commune du
jour n'avait aucun rattrapage d'erreur, et l'accueil restait figé sur
« Chargement du jeu… » quand l'API ne répondait pas. Sur cinq fautes, quatre
portent sur le chemin d'échec ou sur une propriété non demandée — jamais sur le
chemin nominal, qui est précisément ce que l'assistant sait produire.

## Code écrit sans assistance

- **La normalisation défensive dans `src/domain/commune.ts`.**
  `normaliserCommune` reconstruit un objet `Commune` complet à partir de
  n'importe quelle entrée, champ par champ, en rendant `null` plutôt qu'en
  levant. Rien d'autre ne touche à la réponse brute de l'API.
- **Pourquoi :** c'est la couche où une erreur ne se voit pas. Un composant mal
  fichu saute aux yeux au premier rendu ; un indice de population faux, ou une
  victoire déclarée sur une distance nulle alors que la commune n'a pas de
  centre, ressemble à un fonctionnement normal. C'est aussi elle qui porte le
  seuil de couverture le plus exigeant.
- **Les tests du domaine ont été relus un à un.** Une partie a été suggérée par
  l'assistant, mais chaque cas limite — commune sans centre, sans population,
  code INSEE corse — a été vérifié à la main contre les réponses réelles de
  `geo.api.gouv.fr`. Le cas n° 1 ci-dessus montre pourquoi : un test généré peut
  passer sans rien vérifier.
