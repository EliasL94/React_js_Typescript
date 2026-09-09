import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import {
  CommuneIntrouvableError,
  estCodeInseeValide,
  recupererCommune,
  type Commune,
} from './domain/commune';
import { AccueilPage } from './pages/AccueilPage';
import { ChargementPage } from './pages/ChargementPage';
import { ErreurRoute } from './pages/ErreurRoute';
import { NotFoundPage } from './pages/NotFoundPage';
import { ResultatPage } from './pages/ResultatPage';

export type DonneesResultat = { commune: Commune };

export async function chargerResultat({
  params,
  request,
}: LoaderFunctionArgs): Promise<DonneesResultat> {
  const code = params.codeInsee ?? '';

  if (!estCodeInseeValide(code)) {
    throw new Response('Not Found', { status: 404 });
  }

  try {
    return { commune: await recupererCommune(code, { signal: request.signal }) };
  } catch (erreur) {
    if (erreur instanceof CommuneIntrouvableError) {
      throw new Response('Not Found', { status: 404 });
    }
    throw erreur;
  }
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <AccueilPage /> },
      {
        path: 'partie/:codeInsee',
        element: <ResultatPage />,
        loader: chargerResultat,
        errorElement: <ErreurRoute />,
        hydrateFallbackElement: <ChargementPage />,
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
