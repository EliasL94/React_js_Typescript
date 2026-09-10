import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import type { Commune } from "../domain/commune";
import { rechercherCommunes } from "../domain/commune";

interface AutocompleteSearchProps {
  onSelect: (commune: Commune) => void;
  disabled?: boolean;
}

const DELAI_DEBOUNCE_MS = 300;
const LONGUEUR_MINIMALE = 2;

export default function AutocompleteSearch({ onSelect, disabled }: AutocompleteSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<Commune[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [enErreur, setEnErreur] = useState(false);
  const [indexActif, setIndexActif] = useState(-1);
  const [listeFermee, setListeFermee] = useState(false);

  const idListe = useId();
  const optionId = (index: number) => `${idListe}-option-${index}`;

  // Numéro de la recherche en cours. Une réponse qui revient avec un numéro
  // périmé est jetée : sans ça, une requête lente partie avant une autre
  // écrase le résultat le plus récent quand elle finit par arriver.
  const rechercheCourante = useRef(0);

  // L'état de la saisie est décidé par la frappe elle-même, pas par l'effet :
  // l'indicateur de recherche apparaît ainsi dès la première touche.
  const auChangement = (valeur: string) => {
    setInputValue(valeur);
    setEnErreur(false);
    setIndexActif(-1);
    setListeFermee(false);

    if (valeur.length < LONGUEUR_MINIMALE) {
      rechercheCourante.current += 1;
      setResults([]);
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  };

  useEffect(() => {
    if (inputValue.length < LONGUEUR_MINIMALE) return;

    const numero = ++rechercheCourante.current;
    const controleur = new AbortController();

    const minuterie = setTimeout(async () => {
      try {
        const communes = await rechercherCommunes(inputValue, {
          signal: controleur.signal,
        });
        if (numero !== rechercheCourante.current) return;
        setResults(communes);
        setIsSearching(false);
      } catch (erreur) {
        // Une annulation n'est pas une panne : la frappe suivante a pris le relais.
        if (erreur instanceof DOMException && erreur.name === "AbortError") return;
        if (numero !== rechercheCourante.current) return;
        setResults([]);
        setEnErreur(true);
        setIsSearching(false);
      }
    }, DELAI_DEBOUNCE_MS);

    return () => {
      clearTimeout(minuterie);
      controleur.abort();
    };
  }, [inputValue]);

  const choisir = (commune: Commune) => {
    rechercheCourante.current += 1;
    onSelect(commune);
    setResults([]);
    setIsSearching(false);
    setInputValue("");
    setIndexActif(-1);
    setListeFermee(false);
  };

  const listeOuverte =
    !listeFermee && inputValue.length >= LONGUEUR_MINIMALE;
  const optionsNavigables = listeOuverte && !isSearching && !enErreur && results.length > 0;

  const auClavier = (evenement: React.KeyboardEvent<HTMLInputElement>) => {
    if (evenement.key === "Escape") {
      setListeFermee(true);
      setIndexActif(-1);
      return;
    }

    if (!optionsNavigables) return;

    if (evenement.key === "ArrowDown") {
      evenement.preventDefault();
      setIndexActif((actuel) => (actuel + 1) % results.length);
      return;
    }

    if (evenement.key === "ArrowUp") {
      evenement.preventDefault();
      setIndexActif((actuel) => (actuel <= 0 ? results.length - 1 : actuel - 1));
      return;
    }

    if (evenement.key === "Enter" && indexActif >= 0) {
      evenement.preventDefault();
      choisir(results[indexActif]);
    }
  };

  return (
    <div className="autocomplete">
      <div aria-live="polite" aria-busy={isSearching}>
        <Input
          label="Proposer une commune"
          hintText="Exemple : Paris, Toulouse..."
          nativeInputProps={{
            value: inputValue,
            onChange: (e) => auChangement(e.target.value),
            onKeyDown: auClavier,
            disabled: disabled,
            autoComplete: "off",
            placeholder: "Tapez le nom d’une commune...",
            role: "combobox",
            "aria-expanded": optionsNavigables,
            "aria-controls": idListe,
            "aria-autocomplete": "list",
            "aria-activedescendant":
              indexActif >= 0 ? optionId(indexActif) : undefined,
          }}
        />

        {listeOuverte && (
          <div className="autocomplete-panneau">
            {isSearching ? (
              <p className="fr-p-2w fr-mb-0 fr-text--italic">Recherche en cours...</p>
            ) : enErreur ? (
              <div className="fr-p-2w">
                <Alert
                  severity="error"
                  title="La recherche n’a pas abouti"
                  description="Le service qui fournit les communes ne répond pas. Vérifiez votre connexion, puis retapez votre recherche."
                  small
                />
              </div>
            ) : results.length > 0 ? (
              <ul className="autocomplete-liste" id={idListe} role="listbox" aria-label="Communes proposées">
                {results.map((c, index) => (
                  <li
                    key={c.code}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === indexActif}
                    className={
                      index === indexActif
                        ? "autocomplete-option autocomplete-option--active"
                        : "autocomplete-option"
                    }
                    onMouseDown={(e) => {
                      // Empêche le champ de perdre le focus avant la sélection.
                      e.preventDefault();
                      choisir(c);
                    }}
                  >
                    {c.nom}
                    {c.departement !== null && ` (${c.departement.nom})`}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="fr-p-2w">
                <Alert
                  severity="info"
                  title={`Aucun résultat pour "${inputValue}"`}
                  description="Vérifiez l’orthographe ou essayez un nom de commune plus générique."
                  small
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
