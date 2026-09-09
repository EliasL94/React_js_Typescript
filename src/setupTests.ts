import '@testing-library/jest-dom/vitest';
import { transferableAbortController } from 'node:util';
import './dsfr';

const AbortControllerNatif = Object.getPrototypeOf(transferableAbortController())
  .constructor as typeof AbortController;

globalThis.AbortController = AbortControllerNatif;
globalThis.AbortSignal = Object.getPrototypeOf(new AbortControllerNatif().signal)
  .constructor as typeof AbortSignal;
