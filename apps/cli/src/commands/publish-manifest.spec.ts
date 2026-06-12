import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createLocalRegistryBackend,
  publishManifest,
  rollbackManifest,
} from '@federation-wizards/core';
import { stringify as stringifyYaml } from 'yaml';

function createWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fwiz-cli-publish-'));

  const config = {
    version: '1',
    workspace: { type: 'plain' },
    hosts: [{ name: 'shell', port: 4200 }],
    remotes: [{ name: 'checkout', port: 4201 }],
    shared: {
      react: {
        singleton: true,
        requiredVersion: '^19.0.0',
        eager: false,
      },
    },
    registry: {
      type: 'http',
      baseUrl: 'https://cdn.example.com',
      prefix: 'mf',
    },
  };

  writeWorkspaceConfig(dir, config);
  return dir;
}

function writeWorkspaceConfig(dir: string, config: unknown): void {
  writeFileSync(
    join(dir, 'fwiz.config.yaml'),
    `${stringifyYaml(config)}\n`,
    'utf8',
  );
}

describe('fwiz publish-manifest command', () => {
  it('publishes and rolls back a remote through core APIs', async () => {
    const dir = createWorkspace();
    const backend = createLocalRegistryBackend(join(dir, '.registry'));

    const publishResult = await publishManifest(
      {
        cwd: dir,
        version: '1.0.0',
        remote: 'checkout',
      },
      backend,
    );

    expect(publishResult.remotes[0]?.name).toBe('checkout');

    const rollbackResult = await rollbackManifest(
      {
        cwd: dir,
        remote: 'checkout',
        version: '1.0.0',
        dryRun: true,
      },
      backend,
    );

    expect(rollbackResult.dryRun).toBe(true);
    expect(rollbackResult.previousVersion).toBe('1.0.0');

    const manifest = readFileSync(
      join(dir, '.registry/mf/checkout/1.0.0/mf-manifest.json'),
      'utf8',
    );

    expect(manifest).toContain('"name": "checkout"');
  });
});
