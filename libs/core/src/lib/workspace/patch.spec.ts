import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createDefaultConfig } from '../config/defaults.js';
import { patchNxJson } from './patch-nx.js';
import { patchTurboJson } from './patch-turbo.js';
import { patchWorkspaceConfig } from './patch.js';

describe('patchNxJson', () => {
  it('adds fwiz project references to nx.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-patch-nx-'));
    writeFileSync(join(dir, 'nx.json'), '{}\n', 'utf8');

    const config = createDefaultConfig({
      type: 'nx',
      appProjects: ['shell', 'checkout'],
    });

    const result = patchNxJson(dir, config);

    expect(result.patched).toBe(true);
    expect(JSON.parse(readFileSync(join(dir, 'nx.json'), 'utf8'))).toEqual({
      fwiz: {
        config: 'fwiz.config.yaml',
        hosts: [{ name: 'shell', project: 'shell', port: 4200 }],
        remotes: [
          { name: 'checkout', project: 'checkout', port: 4201 },
        ],
      },
    });
  });

  it('is idempotent when nx.json is already patched', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-patch-nx-idempotent-'));
    const config = createDefaultConfig({
      type: 'nx',
      appProjects: ['shell', 'checkout'],
    });

    patchNxJson(dir, config);
    const result = patchNxJson(dir, config);

    expect(result.patched).toBe(false);
  });
});

describe('patchTurboJson', () => {
  it('adds fwiz project references to turbo.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-patch-turbo-'));
    writeFileSync(join(dir, 'turbo.json'), '{"tasks":{}}\n', 'utf8');

    const config = createDefaultConfig({
      type: 'turbo',
      appProjects: ['shell', 'checkout'],
    });

    const result = patchTurboJson(dir, config);

    expect(result.patched).toBe(true);
    expect(JSON.parse(readFileSync(join(dir, 'turbo.json'), 'utf8'))).toEqual({
      tasks: {},
      fwiz: {
        config: 'fwiz.config.yaml',
        hosts: [{ name: 'shell', project: 'shell', port: 4200 }],
        remotes: [
          { name: 'checkout', project: 'checkout', port: 4201 },
        ],
      },
    });
  });
});

describe('patchWorkspaceConfig', () => {
  it('patches nx.json and turbo.json for Nx workspaces', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-patch-workspace-'));
    writeFileSync(join(dir, 'nx.json'), '{}\n', 'utf8');
    writeFileSync(join(dir, 'turbo.json'), '{}');

    const config = createDefaultConfig({
      type: 'nx',
      appProjects: ['shell', 'checkout'],
    });

    const results = patchWorkspaceConfig(dir, config);

    expect(results.filter((result) => result.patched)).toHaveLength(2);
  });
});
