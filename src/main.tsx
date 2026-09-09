import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import '@codegouvfr/react-dsfr/main.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Link, RouterProvider } from 'react-router-dom';
import './dsfr';
import './index.css';
import { routes } from './routes';

startReactDsfr({ defaultColorScheme: 'system', Link });

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
