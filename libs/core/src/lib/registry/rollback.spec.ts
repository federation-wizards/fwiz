import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createLocalRegistryBackend } from './backends/local.js';
import { publishManifest } from './publish.js';
import { rollbackManifest } from './rollback.js';
import { createTestWorkspace } from './test-helpers.js';
import type { RemotesRegistry } from './types.js';

describe('rollbackManifest', () => {
  it('rolls back to the previous published version', async () => {
    const registryDir = createTestWorkspace({
      type: 'http',
      baseUrl: 'https://cdn.example.com',
      prefix: 'mf',
    });
    const backend = createLocalRegistryBackend(join(registryDir, '.registry'));

    await publishManifest(
      { cwd: registryDir, version: '1.0.0', remote: 'checkout' },
      backend,
    );
    await publishManifest(
      { cwd: registryDir, version: '2.0.0', remote: 'checkout' },
      backend,
    );

    const result = await rollbackManifest(
      { cwd: registryDir, remote: 'checkout' },
      backend,
    );

    expect(result.rolledBack).toBe(true);
    expect(result.currentVersion).toBe('2.0.0');
    expect(result.previousVersion).toBe('1.0.0');

    const remotesRegistry = JSON.parse(
      readFileSync(join(registryDir, '.registry/mf/remotes-registry.json'), 'utf8'),
    ) as RemotesRegistry;

    expect(remotesRegistry.remotes.checkout?.current).toBe('1.0.0');
    expect(remotesRegistry.remotes.checkout?.versions['2.0.0']).toBeDefined();
  });

  it('rolls back to an explicit version', async () => {
    const registryDir = createTestWorkspace({
      type: 'http',
      baseUrl: 'https://cdn.example.com',
    });
    const backend = createLocalRegistryBackend(join(registryDir, '.registry'));

    await publishManifest(
      { cwd: registryDir, version: '1.0.0', remote: 'checkout' },
      backend,
    );
    await publishManifest(
      { cwd: registryDir, version: '2.0.0', remote: 'checkout' },
      backend,
    );
    await publishManifest(
      { cwd: registryDir, version: '3.0.0', remote: 'checkout' },
      backend,
    );

    const result = await rollbackManifest(
      {
        cwd: registryDir,
        remote: 'checkout',
        version: '1.0.0',
      },
      backend,
    );

    expect(result.previousVersion).toBe('1.0.0');

    const remotesRegistry = JSON.parse(
      readFileSync(join(registryDir, '.registry/remotes-registry.json'), 'utf8'),
    ) as RemotesRegistry;

    expect(remotesRegistry.remotes.checkout?.current).toBe('1.0.0');
  });
});
