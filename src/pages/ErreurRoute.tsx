import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ErreurPage } from './ErreurPage';
import { NotFoundPage } from './NotFoundPage';

export function ErreurRoute() {
  const erreur = useRouteError();

  if (isRouteErrorResponse(erreur) && erreur.status === 404) {
    return <NotFoundPage />;
  }

  return <ErreurPage />;
}
