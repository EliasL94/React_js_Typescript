import { setLink, type RegisteredLinkProps } from '@codegouvfr/react-dsfr/link';
import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';

declare module '@codegouvfr/react-dsfr/link' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

setLink({ Link: Link as ComponentType<RegisteredLinkProps & { children: ReactNode }> });
