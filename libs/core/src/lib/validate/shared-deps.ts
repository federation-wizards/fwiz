import type { FwizConfig } from '../config/types.js';
import type { MfManifest } from '../registry/types.js';
import type { ValidationIssue } from './types.js';

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseVersion(version: string): ParsedVersion | null {
  const normalized = version.trim().replace(/^[\^~>=<]+/, '');
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(normalized);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function normalizeRequiredVersion(required: string): string {
  return required.trim().replace(/^[\^~>=<]+/, '');
}

export function isMajorVersionBump(from: string, to: string): boolean {
  const source = parseVersion(from);
  const target = parseVersion(to);

  return !!(source && target && target.major > source.major);
}

export function satisfiesRequired(actual: string, required: string): boolean {
  const actualParsed = parseVersion(actual);

  if (!actualParsed) {
    return false;
  }

  const trimmed = required.trim();

  if (trimmed.startsWith('^')) {
    const req = parseVersion(trimmed.slice(1));

    if (!req || actualParsed.major !== req.major) {
      return false;
    }

    if (actualParsed.minor > req.minor) {
      return true;
    }

    if (actualParsed.minor < req.minor) {
      return false;
    }

    return actualParsed.patch >= req.patch;
  }

  if (trimmed.startsWith('~')) {
    const req = parseVersion(trimmed.slice(1));

    if (!req) {
      return false;
    }

    if (actualParsed.major !== req.major || actualParsed.minor !== req.minor) {
      return false;
    }

    return actualParsed.patch >= req.patch;
  }

  if (trimmed.startsWith('>=')) {
    const req = parseVersion(trimmed.slice(2));

    if (!req) {
      return false;
    }

    if (actualParsed.major > req.major) {
      return true;
    }

    if (actualParsed.major < req.major) {
      return false;
    }

    if (actualParsed.minor > req.minor) {
      return true;
    }

    if (actualParsed.minor < req.minor) {
      return false;
    }

    return actualParsed.patch >= req.patch;
  }

  return normalizeRequiredVersion(actual) === normalizeRequiredVersion(trimmed);
}

export function validateSharedDependenciesForManifest(
  config: FwizConfig,
  manifest: MfManifest,
  remoteName: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [name, depConfig] of Object.entries(config.shared)) {
    const manifestShared = manifest.shared.find((shared) => shared.name === name);

    if (!manifestShared) {
      issues.push({
        level: 'error',
        code: 'missing-shared-dependency',
        message: `Remote "${remoteName}" manifest is missing shared dependency "${name}" required by fwiz.config.yaml.`,
        remote: remoteName,
      });
      continue;
    }

    if (manifestShared.requiredVersion !== depConfig.requiredVersion) {
      issues.push({
        level: 'error',
        code: 'shared-required-version-mismatch',
        message: `Remote "${remoteName}" manifest requiredVersion for "${name}" is "${manifestShared.requiredVersion}" but fwiz.config.yaml specifies "${depConfig.requiredVersion}".`,
        remote: remoteName,
      });
    }

    if (depConfig.strictVersion) {
      const expected = normalizeRequiredVersion(depConfig.requiredVersion);
      const actual = normalizeRequiredVersion(manifestShared.version);

      if (actual !== expected) {
        issues.push({
          level: 'error',
          code: 'strict-version-mismatch',
          message: `Remote "${remoteName}" shared dependency "${name}" has version "${manifestShared.version}" but strictVersion requires "${depConfig.requiredVersion}".`,
          remote: remoteName,
        });
      }
    } else if (
      !satisfiesRequired(manifestShared.version, depConfig.requiredVersion)
    ) {
      issues.push({
        level: 'error',
        code: 'shared-version-out-of-range',
        message: `Remote "${remoteName}" shared dependency "${name}" version "${manifestShared.version}" does not satisfy requiredVersion "${depConfig.requiredVersion}".`,
        remote: remoteName,
      });
    }
  }

  return issues;
}

export function validateCrossRemoteSharedDependencies(
  manifests: Array<{ remote: string; manifest: MfManifest }>,
  config: FwizConfig,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (manifests.length <= 1) {
    return issues;
  }

  for (const [name, depConfig] of Object.entries(config.shared)) {
    if (!depConfig.singleton) {
      continue;
    }

    const versions = manifests.flatMap(({ remote, manifest }) => {
      const shared = manifest.shared.find((entry) => entry.name === name);

      if (!shared) {
        return [];
      }

      return [{ remote, version: shared.version }];
    });

    const uniqueVersions = new Set(
      versions.map((entry) => normalizeRequiredVersion(entry.version)),
    );

    if (uniqueVersions.size > 1) {
      const detail = versions
        .map((entry) => `${entry.remote}=${entry.version}`)
        .join(', ');

      issues.push({
        level: 'error',
        code: 'singleton-version-mismatch',
        message: `Singleton shared dependency "${name}" has inconsistent versions across remotes: ${detail}.`,
      });
    }
  }

  return issues;
}
