import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@codegouvfr/react-dsfr/Input";
import type { Commune } from "../domain/types";
import { searchCommunes } from "../domain/api";

interface AutocompleteSearchProps {
  onSelect: (commune: Commune) => void;
  disabled?: boolean;
}

export default function AutocompleteSearch({ onSelect, disabled }: AutocompleteSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Commune[]>([]);

  const handleQueryChange = (newQuery: string) => {
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
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const communes = await searchCommunes(query);
      setResults(communes);
    }, 300); // Attend 300ms après la dernière frappe

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
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
      {results.length > 0 && (
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
          {results.map((c) => (
            <li
              key={c.codeINSEE}
              style={{ padding: "0.5rem 1rem", cursor: "pointer", borderBottom: "1px solid var(--border-alt-grey)" }}
              onClick={() => {
                onSelect(c);
                setResults([]);
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--background-alt-grey)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {c.nom} ({c.departement})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
