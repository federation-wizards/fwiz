import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { generateMfManifest } from '../manifest/generate.js';
import { createLocalRegistryBackend } from '../registry/backends/local.js';
import { publishManifest } from '../registry/publish.js';
import { createTestWorkspace } from '../registry/test-helpers.js';
import { detectBreakingChanges } from './breaking-changes.js';
import { validateManifests } from './index.js';
import { compareManifests } from './manifest-compare.js';
import {
  isMajorVersionBump,
  satisfiesRequired,
  validateCrossRemoteSharedDependencies,
  validateSharedDependenciesForManifest,
} from './shared-deps.js';

const registry = {
  type: 'http' as const,
  baseUrl: 'https://cdn.example.com',
  prefix: 'mf',
};

describe('shared dependency validation', () => {
  it('checks requiredVersion and strictVersion rules', () => {
    const config = {
      version: '1',
      workspace: { type: 'plain' as const },
      hosts: [{ name: 'shell', port: 4200 }],
      remotes: [{ name: 'checkout', port: 4201 }],
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.0.0',
          strictVersion: true,
          eager: false,
        },
      },
    };

    const manifest = generateMfManifest({
      remote: { name: 'checkout', port: 4201 },
      version: '1.0.0',
      shared: config.shared,
      registry,
      buildId: 'test',
    });

    manifest.shared[0]!.version = '19.1.0';

    const issues = validateSharedDependenciesForManifest(
      config,
      manifest,
      'checkout',
    );

    expect(issues.some((issue) => issue.code === 'strict-version-mismatch')).toBe(
      true,
    );
  });

  it('detects singleton version mismatches across remotes', () => {
    const config = {
      version: '1',
      workspace: { type: 'plain' as const },
      hosts: [{ name: 'shell', port: 4200 }],
      remotes: [
        { name: 'checkout', port: 4201 },
        { name: 'catalog', port: 4202 },
      ],
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.0.0',
          eager: false,
        },
      },
    };

    const checkout = generateMfManifest({
      remote: { name: 'checkout', port: 4201 },
      version: '1.0.0',
      shared: config.shared,
      registry,
      buildId: 'checkout',
    });
    const catalog = generateMfManifest({
      remote: { name: 'catalog', port: 4202 },
      version: '1.0.0',
      shared: config.shared,
      registry,
      buildId: 'catalog',
    });

    checkout.shared[0]!.version = '19.0.0';
    catalog.shared[0]!.version = '19.1.0';

    const issues = validateCrossRemoteSharedDependencies(
      [
        { remote: 'checkout', manifest: checkout },
        { remote: 'catalog', manifest: catalog },
      ],
      config,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('singleton-version-mismatch');
  });

  it('evaluates semver ranges', () => {
    expect(satisfiesRequired('19.1.0', '^19.0.0')).toBe(true);
    expect(satisfiesRequired('18.0.0', '^19.0.0')).toBe(false);
    expect(isMajorVersionBump('1.0.0', '2.0.0')).toBe(true);
    expect(isMajorVersionBump('1.9.0', '1.10.0')).toBe(false);
  });
});

describe('manifest comparison and breaking changes', () => {
  it('flags removed exposes and major version bumps', () => {
    const registryManifest = generateMfManifest({
      remote: { name: 'checkout', port: 4201 },
      version: '1.0.0',
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.0.0',
          eager: false,
        },
      },
      registry,
      buildId: 'registry',
    });

    const localManifest = generateMfManifest({
      remote: { name: 'checkout', port: 4201 },
      version: '2.0.0',
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.0.0',
          eager: false,
        },
      },
      registry,
      buildId: 'local',
    });

    localManifest.exposes = [];
    localManifest.shared[0]!.version = '20.0.0';

    const breakingIssues = detectBreakingChanges(
      localManifest,
      registryManifest,
      'checkout',
    );

    expect(
      breakingIssues.some((issue) => issue.code === 'removed-expose'),
    ).toBe(true);
    expect(
      breakingIssues.some((issue) => issue.code === 'major-version-bump'),
    ).toBe(true);
    expect(
      breakingIssues.some((issue) => issue.code === 'shared-major-bump'),
    ).toBe(true);

    const compareIssues = compareManifests(
      localManifest,
      registryManifest,
      'checkout',
    );

    expect(
      compareIssues.some((issue) => issue.code === 'removed-shared-dependency'),
    ).toBe(false);
  });
});

describe('validateManifests', () => {
  it('passes when local manifests match the registry', async () => {
    const registryDir = createTestWorkspace(registry);
    const backend = createLocalRegistryBackend(join(registryDir, '.registry'));

    await publishManifest(
      { cwd: registryDir, version: '1.0.0', remote: 'checkout' },
      backend,
    );

    const result = await validateManifests(
      { cwd: registryDir, version: '1.0.0', remote: 'checkout' },
      backend,
    );

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('reports breaking changes when validating a major version bump', async () => {
    const registryDir = createTestWorkspace(registry);
    const backend = createLocalRegistryBackend(join(registryDir, '.registry'));

    await publishManifest(
      { cwd: registryDir, version: '1.0.0', remote: 'checkout' },
      backend,
    );

    const result = await validateManifests(
      { cwd: registryDir, version: '2.0.0', remote: 'checkout' },
      backend,
    );

    expect(result.errors).toHaveLength(0);
    expect(
      result.warnings.some((issue) => issue.code === 'major-version-bump'),
    ).toBe(true);
  });
});
