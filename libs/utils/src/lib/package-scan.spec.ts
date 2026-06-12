import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  discoverPackageJsonPaths,
  scanWorkspacePackages,
} from './package-scan.js';

function createNxFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fwiz-scan-nx-'));

  writeFileSync(
    join(dir, 'nx.json'),
    JSON.stringify({
      workspaceLayout: { appsDir: 'applications', libsDir: 'packages' },
    }),
  );
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'root', dependencies: { react: '^19.0.0' } }),
  );

  mkdirSync(join(dir, 'applications', 'shell'), { recursive: true });
  mkdirSync(join(dir, 'applications', 'checkout'), { recursive: true });
  mkdirSync(join(dir, 'packages', 'ui'), { recursive: true });

  writeFileSync(
    join(dir, 'applications', 'shell', 'package.json'),
    JSON.stringify({
      name: 'shell',
      dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    }),
  );
  writeFileSync(
    join(dir, 'applications', 'checkout', 'package.json'),
    JSON.stringify({
      name: 'checkout',
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
    }),
  );
  writeFileSync(
    join(dir, 'packages', 'ui', 'package.json'),
    JSON.stringify({
      name: '@acme/ui',
      peerDependencies: { react: '^19.0.0' },
    }),
  );

  return dir;
}

describe('package-scan', () => {
  it('discovers root, apps, and libs package.json files', () => {
    const dir = createNxFixture();

    expect(discoverPackageJsonPaths(dir)).toEqual([
      'applications/checkout/package.json',
      'applications/shell/package.json',
      'package.json',
      'packages/ui/package.json',
    ]);
  });

  it('parses dependency sections from workspace packages', () => {
    const dir = createNxFixture();
    const manifests = scanWorkspacePackages(dir);

    expect(manifests).toHaveLength(4);

    const shell = manifests.find(
      (manifest) => manifest.path === 'applications/shell/package.json',
    );

    expect(shell?.dependencies).toEqual({
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    });
  });
});
