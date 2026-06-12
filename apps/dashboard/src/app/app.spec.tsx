import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from './app';

const sampleConfig = {
  version: '1',
  workspace: { type: 'nx' },
  hosts: [{ name: 'shell', port: 4200, project: 'shell' }],
  remotes: [{ name: 'checkout', port: 4201, project: 'checkout' }],
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19.0.0',
      eager: false,
    },
  },
};

describe('App', () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe(): void {
        // jsdom polyfill for React Flow
      }
      unobserve(): void {
        // jsdom polyfill for React Flow
      }
      disconnect(): void {
        // jsdom polyfill for React Flow
      }
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith('/api/config')) {
          return Promise.resolve({
            ok: true,
            json: async () => sampleConfig,
          });
        }

        if (url.endsWith('/api/runtime')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }

        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete document.documentElement.dataset.theme;
  });

  it('renders successfully', async () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText(/fwiz dashboard/i)).toBeTruthy(),
    );
  });

  it('loads federation graph nodes from config API', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('shell')).toBeTruthy());
    expect(screen.getByText('checkout')).toBeTruthy();
    expect(screen.getByText('react')).toBeTruthy();
  });

  it('defaults to dark mode theme', async () => {
    render(<App />);

    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe('dark'),
    );
  });
});
