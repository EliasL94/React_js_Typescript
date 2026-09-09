import { useEffect } from 'react';

const SUFFIXE = 'Communle';

export function useTitreDocument(titre: string): void {
  useEffect(() => {
    document.title = `${titre} — ${SUFFIXE}`;
  }, [titre]);
}
