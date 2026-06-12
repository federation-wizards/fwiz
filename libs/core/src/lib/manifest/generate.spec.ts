import { describe, expect, it } from 'vitest';

import { generateMfManifest } from './generate.js';

describe('generateMfManifest', () => {
  it('generates a versioned mf-manifest.json shape for a remote', () => {
    const manifest = generateMfManifest({
      remote: { name: 'checkout', project: 'checkout', port: 4201 },
      version: '1.2.0',
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.0.0',
          eager: false,
        },
      },
      registry: {
        type: 'http',
        baseUrl: 'https://cdn.example.com/assets',
        prefix: 'mf',
      },
      buildId: 'test-build-id',
    });

    expect(manifest.id).toBe('test-build-id');
    expect(manifest.name).toBe('checkout');
    expect(manifest.metaData.buildInfo.buildVersion).toBe('1.2.0');
    expect(manifest.metaData.publicPath).toBe(
      'https://cdn.example.com/assets/mf/checkout/1.2.0/',
    );
    expect(manifest.shared).toHaveLength(1);
    expect(manifest.exposes[0]?.name).toBe('./Module');
    expect(manifest.remotes).toEqual([]);
  });
});
