import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@codegouvfr/react-dsfr/Input";
import type { Commune } from "../domain/commune";
import { rechercherCommunes } from "../domain/commune";

interface AutocompleteSearchProps {
  onSelect: (commune: Commune) => void;
  disabled?: boolean;
}

import { Alert } from "@codegouvfr/react-dsfr/Alert";

export default function AutocompleteSearch({ onSelect, disabled }: AutocompleteSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState<Commune[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleQueryChange = (newQuery: string) => {
    setInputValue(newQuery);
    
    if (newQuery.length >= 2) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setResults([]);
    }

    setSearchParams(prev => {
      if (newQuery) {
        prev.set("q", newQuery);
      } else {
        prev.delete("q");
      }
      return prev;
    }, { replace: true });
  };

  // Debounce simple pour ne pas spammer l'API
  useEffect(() => {
    if (inputValue.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const communes = await rechercherCommunes(inputValue);
        setResults(communes);
      } catch (err) {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Attend 300ms après la dernière frappe

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  return (
    <div style={{ position: "relative" }}>
      <div aria-live="polite" aria-busy={isSearching}>
        <Input
          label="Proposer une commune"
          hintText="Exemple : Paris, Toulouse..."
          nativeInputProps={{
            value: inputValue,
            onChange: (e) => handleQueryChange(e.target.value),
            disabled: disabled,
            autoComplete: "off",
            placeholder: "Tapez le nom d'une commune..."
          }}
        />
        
        {/* Affichage des résultats en dessous */}
        {inputValue.length >= 2 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--background-default-grey)",
              border: "1px solid var(--border-default-grey)",
              zIndex: 10,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}
          >
            {isSearching ? (
              <div style={{ padding: "1rem", textAlign: "center", fontStyle: "italic", color: "var(--text-mention-grey)" }}>
                Recherche en cours...
              </div>
            ) : results.length > 0 ? (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: "300px", overflowY: "auto" }}>
                {results.map((c) => (
                  <li
                    key={c.code}
                    style={{ padding: "0.5rem 1rem", cursor: "pointer", borderBottom: "1px solid var(--border-alt-grey)" }}
                    onClick={() => {
                      onSelect(c);
                      setResults([]);
                      setIsSearching(false);
                      setInputValue("");
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--background-alt-grey)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {c.nom} ({c.departement?.nom})
                  </li>
                ))}
              </ul>
            ) : (
              <div className="fr-p-2w" style={{ padding: "1rem" }}>
                 <Alert
                   severity="info"
                   title={`Aucun résultat pour "${inputValue}"`}
                   description="Vérifiez l'orthographe ou essayez un nom de commune plus générique."
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
