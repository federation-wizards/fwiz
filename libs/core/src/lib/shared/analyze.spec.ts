import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import { createDefaultConfig } from '../config/defaults.js';
import { FWIZ_CONFIG_FILENAME } from '../config/init.js';
import {
  analyzeSharedDependencies,
  applySharedRecommendations,
  formatSharedAnalysisTable,
} from './analyze.js';

function createConflictingWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fwiz-analyze-conflict-'));

  writeFileSync(join(dir, 'nx.json'), '{}');
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ dependencies: { react: '^19.0.0' } }),
  );

  mkdirSync(join(dir, 'apps', 'shell'), { recursive: true });
  mkdirSync(join(dir, 'apps', 'checkout'), { recursive: true });
  mkdirSync(join(dir, 'libs', 'ui'), { recursive: true });

  writeFileSync(
    join(dir, 'apps', 'shell', 'package.json'),
    JSON.stringify({
      dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    }),
  );
  writeFileSync(
    join(dir, 'apps', 'checkout', 'package.json'),
    JSON.stringify({
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
    }),
  );
  writeFileSync(
    join(dir, 'libs', 'ui', 'package.json'),
    JSON.stringify({
      peerDependencies: { react: '^19.0.0' },
    }),
  );

  const config = createDefaultConfig({
    type: 'nx',
    appProjects: ['shell', 'checkout'],
    reactVersion: '^18.2.0',
  });

  writeFileSync(
    join(dir, FWIZ_CONFIG_FILENAME),
    `${stringifyYaml(config)}\n`,
    'utf8',
  );

  return dir;
}

describe('analyzeSharedDependencies', () => {
  it('detects common dependencies and version conflicts', () => {
    const dir = createConflictingWorkspace();
    const result = analyzeSharedDependencies(dir);

    expect(result.scannedPackages).toEqual([
      'apps/checkout/package.json',
      'apps/shell/package.json',
      'libs/ui/package.json',
      'package.json',
    ]);

    const react = result.sharedDependencies.find(
      (dependency) => dependency.name === 'react',
    );

    expect(react?.projectCount).toBe(4);
    expect(react?.hasConflict).toBe(true);
    expect(react?.recommended.singleton).toBe(true);
    expect(react?.recommended.requiredVersion).toBe('^19.0.0');

    expect(result.conflicts).toHaveLength(2);
    expect(result.recommendedShared.react.requiredVersion).toBe('^19.0.0');
  });

  it('formats a readable console table', () => {
    const dir = createConflictingWorkspace();
    const result = analyzeSharedDependencies(dir);
    const table = formatSharedAnalysisTable(result);

    expect(table).toContain('Package');
    expect(table).toContain('react');
    expect(table).toContain('Version conflicts:');
    expect(table).toContain('Align all projects to ^19.0.0');
  });
});

describe('applySharedRecommendations', () => {
  it('updates fwiz.config.yaml with recommended shared settings', () => {
    const dir = createConflictingWorkspace();
    const analysis = analyzeSharedDependencies(dir);
    const fixResult = applySharedRecommendations(
      dir,
      analysis.recommendedShared,
    );

    expect(fixResult.changes.length).toBeGreaterThan(0);

    const config = parseYaml(
      readFileSync(join(dir, FWIZ_CONFIG_FILENAME), 'utf8'),
    ) as {
      shared: Record<string, { requiredVersion: string; singleton: boolean }>;
    };

    expect(config.shared.react.requiredVersion).toBe('^19.0.0');
    expect(config.shared.react.singleton).toBe(true);
    expect(config.shared['react-dom'].requiredVersion).toBe('^19.0.0');
  });
});
