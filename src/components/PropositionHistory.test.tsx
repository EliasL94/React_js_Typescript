import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { normaliserCommune } from '../domain/commune';
import { compareCommunes } from '../domain/game';
import PropositionHistory, { type Proposition } from './PropositionHistory';

const geo = (longitude: number, latitude: number) => ({
  type: 'Point',
  coordinates: [longitude, latitude],
});

const PARIS = normaliserCommune({
  nom: 'Paris',
  code: '75056',
  population: 2103778,
  centre: geo(2.347, 48.8589),
  departement: { code: '75', nom: 'Paris' },
});

const LYON = normaliserCommune({
  nom: 'Lyon',
  code: '69123',
  population: 519127,
  centre: geo(4.8351, 45.758),
  departement: { code: '69', nom: 'Rhône' },
});

const BOBIGNY = normaliserCommune({
  nom: 'Bobigny',
  code: '93008',
  population: 56927,
  centre: geo(2.4432, 48.9073),
  departement: { code: '93', nom: 'Seine-Saint-Denis' },
});

const proposer = (...communes: ReturnType<typeof normaliserCommune>[]): Proposition[] =>
  communes.map((commune) => ({ commune, indices: compareCommunes(commune, PARIS) }));

describe('US B3 : état de succès', () => {
  // Preuve : le nombre de résultats est annoncé avant la liste elle-même.
  it('annonce le décompte en légende, avant les lignes', () => {
    render(<PropositionHistory propositions={proposer(LYON, BOBIGNY)} />);

    const tableau = screen.getByRole('table');
    const legende = within(tableau).getByText('2 propositions sur 6');

    expect(legende.tagName).toBe('CAPTION');
    expect(tableau.firstElementChild).toBe(legende);
  });

  it('accorde le singulier sur une seule proposition', () => {
    render(<PropositionHistory propositions={proposer(LYON)} />);

    expect(screen.getByText('1 proposition sur 6')).toBeVisible();
  });

  it('suit le nombre d’essais qu’on lui donne', () => {
    render(<PropositionHistory propositions={proposer(LYON)} nbEssaisMax={10} />);

    expect(screen.getByText('1 proposition sur 10')).toBeVisible();
  });

  // Preuve : la liste utilise un composant DSFR.
  it('s’appuie sur le composant Table du paquet officiel', () => {
    const { container } = render(<PropositionHistory propositions={proposer(LYON)} />);

    expect(container.querySelector('.fr-table')).not.toBeNull();
    expect(screen.getByRole('table')).toBeVisible();
  });

  it('n’écrit aucune couleur en dur dans ses styles', () => {
    const { container } = render(<PropositionHistory propositions={proposer(LYON)} />);

    for (const noeud of container.querySelectorAll<HTMLElement>('[style]')) {
      expect(noeud.getAttribute('style')).not.toMatch(/#[0-9a-f]{3,8}\b|rgb|hsl/i);
    }
  });

  it('affiche une ligne lisible par proposition', () => {
    render(<PropositionHistory propositions={proposer(LYON)} />);

    const ligne = screen.getByRole('row', { name: /Lyon/ });

    expect(within(ligne).getByText('392 km')).toBeVisible();
    expect(within(ligne).getByText('Nord-Ouest')).toBeVisible();
    expect(within(ligne).getByText('Plus peuplée')).toBeVisible();
  });

  it('conserve l’ordre dans lequel les propositions arrivent', () => {
    render(<PropositionHistory propositions={proposer(LYON, BOBIGNY)} />);

    const lignes = screen.getAllByRole('row').slice(1);

    expect(lignes[0]).toHaveTextContent('Lyon');
    expect(lignes[1]).toHaveTextContent('Bobigny');
  });

  // Preuve : un enregistrement aux champs incomplets s'affiche sans casser la
  // mise en page.
  it('affiche une commune amputée sans casser la mise en page', () => {
    const amputee = normaliserCommune({ nom: 'Amputée', code: '00001' });

    render(<PropositionHistory propositions={proposer(LYON, amputee)} />);

    const ligne = screen.getByRole('row', { name: /Amputée/ });

    expect(within(ligne).getAllByRole('cell')).toHaveLength(4);
    expect(ligne).not.toHaveTextContent('undefined');
    expect(ligne).not.toHaveTextContent('NaN');
    expect(ligne).not.toHaveTextContent('null');
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('n’invente pas un département manquant', () => {
    const sansDepartement = normaliserCommune({
      nom: 'Isolée',
      code: '00002',
      population: 10,
      centre: geo(1, 1),
    });

    render(<PropositionHistory propositions={proposer(sansDepartement)} />);

    const ligne = screen.getByRole('row', { name: /Isolée/ });
    expect(ligne).toHaveTextContent('Isolée');
    expect(ligne).not.toHaveTextContent('()');
  });

  // Une population inconnue ne doit surtout pas s'annoncer comme « égale » :
  // ce serait un indice faux donné au joueur.
  it('n’annonce pas une population égale quand elle est inconnue', () => {
    const sansPopulation = normaliserCommune({
      nom: 'Muette',
      code: '00003',
      centre: geo(1, 1),
    });

    render(<PropositionHistory propositions={proposer(sansPopulation)} />);

    const ligne = screen.getByRole('row', { name: /Muette/ });

    expect(ligne).not.toHaveTextContent('Population égale');
    expect(within(ligne).getAllByText('Non renseigné').length).toBeGreaterThan(0);
  });

  it('affiche l’état initial tant qu’aucune proposition n’a été faite', () => {
    render(
      <MemoryRouter>
        <PropositionHistory propositions={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Comment jouer à Communle/)).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
  });

  // L'état initial résume les règles, il ne les recopie pas : la page dédiée
  // reste la référence, et l'accueil doit y mener.
  it('renvoie vers la page des règles depuis l’état initial', () => {
    render(
      <MemoryRouter>
        <PropositionHistory propositions={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /règles du jeu/i })).toHaveAttribute(
      'href',
      '/regles',
    );
  });
});
