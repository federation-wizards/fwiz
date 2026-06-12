import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { initFwizConfig } from '@federation-wizards/core';
import { parse as parseYaml } from 'yaml';

describe('fwiz init command', () => {
  it('creates fwiz.config.yaml with sensible defaults', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-cli-init-'));
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' } }),
    );

    const result = initFwizConfig(dir);

    expect(result.created).toBe(true);

    const config = parseYaml(
      readFileSync(join(dir, 'fwiz.config.yaml'), 'utf8'),
    ) as { version: string; hosts: unknown[]; remotes: unknown[] };

    expect(config.version).toBe('1');
    expect(config.hosts.length).toBeGreaterThan(0);
    expect(config.remotes.length).toBeGreaterThan(0);
  });
});
