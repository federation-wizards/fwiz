import type { PackageManifest } from '@federation-wizards/utils';

import type { SharedDependencyConfig } from '../config/types.js';

const SINGLETON_PACKAGES = new Set([
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  '@reduxjs/toolkit',
  'redux',
  'zustand',
  'styled-components',
  '@emotion/react',
  '@emotion/styled',
  'rxjs',
  '@angular/core',
  '@angular/common',
  '@angular/router',
]);

const EAGER_PACKAGES = new Set(['react', 'react-dom']);

export function shouldShareDependency(name: string): boolean {
  if (name.startsWith('workspace:')) {
    return false;
  }

  if (name.startsWith('@types/')) {
    return false;
  }

  return true;
}

export function recommendSingleton(name: string): boolean {
  return SINGLETON_PACKAGES.has(name);
}

export function recommendEager(name: string): boolean {
  return EAGER_PACKAGES.has(name);
}

function parseMajorVersion(version: string): number {
  const match = version.match(/(\d+)/);

  return match ? Number.parseInt(match[1], 10) : 0;
}

function compareVersionPreference(left: string, right: string): number {
  const majorDifference =
    parseMajorVersion(right) - parseMajorVersion(left);

  if (majorDifference !== 0) {
    return majorDifference;
  }

  return right.localeCompare(left);
}

export function recommendRequiredVersion(
  name: string,
  versions: string[],
  manifests: PackageManifest[],
): string {
  if (versions.length === 1) {
    return versions[0];
  }

  const rootManifest = manifests.find((manifest) => manifest.path === 'package.json');

  if (rootManifest) {
    const rootVersion =
      rootManifest.dependencies[name] ??
      rootManifest.devDependencies[name] ??
      rootManifest.peerDependencies[name];

    if (rootVersion) {
      return rootVersion;
    }

    if (name === 'react-dom') {
      const reactVersion =
        rootManifest.dependencies.react ??
        rootManifest.devDependencies.react ??
        rootManifest.peerDependencies.react;

      if (reactVersion) {
        const reactMajor = parseMajorVersion(reactVersion);
        const alignedVersion = versions.find(
          (version) => parseMajorVersion(version) === reactMajor,
        );

        if (alignedVersion) {
          return alignedVersion;
        }
      }
    }
  }

  const versionCounts = new Map<string, number>();

  for (const version of versions) {
    versionCounts.set(version, (versionCounts.get(version) ?? 0) + 1);
  }

  const [preferredVersion] = [...versionCounts.entries()].sort((left, right) =>
    right[1] - left[1] !== 0
      ? right[1] - left[1]
      : compareVersionPreference(left[0], right[0]),
  );

  return preferredVersion?.[0] ?? versions[0];
}

export function buildSharedRecommendation(
  name: string,
  versions: string[],
  manifests: PackageManifest[],
): SharedDependencyConfig {
  return {
    singleton: recommendSingleton(name),
    eager: recommendEager(name),
    requiredVersion: recommendRequiredVersion(name, versions, manifests),
  };
}
