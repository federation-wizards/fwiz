import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { stringify as stringifyYaml } from 'yaml';

import { createDefaultConfig } from '../config/defaults.js';
import { FWIZ_CONFIG_FILENAME } from '../config/init.js';
import type { FwizConfig, RegistryConfig } from '../config/types.js';

export function createTestWorkspace(
  registry: RegistryConfig,
  overrides: Partial<FwizConfig> = {},
): string {
  const dir = mkdtempSync(join(tmpdir(), 'fwiz-registry-'));
  const config = {
    ...createDefaultConfig({
      type: 'plain',
      appProjects: ['shell', 'checkout'],
    }),
    registry,
    ...overrides,
  } satisfies FwizConfig;

  writeFileSync(
    join(dir, FWIZ_CONFIG_FILENAME),
    `${stringifyYaml(config)}\n`,
    'utf8',
  );

  return dir;
}
