import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createLocalRegistryBackend } from './backends/local.js';
import { publishManifest } from './publish.js';
import { createTestWorkspace } from './test-helpers.js';
import type { RemotesRegistry } from './types.js';

describe('publishManifest', () => {
  it('publishes manifests and updates remotes-registry.json in a local round-trip', async () => {
    const registryDir = createTestWorkspace({
      type: 'http',
      baseUrl: 'https://cdn.example.com',
      prefix: 'mf',
    });
    const backend = createLocalRegistryBackend(join(registryDir, '.registry'));

    const result = await publishManifest(
      {
        cwd: registryDir,
        version: '2.0.0',
        remote: 'checkout',
      },
      backend,
    );

    expect(result.dryRun).toBe(false);
    expect(result.version).toBe('2.0.0');
    expect(result.remotes).toHaveLength(1);
    expect(result.remotes[0]?.manifestUrl).toBe(
      'https://cdn.example.com/mf/checkout/2.0.0/mf-manifest.json',
    );

    const manifest = JSON.parse(
      readFileSync(
        join(registryDir, '.registry/mf/checkout/2.0.0/mf-manifest.json'),
        'utf8',
      ),
    ) as { name: string; metaData: { buildInfo: { buildVersion: string } } };

    expect(manifest.name).toBe('checkout');
    expect(manifest.metaData.buildInfo.buildVersion).toBe('2.0.0');

    const remotesRegistry = JSON.parse(
      readFileSync(join(registryDir, '.registry/mf/remotes-registry.json'), 'utf8'),
    ) as RemotesRegistry;

    expect(remotesRegistry.remotes.checkout?.current).toBe('2.0.0');
    expect(
      remotesRegistry.remotes.checkout?.versions['2.0.0']?.manifestUrl,
    ).toBe('https://cdn.example.com/mf/checkout/2.0.0/mf-manifest.json');
  });

  it('supports dry-run without writing files', async () => {
    const registryDir = createTestWorkspace({
      type: 'http',
      baseUrl: 'https://cdn.example.com',
    });
    const backend = createLocalRegistryBackend(join(registryDir, '.registry'));

    const result = await publishManifest(
      {
        cwd: registryDir,
        version: '1.0.0',
        dryRun: true,
      },
      backend,
    );

    expect(result.dryRun).toBe(true);
    expect(result.registryUpdated).toBe(false);
    expect(result.remotes[0]?.uploaded).toBe(false);
  });
});
