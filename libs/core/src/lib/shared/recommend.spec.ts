import { describe, expect, it } from 'vitest';

import type { PackageManifest } from '@federation-wizards/utils';

import {
  buildSharedRecommendation,
  recommendRequiredVersion,
  recommendSingleton,
} from './recommend.js';

describe('recommend', () => {
  it('marks react packages as singletons', () => {
    expect(recommendSingleton('react')).toBe(true);
    expect(recommendSingleton('react-dom')).toBe(true);
    expect(recommendSingleton('lodash')).toBe(false);
  });

  it('prefers the root package.json version when versions conflict', () => {
    const manifests: PackageManifest[] = [
      {
        path: 'package.json',
        dependencies: { react: '^19.0.0' },
        devDependencies: {},
        peerDependencies: {},
      },
      {
        path: 'apps/shell/package.json',
        dependencies: { react: '^18.2.0' },
        devDependencies: {},
        peerDependencies: {},
      },
    ];

    expect(
      recommendRequiredVersion('react', ['^18.2.0', '^19.0.0'], manifests),
    ).toBe('^19.0.0');
  });

  it('builds shared recommendations with eager defaults for react', () => {
    const recommendation = buildSharedRecommendation(
      'react',
      ['^19.0.0'],
      [],
    );

    expect(recommendation).toEqual({
      singleton: true,
      eager: true,
      requiredVersion: '^19.0.0',
    });
  });
});
