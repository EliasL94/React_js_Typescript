import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@codegouvfr/react-dsfr/Input";
import type { Commune } from "../domain/commune";
import { rechercherCommunes } from "../domain/commune";

interface AutocompleteSearchProps {
  onSelect: (commune: Commune) => void;
  disabled?: boolean;
}

export default function AutocompleteSearch({ onSelect, disabled }: AutocompleteSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Commune[]>([]);

  const [isSearching, setIsSearching] = useState(false);

  const handleQueryChange = (newQuery: string) => {
    if (newQuery.length >= 2) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
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
    if (query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const communes = await rechercherCommunes(query);
      setResults(communes);
      setIsSearching(false);
    }, 300); // Attend 300ms après la dernière frappe

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <div aria-live="polite" aria-busy={isSearching}>
        <Input
          label="Proposer une commune"
          hintText="Exemple : Paris, Toulouse..."
          nativeInputProps={{
            value: query,
            onChange: (e) => handleQueryChange(e.target.value),
            disabled: disabled,
            autoComplete: "off",
            placeholder: "Tapez le nom d'une commune..."
          }}
        />
        
        {/* Affichage des résultats en dessous */}
        {(results.length > 0 || isSearching) && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--background-default-grey)",
              border: "1px solid var(--border-default-grey)",
              zIndex: 10,
              listStyle: "none",
              margin: 0,
              padding: 0,
              maxHeight: "300px",
              overflowY: "auto",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}
          >
            {isSearching && (
              <li style={{ padding: "1rem", textAlign: "center", fontStyle: "italic", color: "var(--text-mention-grey)" }}>
                Recherche en cours...
              </li>
            )}
            {!isSearching && results.map((c) => (
              <li
                key={c.code}
                style={{ padding: "0.5rem 1rem", cursor: "pointer", borderBottom: "1px solid var(--border-alt-grey)" }}
                onClick={() => {
                  onSelect(c);
                  setResults([]);
                  setIsSearching(false);
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
        )}
      </div>
    </div>
  );
}
