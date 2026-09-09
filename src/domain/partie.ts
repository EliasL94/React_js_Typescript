export const NB_ESSAIS_MAX = 6;

export type StatutPartie = 'gagne' | 'perdu';

export type ResultatPartie = {
  statut: StatutPartie;
  essais: number;
};

const STATUTS: readonly string[] = ['gagne', 'perdu'];

function estStatut(valeur: string): valeur is StatutPartie {
  return STATUTS.includes(valeur);
}

export function lireResultat(params: URLSearchParams): ResultatPartie | null {
  const statut = params.get('statut');
  const essaisBrut = params.get('essais');

  if (statut === null || essaisBrut === null) return null;
  if (!estStatut(statut)) return null;
  if (!/^\d+$/.test(essaisBrut)) return null;

  const essais = Number(essaisBrut);
  if (essais < 1 || essais > NB_ESSAIS_MAX) return null;

  return { statut, essais };
}

export function construireCheminResultat(
  code: string,
  resultat?: ResultatPartie,
): string {
  const chemin = `/partie/${encodeURIComponent(code)}`;
  if (resultat === undefined) return chemin;

  const params = new URLSearchParams({
    statut: resultat.statut,
    essais: String(resultat.essais),
  });
  return `${chemin}?${params.toString()}`;
}
