import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  analyzeSharedDependencies,
  applySharedRecommendations,
  initFwizConfig,
} from '@federation-wizards/core';

describe('fwiz analyze-shared command', () => {
  it('analyzes workspace dependencies and applies fixes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-cli-analyze-'));

    writeFileSync(join(dir, 'nx.json'), '{}');
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' } }),
    );

    mkdirSync(join(dir, 'apps', 'shell'), { recursive: true });
    mkdirSync(join(dir, 'apps', 'checkout'), { recursive: true });
    writeFileSync(join(dir, 'apps', 'shell', 'project.json'), '{}');
    writeFileSync(join(dir, 'apps', 'checkout', 'project.json'), '{}');
    writeFileSync(
      join(dir, 'apps', 'shell', 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' } }),
    );
    writeFileSync(
      join(dir, 'apps', 'checkout', 'package.json'),
      JSON.stringify({ dependencies: { react: '^18.2.0' } }),
    );

    initFwizConfig(dir);

    const analysis = analyzeSharedDependencies(dir);

    expect(analysis.conflicts).toHaveLength(1);
    expect(analysis.recommendedShared.react.requiredVersion).toBe('^19.0.0');

    const fixResult = applySharedRecommendations(
      dir,
      analysis.recommendedShared,
    );

    expect(fixResult.changes.length).toBeGreaterThan(0);
    expect(analysis.scannedPackages.length).toBeGreaterThan(1);
  });
});
