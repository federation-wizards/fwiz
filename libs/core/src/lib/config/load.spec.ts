import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { stringify as stringifyYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import { createDefaultConfig } from './defaults.js';
import { FWIZ_CONFIG_FILENAME } from './init.js';
import { FwizConfigError, loadFwizConfig } from './load.js';

describe('loadFwizConfig', () => {
  it('loads and validates an existing config', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-load-'));
    const config = createDefaultConfig({ type: 'plain', appProjects: [] });

    writeFileSync(
      join(dir, FWIZ_CONFIG_FILENAME),
      `${stringifyYaml(config)}\n`,
      'utf8',
    );

    expect(loadFwizConfig(dir)).toEqual(config);
  });

  it('throws when config is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-load-missing-'));

    expect(() => loadFwizConfig(dir)).toThrow(FwizConfigError);
    expect(() => loadFwizConfig(dir)).toThrow(/Run fwiz init first/);
  });

  it('throws when config is invalid', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-load-invalid-'));
    writeFileSync(join(dir, FWIZ_CONFIG_FILENAME), 'version: "1"\n', 'utf8');

    expect(() => loadFwizConfig(dir)).toThrow(FwizConfigError);
    expect(() => loadFwizConfig(dir)).toThrow(/Invalid config/);
  });
});
