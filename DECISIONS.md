# Décisions techniques

Six arbitrages qui ont réellement fait débat. Pour chacun : le problème, ce que
nous avons retenu, ce que nous avons écarté et pourquoi.

## 1. Séparer la logique métier de la couche React

- **Problème :** avec les appels API et les calculs dispersés dans les
  composants, tester une règle du jeu imposait de monter un rendu complet.
- **Retenu :** tout ce qui raisonne vit dans `src/domain/`, sans un import de
  React. Les composants ne font qu'afficher ce que le domaine leur rend.
- **Écarté :** garder la logique dans des hooks personnalisés ou un contexte
  global. Cela reste testable, mais chaque test paie JSDOM et le cycle de rendu,
  et la frontière se serait effacée au premier raccourci.

## 2. Faire vivre l'état de la partie dans l'URL

- **Problème :** l'US A3 exige qu'une partie se partage par simple copier-coller
  du lien, et que le bouton Retour ramène à la proposition précédente.
- **Retenu :** les codes INSEE proposés sont inscrits dans le paramètre
  `history`. L'URL est la source de vérité ; le composant en dérive son état.
- **Écarté :** `localStorage` ou un contexte React. Les deux survivent au
  rechargement, mais aucun ne se partage ni ne s'inscrit dans l'historique du
  navigateur — les trois preuves de l'US A3 seraient tombées.

## 3. Décider la victoire sur le code INSEE, jamais sur la distance

- **Problème :** l'API ne garantit pas les coordonnées. Une commune sans centre
  produit une distance inconnue, qu'il est tentant de traiter comme un zéro.
- **Retenu :** `estTrouvee` compare les codes INSEE et rien d'autre. Une distance
  absente s'affiche « Non renseigné ».
- **Écarté :** conclure sur `distanceKm === 0`. C'est plus court, et cela
  déclarerait une victoire imméritée à la première commune aux données
  incomplètes — un bug invisible, puisqu'il ressemble à une partie gagnée.

## 4. Normaliser toute réponse de l'API avant de la laisser entrer

- **Problème :** `geo.api.gouv.fr` renvoie des enregistrements aux champs
  irréguliers : population absente, département manquant, centre non fourni.
- **Retenu :** `normaliserCommune` reconstruit un objet `Commune` complet à
  partir de n'importe quelle entrée, champ par champ, en rendant `null` plutôt
  qu'en levant. Rien d'autre ne touche à la réponse brute.
- **Écarté :** typer la réponse et faire confiance au typage. TypeScript ne
  vérifie rien à l'exécution : le premier champ absent serait ressorti en
  `undefined` à l'écran, ce que l'US C2 interdit explicitement.

## 5. Écrire l'autocomplétion à la main plutôt que d'ajouter une bibliothèque

- **Problème :** le DSFR ne fournit pas de combobox, et l'US C4 impose une
  navigation clavier complète avec un focus toujours visible.
- **Retenu :** un composant maison bâti sur l'`Input` du DSFR, câblé en
  `role="combobox"` et `aria-activedescendant`, flèches, Entrée et Échap.
- **Écarté :** Downshift ou react-select. Les deux apportent leur propre balisage
  et leurs propres styles, qu'il aurait fallu neutraliser pour rester dans les
  tokens du DSFR — ce que l'US C3 interdit.

## 6. Annuler les requêtes obsolètes plutôt que se contenter d'un debounce

- **Problème :** avec un simple délai de 300 ms, une réponse lente partie avant
  une autre peut revenir après elle et écraser un résultat plus récent.
- **Retenu :** un numéro de recherche incrémenté à chaque frappe, doublé d'un
  `AbortController`. Toute réponse au numéro périmé est jetée, et sa requête
  apparaît annulée dans l'onglet Réseau.
- **Écarté :** allonger le debounce. Cela réduit la fenêtre sans la fermer, et
  dégrade la sensation de fluidité que l'US C1 cherche justement à obtenir.

## 7. Normaliser les fins de ligne en LF

- **Problème :** l'équipe travaille sur Windows et macOS. Sans règle, chaque
  ouverture de fichier sous Windows réécrivait les 39 fichiers en CRLF.
- **Retenu :** un `.gitattributes` avec `* text=auto eol=lf`.
- **Écarté :** laisser chacun régler `core.autocrlf` sur son poste. Un réglage
  local n'est pas versionné : il se perd au premier clone, et le prochain
  arrivant recrée le diff de 6 500 lignes fantômes.
