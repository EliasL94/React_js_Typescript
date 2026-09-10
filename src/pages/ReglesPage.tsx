import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { fr } from '@codegouvfr/react-dsfr/fr';
import { NB_ESSAIS_MAX } from '../domain/partie';
import { useTitreDocument } from '../hooks/useTitreDocument';

/**
 * Les trois indices rendus après chaque proposition. La liste est décrite ici
 * plutôt qu'écrite en dur dans le JSX : elle sert aussi de référence unique
 * quand un indice change de libellé.
 */
const INDICES = [
  {
    terme: 'Distance',
    definition:
      "La distance à vol d'oiseau entre le centre de votre proposition et celui de la commune mystère, arrondie au kilomètre.",
  },
  {
    terme: 'Direction',
    definition:
      'La direction cardinale à suivre depuis votre proposition pour se rapprocher de la commune mystère : Nord, Sud-Est, Ouest…',
  },
  {
    terme: 'Population',
    definition:
      'Indique si la commune mystère compte plus ou moins d’habitants que celle que vous venez de proposer.',
  },
] as const;

export function ReglesPage() {
  useTitreDocument('Règles du jeu');

  return (
    <>
      <h1>Règles du jeu</h1>

      <p className={fr.cx('fr-text--lead')}>
        Communle vous propose une commune française mystère par jour. À vous de la
        retrouver en {NB_ESSAIS_MAX} essais au maximum, en vous servant des indices
        renvoyés à chaque proposition.
      </p>

      <h2>Le déroulé d’une partie</h2>
      <ol>
        <li>
          Saisissez le nom d’une commune française dans le champ de recherche, puis
          choisissez-la dans la liste de suggestions.
        </li>
        <li>
          La commune rejoint votre historique, accompagnée de ses trois indices.
        </li>
        <li>
          Recommencez jusqu’à trouver la bonne commune, ou jusqu’à épuiser vos{' '}
          {NB_ESSAIS_MAX} essais.
        </li>
      </ol>

      <h2>Les trois indices</h2>
      <dl>
        {INDICES.map(({ terme, definition }) => (
          <div key={terme} className={fr.cx('fr-mb-2w')}>
            <dt className={fr.cx('fr-text--bold', 'fr-mb-0')}>{terme}</dt>
            <dd className={fr.cx('fr-ml-0')}>{definition}</dd>
          </div>
        ))}
      </dl>

      <h2>Bon à savoir</h2>

      <Accordion label="La commune du jour est-elle la même pour tout le monde ?">
        <p>
          Oui. Le tirage est déterministe : il découle de la date du jour, sans
          serveur ni tirage aléatoire. Deux personnes qui jouent le même jour
          cherchent donc la même commune.
        </p>
      </Accordion>

      <Accordion label="Pourquoi certains indices affichent-ils « Non renseigné » ?">
        <p>
          Les données proviennent de l’API ouverte <code>geo.api.gouv.fr</code>, qui
          ne garantit ni la population ni les coordonnées de chaque commune. Quand
          une valeur manque, l’indice correspondant est affiché comme non renseigné
          plutôt que deviné : la victoire, elle, se décide toujours sur le code INSEE.
        </p>
      </Accordion>

      <Accordion label="Puis-je partager ma partie ?">
        <p>
          Vos propositions sont inscrites dans l’adresse de la page. Copier le lien
          et le coller dans un nouvel onglet restitue la partie à l’identique, et le
          bouton Retour du navigateur revient à la proposition précédente.
        </p>
      </Accordion>

      <Accordion label="Puis-je jouer sans souris ?">
        <p>
          Oui. Tout le service se parcourt à la touche Tab. Dans la liste de
          suggestions, les flèches Haut et Bas déplacent la sélection, Entrée valide
          la commune et Échap referme la liste.
        </p>
      </Accordion>

      <div className={fr.cx('fr-mt-4w')}>
        <Button linkProps={{ to: '/' }} iconId="fr-icon-arrow-left-line">
          Revenir au jeu
        </Button>
      </div>
    </>
  );
}
