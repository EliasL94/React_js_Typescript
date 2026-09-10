import { useEffect, useRef, useState } from "react";
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

  // Numéro de la recherche en cours. Une réponse qui revient avec un numéro
  // périmé est jetée : sans ça, une requête lente partie avant une autre
  // écrase le résultat le plus récent quand elle finit par arriver.
  const rechercheCourante = useRef(0);

  // L'état de la saisie est décidé par la frappe elle-même, pas par l'effet :
  // l'indicateur de recherche apparaît ainsi dès la première touche.
  const auChangement = (valeur: string) => {
    setInputValue(valeur);
    setEnErreur(false);

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

  const listeOuverte = inputValue.length >= LONGUEUR_MINIMALE;

  return (
    <div className="autocomplete">
      <div aria-live="polite" aria-busy={isSearching}>
        <Input
          label="Proposer une commune"
          hintText="Exemple : Paris, Toulouse..."
          nativeInputProps={{
            value: inputValue,
            onChange: (e) => auChangement(e.target.value),
            disabled: disabled,
            autoComplete: "off",
            placeholder: "Tapez le nom d’une commune...",
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
              <ul className="autocomplete-liste">
                {results.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      className="autocomplete-option"
                      onClick={() => {
                        rechercheCourante.current += 1;
                        onSelect(c);
                        setResults([]);
                        setIsSearching(false);
                        setInputValue("");
                      }}
                    >
                      {c.nom}
                      {c.departement !== null && ` (${c.departement.nom})`}
                    </button>
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
