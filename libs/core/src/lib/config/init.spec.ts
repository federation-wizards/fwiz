import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import { createDefaultConfig } from './defaults.js';
import { initFwizConfig, FWIZ_CONFIG_FILENAME } from './init.js';
import { validateFwizConfig } from './schema.js';
import { detectWorkspace } from '../workspace/detect.js';

describe('detectWorkspace', () => {
  it('detects Nx workspaces', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-nx-'));
    writeFileSync(join(dir, 'nx.json'), '{}');

    expect(detectWorkspace(dir).type).toBe('nx');
  });

  it('detects Turborepo workspaces', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-turbo-'));
    writeFileSync(join(dir, 'turbo.json'), '{}');

    expect(detectWorkspace(dir).type).toBe('turbo');
  });

  it('lists Nx app projects from apps/', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-apps-'));
    writeFileSync(join(dir, 'nx.json'), '{}');
    mkdirSync(join(dir, 'apps', 'shell'), { recursive: true });
    mkdirSync(join(dir, 'apps', 'checkout'), { recursive: true });
    writeFileSync(join(dir, 'apps', 'shell', 'project.json'), '{}');
    writeFileSync(join(dir, 'apps', 'checkout', 'project.json'), '{}');

    expect(detectWorkspace(dir).appProjects).toEqual(['checkout', 'shell']);
  });

  it('lists Nx app projects from package.json nx targets', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-apps-pkg-'));
    writeFileSync(join(dir, 'nx.json'), '{}');
    mkdirSync(join(dir, 'apps', 'shell'), { recursive: true });
    writeFileSync(
      join(dir, 'apps', 'shell', 'package.json'),
      JSON.stringify({ name: 'shell', nx: { targets: {} } }),
    );

    expect(detectWorkspace(dir).appProjects).toEqual(['shell']);
  });

  it('respects custom appsDir from nx.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-apps-custom-'));
    writeFileSync(
      join(dir, 'nx.json'),
      JSON.stringify({ workspaceLayout: { appsDir: 'applications' } }),
    );
    mkdirSync(join(dir, 'applications', 'shell'), { recursive: true });
    writeFileSync(join(dir, 'applications', 'shell', 'project.json'), '{}');

    expect(detectWorkspace(dir).appProjects).toEqual(['shell']);
  });
});

describe('createDefaultConfig', () => {
  it('creates placeholder host and remote for plain workspaces', () => {
    const config = createDefaultConfig({
      type: 'plain',
      appProjects: [],
    });

    expect(config.workspace.type).toBe('plain');
    expect(config.hosts).toEqual([{ name: 'shell', port: 4200 }]);
    expect(config.remotes).toEqual([{ name: 'remote', port: 4201 }]);
    expect(config.shared.react.singleton).toBe(true);
  });

  it('maps discovered app projects to hosts and remotes', () => {
    const config = createDefaultConfig({
      type: 'nx',
      appProjects: ['shell', 'checkout', 'profile'],
      reactVersion: '^19.0.0',
    });

    expect(config.hosts).toEqual([
      { name: 'shell', project: 'shell', port: 4200 },
    ]);
    expect(config.remotes).toEqual([
      { name: 'checkout', project: 'checkout', port: 4201 },
      { name: 'profile', project: 'profile', port: 4202 },
    ]);
    expect(config.shared.react.requiredVersion).toBe('^19.0.0');
  });
});

describe('validateFwizConfig', () => {
  it('accepts a valid config', () => {
    const config = createDefaultConfig({
      type: 'plain',
      appProjects: [],
    });

    expect(validateFwizConfig(config).valid).toBe(true);
  });

  it('reports validation warnings for invalid configs', () => {
    const result = validateFwizConfig({ version: '1' });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('initFwizConfig', () => {
  it('creates fwiz.config.yaml in an empty directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-init-'));
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' } }),
    );

    const result = initFwizConfig(dir);

    expect(result.created).toBe(true);
    expect(readFileSync(join(dir, FWIZ_CONFIG_FILENAME), 'utf8')).toContain(
      'version: "1"',
    );
  });

  it('is idempotent when config already exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-idempotent-'));
    const config = createDefaultConfig({ type: 'plain', appProjects: [] });
    writeFileSync(
      join(dir, FWIZ_CONFIG_FILENAME),
      `${stringifyYaml(config)}\n`,
      'utf8',
    );

    const first = initFwizConfig(dir);
    const second = initFwizConfig(dir);

    expect(first.created).toBe(false);
    expect(second.created).toBe(false);
    expect(
      parseYaml(readFileSync(join(dir, FWIZ_CONFIG_FILENAME), 'utf8')),
    ).toEqual(config);
  });

  it('patches nx.json when initializing an Nx workspace', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-init-nx-'));
    writeFileSync(join(dir, 'nx.json'), '{}\n', 'utf8');
    mkdirSync(join(dir, 'apps', 'shell'), { recursive: true });
    mkdirSync(join(dir, 'apps', 'checkout'), { recursive: true });
    writeFileSync(join(dir, 'apps', 'shell', 'project.json'), '{}');
    writeFileSync(join(dir, 'apps', 'checkout', 'project.json'), '{}');

    const result = initFwizConfig(dir);

    expect(result.created).toBe(true);
    expect(result.workspacePatches.some((patch) => patch.patched)).toBe(true);
    expect(JSON.parse(readFileSync(join(dir, 'nx.json'), 'utf8')).fwiz).toBeDefined();
  });
});
