/**
 * Shared render helper for component tests.
 *
 * Wraps the component under test with the providers the application supplies in
 * `App.tsx` (ThemeProvider, AuthProvider, Router) so individual tests don't have
 * to re-declare them and can't drift out of sync with the real tree.
 *
 * i18n is initialised by the global test setup (`src/test/setup.ts`).
 */

import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

export interface ProviderOptions {
  /** Initial history entry for the MemoryRouter. */
  initialEntries?: string[];
}

function createWrapper({ initialEntries = ['/'] }: ProviderOptions = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </AuthProvider>
      </ThemeProvider>
    );
  };
}

/**
 * `render` with the application providers in place.
 * Accepts the same options as `render` plus `initialEntries`.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {}
) {
  const { initialEntries, ...renderOptions } = options;

  return render(ui, {
    wrapper: createWrapper({ initialEntries }),
    ...renderOptions
  });
}
