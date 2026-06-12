import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createLocalRegistryBackend,
  publishManifest,
  validateManifests,
} from '@federation-wizards/core';
import { stringify as stringifyYaml } from 'yaml';

import { resolveValidateExitCode } from './validate.js';

function createWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fwiz-cli-validate-'));

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

  writeFileSync(
    join(dir, 'fwiz.config.yaml'),
    `${stringifyYaml(config)}\n`,
    'utf8',
  );

  return dir;
}

describe('fwiz validate command', () => {
  it('resolves CI exit codes for errors and warnings', () => {
    expect(
      resolveValidateExitCode(
        { version: '1.0.0', remotes: ['checkout'], errors: [], warnings: [] },
        true,
      ),
    ).toBe(0);
    expect(
      resolveValidateExitCode(
        {
          version: '1.0.0',
          remotes: ['checkout'],
          errors: [{ level: 'error', code: 'x', message: 'bad' }],
          warnings: [],
        },
        true,
      ),
    ).toBe(1);
    expect(
      resolveValidateExitCode(
        {
          version: '2.0.0',
          remotes: ['checkout'],
          errors: [],
          warnings: [{ level: 'warning', code: 'x', message: 'warn' }],
        },
        true,
      ),
    ).toBe(2);
    expect(
      resolveValidateExitCode(
        {
          version: '2.0.0',
          remotes: ['checkout'],
          errors: [],
          warnings: [{ level: 'warning', code: 'x', message: 'warn' }],
        },
        false,
      ),
    ).toBe(0);
  });

  it('validates a published remote through core APIs', async () => {
    const dir = createWorkspace();
    const backend = createLocalRegistryBackend(join(dir, '.registry'));

    await publishManifest(
      { cwd: dir, version: '1.0.0', remote: 'checkout' },
      backend,
    );

    const result = await validateManifests(
      { cwd: dir, version: '1.0.0', remote: 'checkout' },
      backend,
    );

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
