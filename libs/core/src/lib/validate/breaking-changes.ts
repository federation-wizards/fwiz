import type { MfManifest } from '../registry/types.js';
import { isMajorVersionBump } from './shared-deps.js';
import type { ValidationIssue } from './types.js';

export function detectBreakingChanges(
  local: MfManifest,
  registry: MfManifest,
  remoteName: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const localVersion = local.metaData.buildInfo.buildVersion;
  const registryVersion = registry.metaData.buildInfo.buildVersion;

  if (isMajorVersionBump(registryVersion, localVersion)) {
    issues.push({
      level: 'warning',
      code: 'major-version-bump',
      message: `Remote "${remoteName}" has a major version bump from ${registryVersion} to ${localVersion}.`,
      remote: remoteName,
    });
  }

  const localExposeNames = new Set(local.exposes.map((expose) => expose.name));

  for (const expose of registry.exposes) {
    if (!localExposeNames.has(expose.name)) {
      issues.push({
        level: 'error',
        code: 'removed-expose',
        message: `Remote "${remoteName}" removed expose "${expose.name}" published in registry version ${registryVersion}.`,
        remote: remoteName,
      });
    }
  }

  for (const shared of local.shared) {
    const registryShared = registry.shared.find(
      (entry) => entry.name === shared.name,
    );

    if (
      registryShared &&
      isMajorVersionBump(registryShared.version, shared.version)
    ) {
      issues.push({
        level: 'warning',
        code: 'shared-major-bump',
        message: `Remote "${remoteName}" shared dependency "${shared.name}" has a major version bump from ${registryShared.version} to ${shared.version}.`,
        remote: remoteName,
      });
    }
  }

  return issues;
}
