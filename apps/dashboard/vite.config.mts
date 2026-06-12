/// <reference types='vitest' />
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

import type { RuntimeSnapshot } from '../../../libs/mf-plugins/src/lib/runtime-inspector.js';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

function readConfigFromEnv(): unknown {
  const raw = process.env['FWIZ_CONFIG_JSON'];

  if (!raw) {
    return {
      version: '1',
      workspace: { type: 'plain' },
      hosts: [],
      remotes: [],
      shared: {},
    };
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      version: '1',
      workspace: { type: 'plain' },
      hosts: [],
      remotes: [],
      shared: {},
    };
  }
}

function fwizApiPlugin(): Plugin {
  const runtimeStore = new Map<string, RuntimeSnapshot>();

  return {
    name: 'fwiz-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';

        if (url === '/api/config' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(readConfigFromEnv()));
          return;
        }

        if (url === '/api/runtime' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(Array.from(runtimeStore.values())));
          return;
        }

        const runtimeMatch = url.match(/^\/api\/runtime\/([^/?]+)/);

        if (runtimeMatch && req.method === 'POST') {
          const hostName = decodeURIComponent(runtimeMatch[1] ?? '');
          const chunks: Buffer[] = [];

          req.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          req.on('end', () => {
            try {
              const body = JSON.parse(
                Buffer.concat(chunks).toString('utf8'),
              ) as RuntimeSnapshot;
              runtimeStore.set(hostName, { ...body, hostName });
              res.statusCode = 204;
              res.end();
            } catch {
              res.statusCode = 400;
              res.end('Invalid runtime snapshot payload');
            }
          });

          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/dashboard',
  resolve: {
    alias: {
      '@federation-wizards/core': join(workspaceRoot, 'libs/core/src/index.ts'),
      '@federation-wizards/mf-plugins': join(
        workspaceRoot,
        'libs/mf-plugins/src/index.ts',
      ),
    },
  },
  server: {
    port: 5000,
    host: 'localhost',
  },
  preview: {
    port: 5000,
    host: 'localhost',
  },
  plugins: [react(), fwizApiPlugin()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: '@federation-wizards/dashboard',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
